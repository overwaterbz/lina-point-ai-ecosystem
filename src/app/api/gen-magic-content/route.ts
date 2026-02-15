import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runContentAgent } from "@/lib/contentAgent";
import { createAgentRun, finishAgentRun } from "@/lib/agents/agentRunLogger";

// Server-only Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/gen-magic-content
 * Generate personalized song/video for a reservation
 * 
 * Request body:
 * {
 *   "reservationId": "uuid",
 *   "occasion": "birthday|anniversary|proposal|renewal",
 *   "genre": "ambient|indie-pop|tropical-fusion" (default: ambient)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const { reservationId, occasion, genre = "ambient" } = await request.json();

    if (!reservationId || !occasion) {
      return NextResponse.json(
        { error: "Missing reservationId or occasion" },
        { status: 400 }
      );
    }

    // Fetch reservation and verify ownership
    const { data: booking, error: bookingError } = await supabase
      .from("tour_bookings")
      .select("*")
      .eq("id", reservationId)
      .eq("user_id", user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Check if reservation includes "magic" add-on
    const magicIncluded = booking.add_ons?.includes("magic") ?? false;
    if (!magicIncluded) {
      return NextResponse.json(
        { error: "Magic add-on not included in reservation" },
        { status: 400 }
      );
    }

    // Fetch user preferences/profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.warn("Could not fetch profile:", profileError);
    }

    if (!profile?.opt_in_magic) {
      return NextResponse.json(
        { error: "Magic agent not enabled in profile" },
        { status: 403 }
      );
    }

    const userPrefs = profile || {
      name: user.user_metadata?.name || "Guest",
      email: user.email,
    };

    console.log(`[API] Generating magic content for ${reservationId}`);
    console.log(`[API] Occasion: ${occasion}, Genre: ${genre}`);

    // Create preliminary magic_content record
    const { data: magicRecord, error: insertError } = await supabase
      .from("magic_content")
      .insert({
        reservation_id: reservationId,
        user_id: user.id,
        occasion,
        genre,
        content_type: "both", // Song + Video
        status: "processing",
        user_prefs: userPrefs,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create magic record:", insertError);
      return NextResponse.json(
        { error: "Failed to create content record" },
        { status: 500 }
      );
    }

    // Run ContentAgent
    let contentResult;
    let runId: string | null = null;
    const runStart = Date.now();

    try {
      try {
        runId = await createAgentRun(supabase as any, {
          user_id: user.id,
          agent_name: "content_magic",
          request_id: reservationId,
          input: { reservationId, occasion, genre, userPrefs },
        });
      } catch (logError) {
        console.warn("Failed to create agent run:", logError);
      }

      contentResult = await runContentAgent(
        reservationId,
        userPrefs,
        occasion,
        genre
      );

      if (runId) {
        try {
          await finishAgentRun(supabase as any, runId, {
            status: "completed",
            output: contentResult,
            duration_ms: Date.now() - runStart,
          });
        } catch (logError) {
          console.warn("Failed to finalize agent run:", logError);
        }
      }
    } catch (agentError) {
      if (runId) {
        try {
          await finishAgentRun(supabase as any, runId, {
            status: "failed",
            error_message: agentError instanceof Error ? agentError.message : String(agentError),
            duration_ms: Date.now() - runStart,
          });
        } catch (logError) {
          console.warn("Failed to finalize agent run:", logError);
        }
      }

      // Update record with error
      await supabase
        .from("magic_content")
        .update({
          status: "failed",
          error_message: agentError instanceof Error ? agentError.message : String(agentError),
        })
        .eq("id", magicRecord.id);

      return NextResponse.json(
        {
          success: false,
          error: "Content generation failed",
          message: agentError instanceof Error ? agentError.message : String(agentError),
        },
        { status: 500 }
      );
    }

    // Update magic_content record with results
    const { error: updateError } = await supabase
      .from("magic_content")
      .update({
        status: contentResult.status,
        song_url: contentResult.songUrl,
        video_url: contentResult.videoUrl,
        artwork_url: contentResult.artworkUrl,
        suno_track_id: contentResult.sunoTrackId,
        suno_grok_prompt: contentResult.grokPrompt,
        error_message: contentResult.errorMessage || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", magicRecord.id);

    if (updateError) {
      console.error("Failed to update magic record:", updateError);
    }

    // Log URLs (would send email here in production)
    console.log(`[API] Generated magic content:`);
    console.log(`  Song: ${contentResult.songUrl}`);
    console.log(`  Video: ${contentResult.videoUrl}`);
    console.log(`  Artwork: ${contentResult.artworkUrl}`);

    return NextResponse.json({
      success: contentResult.status === "completed",
      magicId: magicRecord.id,
      media: {
        song_url: contentResult.songUrl,
        video_url: contentResult.videoUrl,
        artwork_url: contentResult.artworkUrl,
      },
      message: contentResult.status === "completed"
        ? `✨ "${contentResult.grokPrompt && JSON.parse(contentResult.grokPrompt).title || 'Your Song'}" created! Download your personalized magic content.`
        : contentResult.errorMessage,
      status: contentResult.status,
    });

  } catch (error) {
    console.error("[API] Error in gen-magic-content:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
