-- CivicTrust — full schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

-- ─── Tables ───────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id       TEXT UNIQUE NOT NULL,
  username      TEXT UNIQUE,
  display_name  TEXT NOT NULL,
  skill         TEXT NOT NULL,
  pin_hash      TEXT NOT NULL,
  score         INTEGER DEFAULT 0,
  tier          TEXT DEFAULT 'unverified',
  borough       TEXT ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE claims (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  type                 TEXT NOT NULL CHECK (type IN ('identity', 'credential', 'work')),
  status               TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  doc_type             TEXT NOT NULL,
  extracted_name       TEXT,
  extracted_institution TEXT,
  confidence           FLOAT,
  content_hash         TEXT,
  vouches              INTEGER DEFAULT 0,
  flags                INTEGER DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vouches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  vouchee_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voucher_id, vouchee_id)
);

CREATE TABLE help_posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  skill_tag    TEXT,
  resource_tag TEXT,
  borough      TEXT NOT NULL,
  urgency      TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
  expires_at   TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gov_anchors (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  level        INTEGER NOT NULL,
  organisation TEXT NOT NULL
);

-- ─── Indexes ──────────────────────────────────────────────────────────────

CREATE INDEX idx_claims_user_id    ON claims(user_id);
CREATE INDEX idx_vouches_vouchee   ON vouches(vouchee_id);
CREATE INDEX idx_vouches_voucher   ON vouches(voucher_id);
CREATE INDEX idx_help_posts_borough ON help_posts(borough);
CREATE INDEX idx_help_posts_expires ON help_posts(expires_at);
CREATE INDEX idx_users_borough     ON users(borough);
CREATE INDEX idx_users_skill       ON users(skill);

-- ─── RLS ──────────────────────────────────────────────────────────────────
-- API routes use the service role key which bypasses RLS entirely.
-- These policies cover any direct client-side reads (e.g. map page).

ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims     ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gov_anchors ENABLE ROW LEVEL SECURITY;

-- Public read on users (map + Yellow Pages counts)
CREATE POLICY "users_public_read" ON users
  FOR SELECT USING (true);

-- Public read on verified claims
CREATE POLICY "claims_public_read" ON claims
  FOR SELECT USING (status = 'verified');

-- Public read on active help posts
CREATE POLICY "help_posts_public_read" ON help_posts
  FOR SELECT USING (expires_at > NOW());

-- Public read on gov_anchors
CREATE POLICY "gov_anchors_public_read" ON gov_anchors
  FOR SELECT USING (true);

-- Vouches readable by anyone (needed for score display)
CREATE POLICY "vouches_public_read" ON vouches
  FOR SELECT USING (true);
