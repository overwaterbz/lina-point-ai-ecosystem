import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateRequest } from 'twilio/lib/webhooks/webhooks';
import crypto from 'crypto';
import { runWhatsAppConciergeAgent } from '@/lib/agents/whatsappConciergeAgent';
import { normalizePhoneNumber, sendWhatsAppMessage } from '@/lib/whatsapp';
import { runPriceScout } from '@/lib/priceScoutAgent';
import { runExperienceCurator } from '@/lib/experienceCuratorAgent';
import { createAgentRun, finishAgentRun } from '@/lib/agents/agentRunLogger';
import { runContentAgent } from '@/lib/contentAgent';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function requireWebhookUrl() {
  const url = process.env.TWILIO_WEBHOOK_URL;
  if (!url) throw new Error('TWILIO_WEBHOOK_URL not configured');
  return url;
}

export async function POST(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase service role not configured');
    }

    if (!process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('TWILIO_AUTH_TOKEN not configured');
    }

    const signature = request.headers.get('x-twilio-signature') || '';
    const webhookUrl = requireWebhookUrl();
    const formData = await request.formData();

    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = String(value);
    });

    const isValid = validateRequest(
      process.env.TWILIO_AUTH_TOKEN || '',
      signature,
      webhookUrl,
      params
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const fromRaw = params.From || '';
    const message = params.Body || '';
    const messageSid = params.MessageSid || null;
    const phone = normalizePhoneNumber(fromRaw);

    if (!phone || !message) {
      return NextResponse.json({ error: 'Missing phone or message' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone_number', phone)
      .maybeSingle();

    const { data: existingSession } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('phone_number', phone)
      .maybeSingle();

    const sessionContext = (existingSession?.context as any) || { messages: [], pending_action: null };

    let sessionId = existingSession?.id || null;
    const nowIso = new Date().toISOString();

    if (!existingSession) {
      const { data: newSession } = await supabase
        .from('whatsapp_sessions')
        .insert({
          phone_number: phone,
          user_id: profile?.user_id || null,
          last_message: message,
          context: sessionContext,
          last_inbound_at: nowIso,
          updated_at: nowIso,
        })
        .select()
        .single();

      if (newSession?.id) {
        sessionId = newSession.id;
        await supabase
          .from('whatsapp_messages')
          .insert({
            session_id: newSession.id,
            user_id: profile?.user_id || null,
            phone_number: phone,
            direction: 'inbound',
            body: message,
            twilio_sid: messageSid,
          });
      }
    } else {
      await supabase
        .from('whatsapp_messages')
        .insert({
          session_id: sessionId,
          user_id: profile?.user_id || null,
          phone_number: phone,
          direction: 'inbound',
          body: message,
          twilio_sid: messageSid,
        });
    }

    const runStart = Date.now();
    let conciergeRunId: string | null = null;

    if (profile?.user_id) {
      try {
        conciergeRunId = await createAgentRun(supabase as any, {
          user_id: profile.user_id,
          agent_name: 'whatsapp_concierge',
          request_id: messageSid || undefined,
          input: { message, phone },
        });
      } catch (logError) {
        console.warn('[WhatsApp] Failed to create agent run:', logError);
      }
    }

    const agentResult = await runWhatsAppConciergeAgent({
      message,
      phone,
      profile,
      sessionContext,
    });

    if (conciergeRunId) {
      try {
        await finishAgentRun(supabase as any, conciergeRunId, {
          status: 'completed',
          output: { reply: agentResult.replyText, action: agentResult.action },
          duration_ms: Date.now() - runStart,
        });
      } catch (logError) {
        console.warn('[WhatsApp] Failed to finalize agent run:', logError);
      }
    }

    let replyText = agentResult.replyText;
    const pending = agentResult.updatedContext.pending_action;
    let actionHandled = false;

    if (pending?.type === 'book_flow') {
      const data = pending.data || {};
      if (!data.checkInDate || !data.checkOutDate) {
        replyText = `${replyText}\n\nTo start booking, send dates like 2026-03-10 to 2026-03-14.`;
      } else if (!profile?.user_id) {
        replyText = `${replyText}\n\nPlease sign up with the same WhatsApp number so I can book for you.`;
      } else {
        actionHandled = true;
        let priceRunId: string | null = null;
        try {
          priceRunId = await createAgentRun(supabase as any, {
            user_id: profile.user_id,
            agent_name: 'price_scout',
            request_id: messageSid || undefined,
            input: data,
          });
        } catch (logError) {
          console.warn('[WhatsApp] Failed to create PriceScout run:', logError);
        }

        const priceResult = await runPriceScout(
          data.roomType || 'overwater room',
          data.checkInDate,
          data.checkOutDate,
          data.location || 'Belize'
        );

        if (priceRunId) {
          try {
            await finishAgentRun(supabase as any, priceRunId, {
              status: 'completed',
              output: JSON.stringify(priceResult) as any,
              duration_ms: Date.now() - runStart,
            });
          } catch (logError) {
            console.warn('[WhatsApp] Failed to finalize PriceScout run:', logError);
          }
        }

        let curatorRunId: string | null = null;
        try {
          curatorRunId = await createAgentRun(supabase as any, {
            user_id: profile.user_id,
            agent_name: 'experience_curator',
            request_id: messageSid || undefined,
            input: { groupSize: data.groupSize || 2, tourBudget: data.tourBudget || 500 },
          });
        } catch (logError) {
          console.warn('[WhatsApp] Failed to create Curator run:', logError);
        }

        const curatorResult = await runExperienceCurator(
          {
            interests: data.interests || ['snorkeling', 'dining'],
            activityLevel: data.activityLevel || 'medium',
            budget: data.tourBudget > 500 ? 'luxury' : data.tourBudget > 300 ? 'mid' : 'budget',
          },
          data.groupSize || 2,
          data.tourBudget || 500
        );

        if (curatorRunId) {
          try {
            await finishAgentRun(supabase as any, curatorRunId, {
              status: 'completed',
              output: JSON.stringify(curatorResult) as any,
              duration_ms: Date.now() - runStart,
            });
          } catch (logError) {
            console.warn('[WhatsApp] Failed to finalize Curator run:', logError);
          }
        }

        await supabase.from('prices').insert({
          room_type: data.roomType || 'overwater room',
          check_in_date: data.checkInDate,
          check_out_date: data.checkOutDate,
          location: data.location || 'Belize',
          ota_name: priceResult.bestOTA,
          price: priceResult.bestPrice,
          beat_price: priceResult.beatPrice,
          url: priceResult.priceUrl,
          user_id: profile.user_id,
        });

        const bookingId = crypto.randomUUID();
        await supabase.from('tour_bookings').insert(
          curatorResult.tours.map((tour: any) => ({
            user_id: profile.user_id,
            booking_id: bookingId,
            tour_name: tour.name,
            tour_type: tour.type,
            price: tour.price,
            affiliate_link: tour.url,
            commission_earned: tour.price * 0.1,
            status: 'pending_payment',
          }))
        );

        replyText = `I found a direct beat price of $${priceResult.beatPrice} (save ${priceResult.savingsPercent}%). Top tours: ${curatorResult.tours
          .slice(0, 2)
          .map((t: any) => t.name)
          .join(' + ')}. Reply YES to continue or ask to refine.`;
      }
    }

    if (pending?.type === 'magic_content') {
      const data = pending.data || {};
      if (!data.reservationId || !data.occasion) {
        replyText = `${replyText}\n\nSend your reservation ID and occasion (birthday, anniversary, proposal).`;
      } else if (!profile?.user_id) {
        replyText = `${replyText}\n\nPlease sign up with the same WhatsApp number so I can deliver your magic content.`;
      } else if (!profile?.opt_in_magic) {
        replyText = `${replyText}\n\nEnable Magic in your profile first, then reply here again.`;
      } else {
        actionHandled = true;
        let magicRunId: string | null = null;
        try {
          magicRunId = await createAgentRun(supabase as any, {
            user_id: profile.user_id,
            agent_name: 'content_magic',
            request_id: messageSid || undefined,
            input: data,
          });
        } catch (logError) {
          console.warn('[WhatsApp] Failed to create Magic run:', logError);
        }

        const contentResult = await runContentAgent(
          data.reservationId,
          profile,
          data.occasion,
          data.genre || 'ambient'
        );

        if (magicRunId) {
          try {
            await finishAgentRun(supabase as any, magicRunId, {
              status: contentResult.status === 'completed' ? 'completed' : 'failed',
              output: contentResult,
              duration_ms: Date.now() - runStart,
            });
          } catch (logError) {
            console.warn('[WhatsApp] Failed to finalize Magic run:', logError);
          }
        }

        await supabase.from('magic_content').insert({
          reservation_id: data.reservationId,
          user_id: profile.user_id,
          occasion: data.occasion,
          genre: data.genre || 'ambient',
          content_type: 'both',
          status: contentResult.status,
          song_url: contentResult.songUrl,
          video_url: contentResult.videoUrl,
          artwork_url: contentResult.artworkUrl,
          suno_track_id: contentResult.sunoTrackId,
          suno_grok_prompt: contentResult.grokPrompt,
          error_message: contentResult.errorMessage || null,
          user_prefs: profile,
        });

        replyText = `Your magic is ready. Song: ${contentResult.songUrl} Video: ${contentResult.videoUrl}`;
      }
    }

    const trimmedContext = agentResult.updatedContext;
    if (trimmedContext.messages.length > 0) {
      const lastMessage = trimmedContext.messages[trimmedContext.messages.length - 1];
      if (lastMessage.role === 'assistant') {
        lastMessage.content = replyText;
      }
    }

    if (actionHandled) {
      trimmedContext.pending_action = null;
    }

    trimmedContext.messages = trimmedContext.messages.slice(-10);

    await supabase
      .from('whatsapp_sessions')
      .upsert({
        id: sessionId || undefined,
        phone_number: phone,
        user_id: profile?.user_id || null,
        last_message: message,
        context: trimmedContext,
        last_inbound_at: nowIso,
        updated_at: nowIso,
      });

    const outbound = await sendWhatsAppMessage(phone, replyText);

    await supabase.from('whatsapp_messages').insert({
      session_id: sessionId || undefined,
      user_id: profile?.user_id || null,
      phone_number: phone,
      direction: 'outbound',
      body: replyText,
      twilio_sid: outbound.sid,
    });

    await supabase
      .from('whatsapp_sessions')
      .update({ last_outbound_at: new Date().toISOString() })
      .eq('phone_number', phone);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[WhatsApp] Webhook error', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
