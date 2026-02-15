-- Agent prompt storage for self-improvement updates
CREATE TABLE IF NOT EXISTS public.agent_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_prompts_name ON public.agent_prompts(agent_name);

ALTER TABLE public.agent_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage agent prompts" ON public.agent_prompts
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
