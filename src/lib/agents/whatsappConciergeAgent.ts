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
        birthday: profile.birthday,
        anniversary: profile.anniversary,
        events: profile.special_events,
        music_style: profile.music_style,
        maya_interests: profile.maya_interests,
        opt_in_magic: profile.opt_in_magic,
      }
    : {};

  const refinement = refinementHint ? ` Refinement: ${refinementHint}` : '';

  return `You are Maya Guide at Lina Point Resort. Use user preferences for personalization: ${JSON.stringify(
    prefs
  )}. Promote direct bookings, magic experiences (songs, videos, packages), and save commissions. Keep replies short, friendly, and conversational for WhatsApp. Ask for missing details briefly.${refinement}`;
}

function detectAction(message: string, context: WhatsAppSessionContext) {
  const lower = message.toLowerCase();
  const pending = context.pending_action;

  if (pending?.type) {
    return pending;
  }

  if (lower.includes('book') || lower.includes('reservation') || lower.includes('room')) {
    return { type: 'book_flow', data: {} } as const;
  }

  if (lower.includes('song') || lower.includes('video') || lower.includes('magic')) {
    return { type: 'magic_content', data: {} } as const;
  }

  return null;
}

function extractBookingDetails(message: string, existing?: Record<string, any>) {
  const data: Record<string, any> = { ...(existing || {}) };
  const dates = message.match(/\d{4}-\d{2}-\d{2}/g) || [];
  if (dates.length >= 1 && !data.checkInDate) data.checkInDate = dates[0];
  if (dates.length >= 2 && !data.checkOutDate) data.checkOutDate = dates[1];

  const groupMatch = message.match(/(\d+)\s+(guests|people|adults)/i);
  if (groupMatch && !data.groupSize) data.groupSize = Number(groupMatch[1]);

  if (message.toLowerCase().includes('overwater')) data.roomType = 'overwater room';
  if (message.toLowerCase().includes('villa')) data.roomType = 'villa';
  if (message.toLowerCase().includes('suite')) data.roomType = 'suite';

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
