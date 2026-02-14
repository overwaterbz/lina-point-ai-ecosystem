import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { runPriceScout } from "@/lib/priceScoutAgent";
import { runExperienceCurator } from "@/lib/experienceCuratorAgent";
import type { UserPreferences } from "@/lib/experienceCuratorAgent";
import { randomUUID } from "crypto";

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

    // Create a booking session id to tie tours + payment together
    const bookingId = randomUUID();

    // Save tour bookings and attach booking id
    const tourInserts = curatorResult.tours.map((tour: any) => ({
      user_id: user.id,
      booking_id: bookingId,
      tour_name: tour.name,
      tour_type: tour.type,
      price: tour.price,
      affiliate_link: tour.url,
      commission_earned: tour.price * 0.1, // 10% commission
      status: "pending_payment",
    }));

    const { error: tourInsertError } = await supabase.from("tour_bookings").insert(tourInserts);
    if (tourInsertError) {
      console.warn("[BookFlow] Failed to insert tour_bookings:", tourInsertError.message);
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

    // 📊 Track analytics for booking analysis
    const totalAffiliateCommission = curatorResult.affiliateLinks.reduce(
      (sum: number, link: any) => sum + (link.commission || 0),
      0
    );

    // A/B testing variant selection (based on user ID)
    const experimentVariants = ["control", "variant_a", "variant_b"];
    const experimentVariant = experimentVariants[user.id.charCodeAt(0) % experimentVariants.length];

    try {
      const { error: analyticsError } = await supabase
        .from("booking_analytics")
        .insert({
          user_id: user.id,
          room_type: body.roomType,
          check_in_date: body.checkInDate,
          check_out_date: body.checkOutDate,
          original_price: priceScoutResult.bestPrice,
          beat_price: priceScoutResult.beatPrice,
          savings_percent: priceScoutResult.savingsPercent,
          best_ota: priceScoutResult.bestOTA,
          selected_tours: curatorResult.tours.map((t: any) => t.name),
          total_cost: response.curated_package.total,
          affiliate_commission: totalAffiliateCommission,
          experiment_variant: experimentVariant,
          grok_used: !!process.env.GROK_API_KEY,
          created_at: new Date(),
        });

      if (analyticsError) {
        console.warn("[BookFlow] Analytics tracking failed:", analyticsError.message);
      } else {
        console.log(`[BookFlow] Analytics tracked for user ${user.id}`);
      }
    } catch (analyticsErr) {
      console.warn("[BookFlow] Error saving analytics:", analyticsErr);
      // Don't fail the response if analytics fails
    }

    // If Stripe is configured, verify bookings exist then create a PaymentIntent and return client_secret
    let clientSecret: string | null = null;
    try {
      const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
      if (stripeSecret) {
        // Verify that tour_bookings were inserted and belong to this user/booking
        const { data: existingTours, error: existingErr } = await supabase
          .from('tour_bookings')
          .select('id')
          .eq('booking_id', bookingId)
          .eq('user_id', user.id)
          .limit(1);

        if (existingErr) {
          console.warn('[BookFlow] Error checking tour_bookings before creating PaymentIntent:', existingErr.message);
        }

        if (existingTours && existingTours.length > 0) {
          const StripeLib = (await import('stripe')).default;
          const stripe = new StripeLib(stripeSecret);

          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(response.curated_package.total * 100),
            currency: 'usd',
            metadata: {
              booking_id: bookingId,
              user_id: user.id,
            },
          });

          clientSecret = paymentIntent.client_secret || null;
        } else {
          console.warn('[BookFlow] No tour_bookings found for booking, skipping PaymentIntent creation');
        }
      }
    } catch (stripeErr: any) {
      console.warn('[BookFlow] Stripe PaymentIntent creation failed:', stripeErr?.message || stripeErr);
    }

    // Include client_secret in response when available
    const responseWithPayment = { ...response } as any;
    if (clientSecret) responseWithPayment.client_secret = clientSecret;

    return NextResponse.json(responseWithPayment, { status: 200 });
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
