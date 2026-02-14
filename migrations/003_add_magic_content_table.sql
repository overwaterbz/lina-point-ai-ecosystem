-- Create magic_content table to track generated songs/videos
CREATE TABLE IF NOT EXISTS magic_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES tour_bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content metadata
  content_type VARCHAR(50), -- 'song', 'video', 'both'
  genre VARCHAR(100),
  occasion VARCHAR(100), -- 'birthday', 'anniversary', 'proposal', etc.
  
  -- Generated content
  song_url TEXT, -- Suno MP3 URL
  video_url TEXT, -- LTX Studio MP4 URL
  artwork_url TEXT, -- Album art
  
  -- Suno-specific tracking
  suno_track_id VARCHAR(100),
  suno_grok_prompt TEXT, -- Prompt sent to Grok/Suno
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  
  -- Metadata
  user_prefs JSONB, -- User preferences/questionnaire data
  stats JSONB, -- Duration, bpm, etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_magic_content_user_id ON magic_content(user_id);
CREATE INDEX idx_magic_content_reservation_id ON magic_content(reservation_id);
CREATE INDEX idx_magic_content_status ON magic_content(status);

-- Enable RLS
ALTER TABLE magic_content ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only see their own content
CREATE POLICY "Users can view own magic content" ON magic_content
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own magic content" ON magic_content
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own magic content" ON magic_content
  FOR UPDATE
  USING (auth.uid() = user_id);
