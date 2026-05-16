-- CivicTrust — initial schema
-- Run in Supabase SQL editor (or via Supabase CLI: supabase db push)

-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT NOT NULL,
  skill TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'unverified',
  borough TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- claims
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  doc_type TEXT NOT NULL,
  extracted_name TEXT,
  extracted_institution TEXT,
  confidence FLOAT,
  content_hash TEXT,
  vouches INTEGER DEFAULT 0,
  flags INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- vouches
CREATE TABLE vouches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vouchee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voucher_id, vouchee_id)
);

-- help_posts
CREATE TABLE help_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  skill_tag TEXT,
  resource_tag TEXT,
  borough TEXT NOT NULL,
  urgency TEXT DEFAULT 'medium',
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- gov_officials
CREATE TABLE gov_officials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  organisation TEXT NOT NULL
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouches ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gov_officials ENABLE ROW LEVEL SECURITY;

-- Anyone can read all users (public directory)
CREATE POLICY "users_read_all" ON users FOR SELECT USING (true);
-- Users can only update their own row
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- Claims are readable by all authenticated users
CREATE POLICY "claims_read_all" ON claims FOR SELECT USING (true);
-- Users can insert their own claims
CREATE POLICY "claims_insert_own" ON claims FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Vouches are readable by all
CREATE POLICY "vouches_read_all" ON vouches FOR SELECT USING (true);
-- Users can insert vouches they make
CREATE POLICY "vouches_insert_own" ON vouches FOR INSERT WITH CHECK (auth.uid() = voucher_id);

-- Help posts readable by authenticated users
CREATE POLICY "help_posts_read_auth" ON help_posts FOR SELECT USING (true);
-- Users can insert their own help posts
CREATE POLICY "help_posts_insert_own" ON help_posts FOR INSERT WITH CHECK (auth.uid() = author_id);

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Enable realtime on users table in Supabase dashboard:
-- Database > Replication > Tables > users > toggle on
