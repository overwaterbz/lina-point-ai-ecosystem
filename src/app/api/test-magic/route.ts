import { NextRequest, NextResponse } from "next/server";
import { runContentAgent } from "@/lib/contentAgent";

/**
 * GET /api/test-magic
 * Test magic content generation with mock data
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[Test] Starting magic content generation test...");

    // Mock user preferences and questionnaire
    const mockUserPrefs = {
      name: "Emma & Alex",
      email: "test@example.com",
      interests: ["romance", "nature", "adventure"],
      music_taste: "ambient, indie-pop",
      special_requests: "Include references to our love story and the ocean",
      travel_dates: "February 14-17, 2026",
    };

    // Test case 1: Birthday song
    const birthdayResult = await runContentAgent(
      "test-reservation-1",
      mockUserPrefs,
      "birthday",
      "tropical-fusion"
    );

    // Test case 2: Anniversary video
    const anniversaryResult = await runContentAgent(
      "test-reservation-2",
      mockUserPrefs,
      "anniversary",
      "indie-pop"
    );

    return NextResponse.json({
      success: true,
      tests: [
        {
          occasion: "birthday",
          status: birthdayResult.status,
          song_url: birthdayResult.songUrl,
          video_url: birthdayResult.videoUrl,
          artwork_url: birthdayResult.artworkUrl,
          error: birthdayResult.errorMessage || null,
        },
        {
          occasion: "anniversary",
          status: anniversaryResult.status,
          song_url: anniversaryResult.songUrl,
          video_url: anniversaryResult.videoUrl,
          artwork_url: anniversaryResult.artworkUrl,
          error: anniversaryResult.errorMessage || null,
        },
      ],
      summary: {
        total_tests: 2,
        passed: [birthdayResult, anniversaryResult].filter(r => r.status === "completed").length,
        failed: [birthdayResult, anniversaryResult].filter(r => r.status === "failed").length,
      },
    });

  } catch (error) {
    console.error("[Test] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
