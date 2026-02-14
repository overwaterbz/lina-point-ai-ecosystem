-- Add analytics table for tracking booking performance
CREATE TABLE IF NOT EXISTS booking_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL,
  check_in_date DATE,
  check_out_date DATE,
  original_price NUMERIC(10, 2),
  beat_price NUMERIC(10, 2),
  savings_percent INTEGER,
  best_ota TEXT,
  selected_tours TEXT[], -- Array of tour names
  total_cost NUMERIC(10, 2),
  affiliate_commission NUMERIC(10, 2),
  experiment_variant TEXT, -- For A/B testing
  grok_used BOOLEAN DEFAULT FALSE,
  booking_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE booking_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own analytics
CREATE POLICY "Users can view own analytics" ON booking_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own analytics
CREATE POLICY "Users can insert own analytics" ON booking_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_booking_analytics_user_id ON booking_analytics(user_id);
CREATE INDEX idx_booking_analytics_created_at ON booking_analytics(created_at);
CREATE INDEX idx_booking_analytics_experiment_variant ON booking_analytics(experiment_variant);

-- Add price history table for trend analysis
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type TEXT NOT NULL,
  location TEXT DEFAULT 'Belize',
  agoda_price NUMERIC(10, 2),
  expedia_price NUMERIC(10, 2),
  booking_price NUMERIC(10, 2),
  hotels_com_price NUMERIC(10, 2),
  kayak_price NUMERIC(10, 2),
  check_in_date DATE,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Index for queries
CREATE INDEX idx_price_history_room_type ON price_history(room_type);
CREATE INDEX idx_price_history_check_in_date ON price_history(check_in_date);
CREATE INDEX idx_price_history_recorded_at ON price_history(recorded_at);
