-- CivicTrust — schema updates
-- Run this in Supabase SQL Editor AFTER schema.sql has been applied.

-- ─── 1. borough NOT NULL ──────────────────────────────────────────────────
-- Backfill any nulls from early registrations before adding the constraint.
UPDATE users SET borough = 'Westminster' WHERE borough IS NULL;
ALTER TABLE users ALTER COLUMN borough SET NOT NULL;

-- ─── 2. Global unique index on content_hash ──────────────────────────────
-- Prevents the same physical document being used across multiple accounts.
-- Partial index so NULL rows are not constrained.
CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_content_hash_global
  ON claims(content_hash)
  WHERE content_hash IS NOT NULL;

-- ─── 3. Composite indexes for /api/find ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_skill_borough_score
  ON users(skill, borough, score);

-- ─── 4. Indexes for /api/help ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_help_posts_borough_expires
  ON help_posts(borough, expires_at);

-- ─── 5. Indexes for rate limiting ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vouches_voucher_created
  ON vouches(voucher_id, created_at);

CREATE INDEX IF NOT EXISTS idx_claims_user_created
  ON claims(user_id, created_at);

-- ─── 6. Index for score/profile queries ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_claims_user_status
  ON claims(user_id, status);

-- ─── 7. Check constraint: users.tier (standardised to gov_official) ───────
ALTER TABLE users ADD CONSTRAINT users_tier_check
  CHECK (tier IN ('unverified', 'partial', 'verified', 'trusted', 'gov_official'));

-- ─── 8. Check constraint: gov_anchors.level ──────────────────────────────
ALTER TABLE gov_anchors ADD CONSTRAINT gov_anchors_level_check
  CHECK (level IN (0, 1));

-- Note: claims.type, claims.status, and help_posts.urgency already have
-- inline CHECK constraints from schema.sql — no action needed for those.
