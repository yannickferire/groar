-- Seed total revenue counter with historical revenue ($18.00 = 1800 cents)
INSERT INTO counter (key, value) VALUES ('total_revenue_cents', 1800)
ON CONFLICT (key) DO NOTHING;
