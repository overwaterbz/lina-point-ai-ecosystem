import type { Json } from '@/types/supabase-db';

export type AgentName = 'price_scout' | 'experience_curator' | 'content_magic' | 'whatsapp_concierge';

export type AgentRunStatus = 'started' | 'completed' | 'failed';

export interface AgentRunInput {
  request_id?: string | null;
  payload: Json;
}

export interface AgentRunOutput {
  payload: Json;
  error_message?: string | null;
}
