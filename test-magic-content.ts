import axios from "axios";

const API_BASE = "http://localhost:3000";

const reservationId = "REPLACE_WITH_RESERVATION_ID";
const accessToken = "REPLACE_WITH_SUPABASE_ACCESS_TOKEN";

async function callMagic(occasion: string, musicStyle: string, mood: string) {
  console.log(`\n=== Generating magic content (${occasion}) ===`);

  try {
    const response = await axios.post(
      `${API_BASE}/api/gen-magic-content`,
      {
        reservationId,
        occasion,
        musicStyle,
        mood,
        recipientName: "Maya Guest",
        giftYouName: "Lina Point Resort",
        message: "Thank you for an unforgettable stay!",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("✅ Response:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    if (error.response) {
      console.log("❌ Error Response:", error.response.status);
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      console.log("❌ Error:", error.message);
    }
  }
}

async function runTests() {
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║  Lina Point Magic Content API Tests  ║");
  console.log("╚══════════════════════════════════════╝\n");

  await callMagic("birthday", "ambient", "romantic");
  await callMagic("anniversary", "tropical", "celebratory");

  console.log("\n=== Test Summary ===");
  console.log("✓ /api/gen-magic-content (POST) - magic content generation");
  console.log("Note: Replace reservationId and accessToken before running.");
}

runTests();
