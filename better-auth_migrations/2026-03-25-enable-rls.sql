-- Enable RLS on tables exposed to PostgREST (all access goes through server-side pool, so no policies needed)
ALTER TABLE IF EXISTS feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS x_auto_post ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS api_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS api_subscription ENABLE ROW LEVEL SECURITY;
