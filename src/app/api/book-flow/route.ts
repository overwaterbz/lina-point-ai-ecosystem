import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { runPriceScout } from "@/lib/priceScoutAgent";
import { runExperienceCurator } from "@/lib/experienceCuratorAgent";
import type { UserPreferences } from "@/lib/experienceCuratorAgent";
import { randomUUID } from "crypto";
import { createAgentRun, finishAgentRun } from "@/lib/agents/agentRunLogger";
import { generateMagicContent } from "@/lib/magicContent";

interface BookFlowRequest {
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  location: string;
  groupSize: number;
  tourBudget: number;
  interests?: string[];
  activityLevel?: "low" | "medium" | "high";
  addOns?: string[];
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

    const requestId = randomUUID();

    // Run PriceScout Agent
    console.log("[BookFlow] Running PriceScout Agent...");
    let priceRunId: string | null = null;
    const priceRunStart = Date.now();
    let priceScoutResult: Awaited<ReturnType<typeof runPriceScout>>;

    try {
      try {
        priceRunId = await createAgentRun(supabase as any, {
          user_id: user.id,
          agent_name: "price_scout",
          request_id: requestId,
          input: JSON.stringify({
            roomType: body.roomType,
            checkInDate: body.checkInDate,
            checkOutDate: body.checkOutDate,
            location: body.location,
          }) as any,
        });
      } catch (logError) {
        console.warn("[BookFlow] Failed to create PriceScout run:", logError);
      }

      priceScoutResult = await runPriceScout(
        body.roomType,
        body.checkInDate,
        body.checkOutDate,
        body.location
      );

      if (priceRunId) {
        try {
          await finishAgentRun(supabase as any, priceRunId, {
            status: "completed",
            output: JSON.stringify(priceScoutResult) as any,
            duration_ms: Date.now() - priceRunStart,
          });
        } catch (logError) {
          console.warn("[BookFlow] Failed to finalize PriceScout run:", logError);
        }
      }
    } catch (agentError) {
      if (priceRunId) {
        try {
          await finishAgentRun(supabase as any, priceRunId, {
            status: "failed",
            error_message: agentError instanceof Error ? agentError.message : String(agentError),
            duration_ms: Date.now() - priceRunStart,
          });
        } catch (logError) {
          console.warn("[BookFlow] Failed to finalize PriceScout run:", logError);
        }
      }
      throw agentError;
    }

    console.log("[BookFlow] PriceScout Result:", priceScoutResult);

    // Run ExperienceCurator Agent
    console.log("[BookFlow] Running ExperienceCurator Agent...");
    let curatorRunId: string | null = null;
    const curatorRunStart = Date.now();
    let curatorResult: Awaited<ReturnType<typeof runExperienceCurator>>;

    try {
      try {
        curatorRunId = await createAgentRun(supabase as any, {
          user_id: user.id,
          agent_name: "experience_curator",
          request_id: requestId,
          input: JSON.stringify({
            userPreferences,
            groupSize: body.groupSize,
            tourBudget: body.tourBudget,
          }) as any,
        });
      } catch (logError) {
        console.warn("[BookFlow] Failed to create Curator run:", logError);
      }

      curatorResult = await runExperienceCurator(
        userPreferences,
        body.groupSize,
        body.tourBudget
      );

      if (curatorRunId) {
        try {
          await finishAgentRun(supabase as any, curatorRunId, {
            status: "completed",
            output: JSON.stringify(curatorResult) as any,
            duration_ms: Date.now() - curatorRunStart,
          });
        } catch (logError) {
          console.warn("[BookFlow] Failed to finalize Curator run:", logError);
        }
      }
    } catch (agentError) {
      if (curatorRunId) {
        try {
          await finishAgentRun(supabase as any, curatorRunId, {
            status: "failed",
            error_message: agentError instanceof Error ? agentError.message : String(agentError),
            duration_ms: Date.now() - curatorRunStart,
          });
        } catch (logError) {
          console.warn("[BookFlow] Failed to finalize Curator run:", logError);
        }
      }
      throw agentError;
    }

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

    const { data: tourRows, error: tourInsertError } = await supabase
      .from("tour_bookings")
      .insert(tourInserts)
      .select("id");
    if (tourInsertError) {
      console.warn("[BookFlow] Failed to insert tour_bookings:", tourInsertError.message);
    }

    const reservationId = tourRows?.[0]?.id || null;

    if (body.addOns?.includes("magic") && reservationId) {
      try {
        const { data: magicProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        await generateMagicContent(
          supabase as any,
          {
            userId: user.id,
            reservationId,
            occasion: "celebration",
            musicStyle: magicProfile?.music_style || undefined,
            userEmail: user.email,
          },
          magicProfile
        );
      } catch (magicError) {
        console.warn("[BookFlow] Magic content generation failed:", magicError);
      }
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
