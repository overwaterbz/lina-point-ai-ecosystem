import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { runPriceScout } from "@/lib/agents/priceScoutAgent";
import { runExperienceCurator } from "@/lib/agents/experienceCuratorAgent";
import type { UserPreferences } from "@/lib/agents/experienceCuratorAgent";

interface BookFlowRequest {
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  location: string;
  groupSize: number;
  tourBudget: number;
  interests?: string[];
  activityLevel?: "low" | "medium" | "high";
}

interface BookFlowResponse {
  success: boolean;
  beat_price: number;
  savings_percent: number;
  curated_package: {
    room: {
      price: number;
      ota: string;
      url: string;
    };
    tours: Array<{
      name: string;
      type: string;
      price: number;
      duration: string;
    }>;
    dinner: {
      name: string;
      price: number;
    };
    total: number;
    affiliate_links: Array<{
      provider: string;
      url: string;
      commission: number;
    }>;
  };
  recommendations: string[];
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<BookFlowResponse>> {
  try {
    // Get user session
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          beat_price: 0,
          savings_percent: 0,
          curated_package: {
            room: { price: 0, ota: "", url: "" },
            tours: [],
            dinner: { name: "", price: 0 },
            total: 0,
            affiliate_links: [],
          },
          recommendations: [],
          error: "Unauthorized: Please log in",
        },
        { status: 401 }
      );
    }

    // Get request body
    const body: BookFlowRequest = await request.json();

    // Fetch user preferences from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("interests, activity_level")
      .eq("id", user.id)
      .single();

    const userPreferences: UserPreferences = {
      interests: body.interests || profile?.interests || ["snorkeling", "dining"],
      activityLevel: body.activityLevel || profile?.activity_level || "medium",
      budget:
        body.tourBudget > 500
          ? "luxury"
          : body.tourBudget > 300
            ? "mid"
            : "budget",
    };

    console.log("[BookFlow] Starting agents for user:", user.id);
    console.log("[BookFlow] Room Query:", body.roomType);
    console.log("[BookFlow] User Preferences:", userPreferences);

    // Run PriceScout Agent
    console.log("[BookFlow] Running PriceScout Agent...");
    const priceScoutResult = await runPriceScout(
      body.roomType,
      body.checkInDate,
      body.checkOutDate,
      body.location
    );

    console.log("[BookFlow] PriceScout Result:", priceScoutResult);

    // Run ExperienceCurator Agent
    console.log("[BookFlow] Running ExperienceCurator Agent...");
    const curatorResult = await runExperienceCurator(
      userPreferences,
      body.groupSize,
      body.tourBudget
    );

    console.log("[BookFlow] Curator Result:", curatorResult);

    // Save prices to database
    await supabase.from("prices").insert({
      room_type: body.roomType,
      check_in_date: body.checkInDate,
      check_out_date: body.checkOutDate,
      location: body.location,
      ota_name: priceScoutResult.bestOTA,
      price: priceScoutResult.bestPrice,
      beat_price: priceScoutResult.beatPrice,
      url: priceScoutResult.priceUrl,
      user_id: user.id,
    });

    // Save tour bookings
    for (const tour of curatorResult.tours) {
      await supabase.from("tour_bookings").insert({
        user_id: user.id,
        tour_name: tour.name,
        tour_type: tour.type,
        price: tour.price,
        affiliate_link: tour.url,
        commission_earned: tour.price * 0.1, // 10% commission
        status: "pending",
      });
    }

    // Calculate dining price (assume included in package or add separately)
    const diningTour = curatorResult.tours.find((t: any) => t.type === "dining");
    const diningPrice = diningTour?.price || 85;

    // Compile response
    const response: BookFlowResponse = {
      success: true,
      beat_price: priceScoutResult.beatPrice,
      savings_percent: priceScoutResult.savingsPercent,
      curated_package: {
        room: {
          price: priceScoutResult.bestPrice,
          ota: priceScoutResult.bestOTA,
          url: priceScoutResult.priceUrl,
        },
        tours: curatorResult.tours
          .filter((t: any) => t.type !== "dining")
          .map((t: any) => ({
            name: t.name,
            type: t.type,
            price: t.price,
            duration: t.duration,
          })),
        dinner: {
          name: diningTour?.name || "Sunset Beachfront Dinner",
          price: diningPrice,
        },
        total:
          priceScoutResult.bestPrice +
          curatorResult.totalPrice +
          (diningTour ? 0 : diningPrice),
        affiliate_links: curatorResult.affiliateLinks,
      },
      recommendations: curatorResult.recommendations,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[BookFlow] Error:", error);

    return NextResponse.json(
      {
        success: false,
        beat_price: 0,
        savings_percent: 0,
        curated_package: {
          room: { price: 0, ota: "", url: "" },
          tours: [],
          dinner: { name: "", price: 0 },
          total: 0,
          affiliate_links: [],
        },
        recommendations: [],
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
