import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { grokLLM } from '@/lib/grokIntegration';
import { runWithRecursion } from '@/lib/agents/agentRecursion';
import { evaluateTextQuality } from '@/lib/agents/recursionEvaluators';

export interface WhatsAppProfile {
  user_id?: string | null;
  full_name?: string | null;
  birthday?: string | null;
  anniversary?: string | null;
  special_events?: Array<{ name: string; date: string }> | null;
  music_style?: string | null;
  maya_interests?: string[] | null;
  opt_in_magic?: boolean | null;
}

export interface WhatsAppSessionContext {
  messages: Array<{ role: 'user' | 'assistant'; content: string; ts: string }>;
  pending_action?: {
    type: 'book_flow' | 'magic_content';
    data?: Record<string, any>;
  } | null;
}

export interface WhatsAppAgentInput {
  message: string;
  phone: string;
  profile: WhatsAppProfile | null;
  sessionContext: WhatsAppSessionContext;
}

export interface WhatsAppAgentOutput {
  replyText: string;
  action: { type: 'book_flow' | 'magic_content'; payload?: Record<string, any> } | null;
  updatedContext: WhatsAppSessionContext;
}

const ConciergeState = Annotation.Root({
  message: Annotation<string>,
  phone: Annotation<string>,
  profile: Annotation<WhatsAppProfile | null>,
  sessionContext: Annotation<WhatsAppSessionContext>,
  refinementHint: Annotation<string | undefined>,
  replyText: Annotation<string>,
  action: Annotation<{ type: 'book_flow' | 'magic_content'; payload?: Record<string, any> } | null>,
});

function buildSystemPrompt(profile: WhatsAppProfile | null, refinementHint?: string) {
  const prefs = profile
    ? {
        name: profile.full_name,
        birthday: profile.birthday,
        anniversary: profile.anniversary,
        events: profile.special_events,
        music_style: profile.music_style,
        maya_interests: profile.maya_interests,
        opt_in_magic: profile.opt_in_magic,
      }
    : {};

  const hasName = profile?.full_name;
  const refinement = refinementHint ? `\nRefinement: ${refinementHint}` : '';

  return `You are Maya, the AI concierge at Lina Point — an overwater resort on the Caribbean Sea in San Pedro, Ambergris Caye, Belize.

RESORT KNOWLEDGE:
- Rooms: Overwater Bungalows ($299+/night), Beach Villas ($199+), Reef Suites ($249+). All have ocean views.
- Check-in 3 PM, Check-out 11 AM. Minimum 2-night stay.
- Dining: Reef Restaurant (seafood, 7AM-10PM), Palapa Bar (cocktails, 11AM-midnight), Room Service (7AM-9PM).
- Tours: Hol Chan Marine Reserve snorkeling ($95-150), Sport Fishing ($250-500), Mayan Ruins day trip ($120-200), Cenote swimming ($80-180), Mangrove kayaking ($60-120).
- Water taxi from Belize City ~90 min, or local flights via Tropic Air (~15 min).
- Wi-Fi included. Kayaks & paddleboards complimentary. Dive shop on-site.
- Magic Experiences: Personalized birthday/anniversary songs & videos created by AI. Guests can opt in.

GUEST PREFERENCES: ${JSON.stringify(prefs)}

RULES:
- Keep replies under 3 sentences for simple questions. Be warm but concise — this is WhatsApp.
- ${hasName ? `Address the guest as ${profile!.full_name!.split(' ')[0]}.` : 'If you don\'t know the guest\'s name, ask for it naturally.'}
- Always promote direct booking (saves guests 3%+ vs OTAs).
- If a guest asks about pricing, offer to run a price comparison.
- If a guest mentions a celebration, suggest Magic Experiences.
- Never make up information. If unsure, say you'll check and follow up.
- Use 1-2 emojis max per message. No walls of text.${refinement}`;
}

function detectAction(message: string, context: WhatsAppSessionContext) {
  const lower = message.toLowerCase();
  const pending = context.pending_action;

  // If there's an existing pending action, continue it unless the user explicitly changes topic
  if (pending?.type) {
    const cancelWords = ['cancel', 'nevermind', 'never mind', 'stop', 'forget it'];
    if (cancelWords.some(w => lower.includes(w))) {
      return null; // User wants to cancel current flow
    }
    return pending;
  }

  // Booking intent — rooms, stays, dates, availability
  const bookingKeywords = [
    'book', 'reserv', 'room', 'bungalow', 'villa', 'suite', 'stay',
    'check in', 'check-in', 'checkin', 'available', 'availability',
    'price', 'rate', 'cost', 'how much', 'per night', 'nights',
  ];
  if (bookingKeywords.some(kw => lower.includes(kw))) {
    return { type: 'book_flow', data: {} } as const;
  }

  // Magic content intent — songs, videos, celebrations
  const magicKeywords = [
    'song', 'video', 'magic', 'birthday', 'anniversary', 'proposal',
    'surprise', 'celebration', 'personalized', 'custom music',
  ];
  if (magicKeywords.some(kw => lower.includes(kw))) {
    return { type: 'magic_content', data: {} } as const;
  }

  return null;
}

