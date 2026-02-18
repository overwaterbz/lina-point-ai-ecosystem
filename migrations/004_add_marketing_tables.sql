-- Marketing Agent Crew Tables Migration

-- Create marketing_campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  objective VARCHAR(100) NOT NULL, -- 'direct_bookings', 'brand_awareness', 'engagement', 'email_growth'
  target_audience TEXT NOT NULL,
  key_messages TEXT[] DEFAULT ARRAY[]::TEXT[],
  platforms TEXT[] NOT NULL, -- 'instagram', 'tiktok', 'facebook', 'x', 'email'
  
  -- Campaign execution data
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'running', 'completed', 'failed'
  research_data JSONB DEFAULT NULL,
  generated_content JSONB[] DEFAULT ARRAY[]::JSONB[],
  scheduled_posts JSONB[] DEFAULT ARRAY[]::JSONB[],
  engagement_campaigns JSONB[] DEFAULT ARRAY[]::JSONB[],
  
  -- Metrics
  metrics JSONB DEFAULT NULL, -- { impressions, clicks, conversions, ctr, conversion_rate }
  ml_insights TEXT[] DEFAULT ARRAY[]::TEXT[],
  prompt_updates TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_objective CHECK (objective IN ('direct_bookings', 'brand_awareness', 'engagement', 'email_growth')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'running', 'completed', 'failed'))
);

-- Create marketing_content table (individual pieces of content)
CREATE TABLE IF NOT EXISTS marketing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  
  type VARCHAR(100) NOT NULL, -- 'social_post', 'reel_script', 'tiktok_script', 'email', 'blog'
  platform VARCHAR(100) NOT NULL, -- 'instagram', 'tiktok', 'facebook', 'x', 'email'
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
  call_to_action VARCHAR(255) DEFAULT NULL,
  media_url VARCHAR(1024) DEFAULT NULL,
  
  -- Posting info
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'published', 'failed'
  scheduled_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  published_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  platform_post_id VARCHAR(500) DEFAULT NULL, -- For tracking published posts
  
  -- Performance metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create marketing_email_list table (for email capture)
CREATE TABLE IF NOT EXISTS marketing_email_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) DEFAULT NULL,
  interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  engagement_level VARCHAR(50) DEFAULT 'new', -- 'new', 'engaged', 'converted'
  
  email_sent_count INTEGER DEFAULT 0,
  last_email_sent TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  last_engagement TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create marketing_engagement_log table (for tracking interactions)
CREATE TABLE IF NOT EXISTS marketing_engagement_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  content_id UUID REFERENCES marketing_content(id) ON DELETE SET NULL,
  
  engagement_type VARCHAR(100) NOT NULL, -- 'click', 'comment', 'share', 'like', 'dm', 'email_open'
  user_identifier VARCHAR(500) DEFAULT NULL, -- email, social handle, etc.
  user_info JSONB DEFAULT NULL, -- extra user data
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create marketing_agent_logs table (for debugging & improvement)
CREATE TABLE IF NOT EXISTS marketing_agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  
  agent_name VARCHAR(100) NOT NULL, -- 'ResearchAgent', 'ContentAgent', etc.
  action VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'started', 'completed', 'failed'
  
  input_data JSONB DEFAULT NULL,
  output_data JSONB DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  
  iteration_number INTEGER DEFAULT 1,
  processing_time_ms INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX idx_marketing_campaigns_created_at ON marketing_campaigns(created_at DESC);
CREATE INDEX idx_marketing_campaigns_created_by ON marketing_campaigns(created_by);

CREATE INDEX idx_marketing_content_campaign_id ON marketing_content(campaign_id);
CREATE INDEX idx_marketing_content_platform ON marketing_content(platform);
CREATE INDEX idx_marketing_content_status ON marketing_content(status);

CREATE INDEX idx_marketing_email_list_campaign_id ON marketing_email_list(campaign_id);
CREATE INDEX idx_marketing_email_list_email ON marketing_email_list(email);

CREATE INDEX idx_marketing_engagement_log_campaign_id ON marketing_engagement_log(campaign_id);
CREATE INDEX idx_marketing_engagement_log_content_id ON marketing_engagement_log(content_id);

CREATE INDEX idx_marketing_agent_logs_campaign_id ON marketing_agent_logs(campaign_id);
CREATE INDEX idx_marketing_agent_logs_agent_name ON marketing_agent_logs(agent_name);

-- Add RLS policies
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_email_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_engagement_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_agent_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admin users to view all marketing data
CREATE POLICY "Admin can view marketing campaigns"
  ON marketing_campaigns FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admin can manage campaigns"
  ON marketing_campaigns FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = ANY(string_to_array(current_setting('app.admin_emails', true), ',')));

-- Similar policies for other tables...
