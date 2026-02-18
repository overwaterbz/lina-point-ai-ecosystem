"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { runSelfImprovementAndPersist } from "@/lib/agents/selfImprovementAgent";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) {
    throw new Error("Supabase service role not configured");
  }
  return createClient(url, key);
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function triggerN8nAction() {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  const response = await fetch(`${getBaseUrl()}/api/trigger-n8n`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "x-n8n-secret": secret } : {}),
    },
    body: JSON.stringify({ source: "admin-dashboard" }),
  });

  revalidatePath("/admin/dashboard");
}

export async function runSelfImproveAction() {
  const supabase = getSupabaseAdmin();

  const { data: agentRuns } = await supabase
    .from("agent_runs")
    .select("id, agent_name, status, duration_ms, started_at")
    .order("started_at", { ascending: false })
    .limit(50);

  const { data: bookings } = await supabase
    .from("booking_analytics")
    .select("id, room_type, total_cost, savings_percent, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, music_style, maya_interests, opt_in_magic")
    .limit(50);

  const logsSummary = `Agent runs: ${agentRuns?.length || 0}`;
  const bookingSummary = `Bookings: ${bookings?.length || 0}`;
  const prefsSummary = `Profiles sampled: ${profiles?.length || 0}`;
  const conversionSummary = `Recent bookings total: ${bookings
    ?.map((b: any) => b.total_cost || 0)
    .reduce((sum: number, value: number) => sum + value, 0) || 0}`;

  await runSelfImprovementAndPersist(supabase as any, {
    logsSummary,
    bookingSummary,
    prefsSummary,
    conversionSummary,
  });

  revalidatePath("/admin/dashboard");
}