function extractBookingDetails(message: string, existing?: Record<string, any>) {
  const data: Record<string, any> = { ...(existing || {}) };

  // ISO dates (2026-03-10)
  const isoDates = message.match(/\d{4}-\d{2}-\d{2}/g) || [];
  if (isoDates.length >= 1 && !data.checkInDate) data.checkInDate = isoDates[0];
  if (isoDates.length >= 2 && !data.checkOutDate) data.checkOutDate = isoDates[1];

  // US dates (3/10, 03/15/2026, March 10)
  const usDatePattern = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/g;
  const usMatches = [...message.matchAll(usDatePattern)];
  if (usMatches.length >= 1 && !data.checkInDate) {
    const m = usMatches[0];
    const year = m[3] ? (m[3].length === 2 ? `20${m[3]}` : m[3]) : new Date().getFullYear().toString();
    data.checkInDate = `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  }
  if (usMatches.length >= 2 && !data.checkOutDate) {
    const m = usMatches[1];
    const year = m[3] ? (m[3].length === 2 ? `20${m[3]}` : m[3]) : new Date().getFullYear().toString();
    data.checkOutDate = `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  }

  // "X to Y" date range with "to" or "through"
  const rangeMatch = message.match(/(\d{4}-\d{2}-\d{2})\s+(?:to|through|thru|-)\s+(\d{4}-\d{2}-\d{2})/i);
  if (rangeMatch) {
    if (!data.checkInDate) data.checkInDate = rangeMatch[1];
    if (!data.checkOutDate) data.checkOutDate = rangeMatch[2];
  }

  // "X nights" — auto-calculate checkout from checkin
  const nightsMatch = message.match(/(\d+)\s*nights?/i);
  if (nightsMatch && data.checkInDate && !data.checkOutDate) {
    const checkin = new Date(data.checkInDate);
    checkin.setDate(checkin.getDate() + parseInt(nightsMatch[1]));
    data.checkOutDate = checkin.toISOString().slice(0, 10);
  }

  const groupMatch = message.match(/(\d+)\s+(guests?|people|adults?|persons?)/i);
  if (groupMatch && !data.groupSize) data.groupSize = Number(groupMatch[1]);

  const lower = message.toLowerCase();
  if (lower.includes('overwater') || lower.includes('bungalow')) data.roomType = 'overwater bungalow';
  if (lower.includes('villa') || lower.includes('beach villa')) data.roomType = 'beach villa';
  if (lower.includes('suite') || lower.includes('reef suite')) data.roomType = 'reef suite';

  return data;
}

function extractMagicDetails(message: string, existing?: Record<string, any>) {
  const data: Record<string, any> = { ...(existing || {}) };
  const uuidMatch = message.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuidMatch && !data.reservationId) data.reservationId = uuidMatch[0];

  const lower = message.toLowerCase();
  if (lower.includes('birthday')) data.occasion = 'birthday';
  if (lower.includes('anniversary')) data.occasion = 'anniversary';
  if (lower.includes('proposal')) data.occasion = 'proposal';
  if (lower.includes('renewal')) data.occasion = 'renewal';

  return data;
}

export async function runWhatsAppConciergeAgent(
  input: WhatsAppAgentInput
): Promise<WhatsAppAgentOutput> {
  const graph = new StateGraph(ConciergeState)
    .addNode('respond', async (state) => {
      const systemPrompt = buildSystemPrompt(state.profile, state.refinementHint);
      const history = state.sessionContext.messages.slice(-5).map((msg) =>
        msg.role === 'user'
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      );

      const response = await grokLLM.invoke([
        new SystemMessage(systemPrompt),
        ...history,
        new HumanMessage(state.message),
      ]);

      const replyText =
        response.content && typeof response.content === 'string'
          ? response.content
          : 'Got it. Let me check on that.';

      const action = detectAction(state.message, state.sessionContext);

      return {
        replyText,
        action,
      };
    })
    .addEdge(START, 'respond')
    .addEdge('respond', END);

  const initialState = {
    message: input.message,
    phone: input.phone,
    profile: input.profile,
    sessionContext: input.sessionContext,
    refinementHint: undefined,
  };

  const { result } = await runWithRecursion(
    async () => graph.compile().invoke(initialState),
    async (state) => {
      const goal = 'Provide a short, friendly WhatsApp reply that moves the conversation forward.';
      const summary = `Reply: ${state.replyText}`;
      const evalResult = await evaluateTextQuality(goal, summary);
      return { score: evalResult.score, feedback: evalResult.feedback, data: state };
    },
    async (state, feedback, iteration) => ({
      ...state,
      refinementHint: `Iteration ${iteration + 1}: ${feedback || 'Be shorter and ask one clear question.'}`,
    })
  );

  const updatedContext: WhatsAppSessionContext = {
    ...input.sessionContext,
  };

  const now = new Date().toISOString();
  updatedContext.messages = [...input.sessionContext.messages, { role: 'user', content: input.message, ts: now }];

  if (result.replyText) {
    updatedContext.messages.push({ role: 'assistant', content: result.replyText, ts: now });
  }

  if (result.action?.type === 'book_flow') {
    const data = extractBookingDetails(input.message, input.sessionContext.pending_action?.data);
    updatedContext.pending_action = { type: 'book_flow', data };
  } else if (result.action?.type === 'magic_content') {
    const data = extractMagicDetails(input.message, input.sessionContext.pending_action?.data);
    updatedContext.pending_action = { type: 'magic_content', data };
  } else {
    updatedContext.pending_action = null;
  }

  return {
    replyText: result.replyText || 'Got it. Let me check on that.',
    action: result.action,
    updatedContext,
  };
}
