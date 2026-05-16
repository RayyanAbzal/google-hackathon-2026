-- CivicTrust — initial schema
-- Run in Supabase SQL editor (or via Supabase CLI: supabase db push)
-- NOTE: DB already provisioned. This file is the source of truth for schema review.

-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT NOT NULL,
  skill TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  tier TEXT DEFAULT 'unverified' CHECK (
    tier IN ('unverified', 'partial', 'verified', 'trusted', 'gov_official')
  ),
  borough TEXT NOT NULL,
  skill TEXT DEFAULT 'Other',
  password_hash TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'unverified',
  borough TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- claims
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('identity', 'credential', 'work')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
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
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- gov_anchors
-- gov_anchors (L0 = Emergency Coalition, L1 = NHS/Police/Council)
CREATE TABLE gov_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level IN (0, 1)),
  organisation TEXT NOT NULL
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouches ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gov_anchors ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_public_read" ON users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);

-- claims: all readable (profile page shows pending/rejected to owner)
-- writes go via service role (bypasses RLS)
CREATE POLICY "claims_read_all" ON claims FOR SELECT USING (true);
CREATE POLICY "claims_insert_own" ON claims FOR INSERT WITH CHECK (true);

-- vouches
CREATE POLICY "vouches_public_read" ON vouches FOR SELECT USING (true);
CREATE POLICY "vouches_insert" ON vouches FOR INSERT WITH CHECK (true);

-- gov_anchors
CREATE POLICY "gov_anchors_public_read" ON gov_anchors FOR SELECT USING (true);
CREATE POLICY "gov_anchors_insert" ON gov_anchors FOR INSERT WITH CHECK (true);

-- Gov anchors readable by authenticated users
CREATE POLICY "gov_anchors_read_auth" ON gov_anchors FOR SELECT USING (true);
-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Enable realtime on users table in Supabase dashboard:
-- Database > Replication > Tables > users > toggle on
-- Anti-scam: same document hash cannot be reused
CREATE UNIQUE INDEX idx_claims_content_hash_unique
ON claims(content_hash)
WHERE content_hash IS NOT NULL;

-- Tao's future APIs
CREATE INDEX idx_users_skill_borough_score
ON users(skill, borough, score);

CREATE INDEX idx_help_posts_borough_expires
ON help_posts(borough, expires_at);

CREATE INDEX idx_vouches_voucher_created
ON vouches(voucher_id, created_at);

CREATE INDEX idx_claims_user_created
ON claims(user_id, created_at);

CREATE INDEX idx_claims_user_status
ON claims(user_id, status);