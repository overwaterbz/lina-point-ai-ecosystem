/**
 * Integration: Trigger marketing campaign when new booking is created
 * 
 * This module watches for new bookings and triggers personalized marketing
 * campaigns for guests based on their booking details
 */

import { createClient } from "@supabase/supabase-js";
import { runMarketingCrew, type CampaignBrief } from "@/lib/agents/marketingAgentCrew";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export interface BookingData {
  userId: string;
  userEmail: string;
  userName: string;
  checkInDate: Date;
  checkOutDate: Date;
  roomType: string;
  guests: number;
  totalAmount: number;
}

/**
 * Trigger targeted marketing campaign for new booking
 */
export async function triggerPostBookingCampaign(bookingData: BookingData) {
  console.log(`📨 [BookingIntegration] Triggering post-booking campaign for ${bookingData.userName}`);

  try {
    // Create personalized campaign brief
    const campaignBrief: CampaignBrief = {
      campaignId: `post-booking-${Date.now()}`,
      objective: "engagement",
      targetAudience: `Guest: ${bookingData.userName}`,
      keyMessages: [
        "Your magic awaits",
        "Prepare for transformation",
        "The magic is YOU",
        `${bookingData.roomType} experience preview`
      ],
      platforms: ["email"],
      startDate: new Date(),
      endDate: bookingData.checkInDate
    };

    // Run immediate email campaign
    const crewResult = await runMarketingCrew(campaignBrief);

    // Save campaign to database
    const { data: campaign, error: campaignError } = await supabase
      .from("marketing_campaigns")
      .insert({
        name: `Post-Booking: ${bookingData.userName}`,
        objective: "engagement",
        target_audience: bookingData.userEmail,
        key_messages: campaignBrief.keyMessages,
        platforms: ["email"],
        status: "completed",
        research_data: crewResult.researchData,
        generated_content: crewResult.generatedContent,
        scheduled_posts: crewResult.scheduleStatus,
        engagement_campaigns: crewResult.engagementCampaigns,
        metrics: crewResult.currentMetrics
      })
      .select()
      .single();

    if (campaignError) {
      console.error("Failed to save post-booking campaign:", campaignError);
    }

    // Send welcome email immediately
    if (crewResult.generatedContent.length > 0) {
      const welcomeEmail = crewResult.generatedContent.find(c => c.type === "email");
      if (welcomeEmail) {
        await sendWelcomeEmail(bookingData.userEmail, bookingData.userName, welcomeEmail.content);
      }
    }

    console.log(`✅ [BookingIntegration] Post-booking campaign completed for ${bookingData.userName}`);

    return {
      success: true,
      campaignId: campaign?.id,
      contentGenerated: crewResult.generatedContent.length
    };
  } catch (error) {
    console.error("Post-booking campaign error:", error);
    return {
      success: false,
      error: String(error)
    };
  }
}

/**
 * Send welcome email (mock - integrate with your email service)
 */
async function sendWelcomeEmail(email: string, name: string, content: string) {
  console.log(`📧 [BookingIntegration] Sending welcome email to ${email}`);
  
  // In production, integrate with SendGrid, Mailgun, Resend, etc.
  // Example with Resend:
  /*
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'Lina Point <maya@linapointresort.com>',
    to: email,
    subject: `Welcome ${name}! Your Magic Awaits`,
    html: content
  });
  */
  
  // For now, log and store in database
  const { error } = await supabase
    .from("marketing_email_list")
    .upsert({
      email,
      first_name: name.split(" ")[0],
      interests: ["booked_guest", "overwater_luxury"],
      engagement_level: "new",
      email_sent_count: 1,
      last_email_sent: new Date().toISOString()
    });

  if (error) {
    console.error("Failed to track email send:", error);
  }
}

/**
 * Trigger re-engagement campaign for past guests
 */
export async function triggerReEngagementCampaign(pastGuests: { email: string; name: string; lastVisit: Date }[]) {
  console.log(`🔁 [BookingIntegration] Triggering re-engagement campaign for ${pastGuests.length} past guests`);

  try {
    const campaignBrief: CampaignBrief = {
      campaignId: `re-engagement-${Date.now()}`,
      objective: "direct_bookings",
      targetAudience: "Past guests",
      keyMessages: [
        "We miss your magic",
        "Return to paradise",
        "Special returning guest offer",
        "The magic is calling you back"
      ],
      platforms: ["email"],
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    const crewResult = await runMarketingCrew(campaignBrief);

    // Schedule emails to past guests
    for (const guest of pastGuests) {
      const emailContent = crewResult.generatedContent.find(c => c.type === "email");
      if (emailContent) {
        await scheduleGuestEmail(guest.email, guest.name, emailContent.content, "re-engagement");
      }
    }

    return {
      success: true,
      guestsContacted: pastGuests.length
    };
  } catch (error) {
    console.error("Re-engagement campaign error:", error);
    return {
      success: false,
      error: String(error)
    };
  }
}

/**
 * Schedule email for later delivery
 */
async function scheduleGuestEmail(email: string, name: string, content: string, campaignType: string) {
  const { error } = await supabase
    .from("marketing_content")
    .insert({
      campaign_id: null, // Will be linked if needed
      type: "email",
      platform: "email",
      title: `${campaignType} email for ${name}`,
      content,
      status: "scheduled",
      scheduled_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Next day
    });

  if (error) {
    console.error("Failed to schedule email:", error);
  }
}
