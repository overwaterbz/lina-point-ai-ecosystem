import type { SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/types/supabase-db';
import type { AgentName, AgentRunStatus } from '@/types/agents';

export type AgentRunInsert = {
  user_id: string;
  agent_name: AgentName;
  request_id?: string | null;
  status?: AgentRunStatus;
  input?: Json | null;
};

export type AgentRunUpdate = {
  status: AgentRunStatus;
  output?: Json | null;
  error_message?: string | null;
  finished_at?: string | null;
  duration_ms?: number | null;
};

export async function createAgentRun(
  supabase: SupabaseClient<any>,
  params: AgentRunInsert
): Promise<string> {
  const { data, error } = await supabase
    .from('agent_runs')
    .insert({
      user_id: params.user_id,
      agent_name: params.agent_name as any,
      request_id: params.request_id ?? null,
      status: (params.status ?? 'started') as any,
      input: params.input ?? null,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create agent run');
  }

  return (data as any).id;
}

export async function finishAgentRun(
  supabase: SupabaseClient<any>,
  runId: string,
  params: AgentRunUpdate
): Promise<void> {
  const { error } = await supabase
    .from('agent_runs')
    .update({
      status: params.status as any,
      output: params.output ?? null,
      error_message: params.error_message ?? null,
      finished_at: params.finished_at ?? new Date().toISOString(),
      duration_ms: params.duration_ms ?? null,
    })
    .eq('id', runId);

  if (error) {
    throw new Error(error.message);
  }
}
