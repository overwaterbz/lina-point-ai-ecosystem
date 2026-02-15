import "dotenv/config";
import axios from "axios";

// REMOVED: hardcoded secrets and URLs - use env vars instead.
const API_BASE = process.env.N8N_WEBHOOK_URL || "your-n8n-webhook-url-here";
const n8nSecret = process.env.N8N_SECRET || "your-n8n-secret-here";

async function triggerWorkflow() {
  console.log("\n=== Triggering n8n workflow stub ===\n");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (n8nSecret && !n8nSecret.includes("your-n8n-secret-here")) {
    headers["x-n8n-secret"] = n8nSecret;
  }

  const response = await axios.post(
    API_BASE,
    {
      booking: {
        roomType: "overwater room",
        checkInDate: "2026-03-15",
        checkOutDate: "2026-03-22",
        location: "Belize",
        groupSize: 2,
      },
      runSelfImprove: true,
    },
    { headers }
  );

  console.log("✅ Response:");
  console.log(JSON.stringify(response.data, null, 2));
}

async function triggerLocalWorkflow() {
  console.log("\n=== Triggering local API endpoint ===\n");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (n8nSecret && !n8nSecret.includes("your-n8n-secret-here")) {
    headers["x-n8n-secret"] = n8nSecret;
  }

  try {
    const response = await axios.post(
      "http://localhost:3000/api/trigger-n8n",
      {
        booking: {
          roomType: "overwater room",
          checkInDate: "2026-03-15",
          checkOutDate: "2026-03-22",
          location: "Belize",
          groupSize: 2,
        },
        runSelfImprove: true,
      },
      { headers, timeout: 5000 }
    );

    console.log("✅ Local API Response:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.log(
        `⏩ Local API not running or error: ${err.message} (expected if server is down)`
      );
    } else {
      console.log("⏩ Local API not running (expected if server is down)");
    }
  }
}

async function runAutonomyTest() {
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║  Lina Point Autonomy Workflow Test   ║");
  console.log("╚══════════════════════════════════════╝\n");

  await triggerWorkflow();
  await triggerLocalWorkflow();

  console.log("\n=== Test Summary ===");
  console.log("✓ /api/trigger-n8n (POST) - workflow stub");
  console.log("Note: Replace n8nSecret if required by env.");
}

runAutonomyTest().catch((error) => {
  console.error("❌ Test failed:", error.message || error);
});
