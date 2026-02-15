-- Add last_messages column for WhatsApp session history
ALTER TABLE public.whatsapp_sessions
  ADD COLUMN IF NOT EXISTS last_messages JSONB;

-- Backfill from existing context.messages when available
UPDATE public.whatsapp_sessions
SET last_messages = COALESCE(context->'messages', '[]'::jsonb)
WHERE last_messages IS NULL;
