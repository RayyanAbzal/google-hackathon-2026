-- CivicTrust — full reseed script
-- Paste into Supabase SQL editor and run.
-- 1. Deletes all users EXCEPT the one with username = 'peter'
-- 2. Inserts 5 gov official accounts (score 100) with claims + vouches
-- 3. Inserts 200 regular Londoners (scores 0–90) with claims + cross-vouches
-- All passwords: password123

-- ── STEP 1: WIPE (keep peter) ─────────────────────────────────────────────────
DO $$
DECLARE
  peter_id UUID;
BEGIN
  SELECT id INTO peter_id FROM users WHERE username = 'peter' LIMIT 1;

  -- Delete dependent rows for all non-peter users
  DELETE FROM vouches
    WHERE voucher_id IN (SELECT id FROM users WHERE id IS DISTINCT FROM peter_id)
       OR vouchee_id IN (SELECT id FROM users WHERE id IS DISTINCT FROM peter_id);

  DELETE FROM claims
    WHERE user_id IN (SELECT id FROM users WHERE id IS DISTINCT FROM peter_id);

  DELETE FROM gov_officials
    WHERE user_id IN (SELECT id FROM users WHERE id IS DISTINCT FROM peter_id);

  DELETE FROM notifications
    WHERE user_id IN (SELECT id FROM users WHERE id IS DISTINCT FROM peter_id);

  -- Delete all users except peter
  DELETE FROM users WHERE id IS DISTINCT FROM peter_id;

  RAISE NOTICE 'Wipe complete. Peter preserved (id = %)', peter_id;
END $$;

-- ── STEP 2: 5 GOV OFFICIALS (score 100) ──────────────────────────────────────
DO $$
DECLARE
  gov_data TEXT[][] := ARRAY[
    ARRAY['BLK-30001-LDN', 'Eleanor Whitfield',  'Doctor',   'Westminster', 'NHS England'],
    ARRAY['BLK-30002-LDN', 'Marcus Okafor',       'Legal',    'Southwark',   'Ministry of Justice'],
    ARRAY['BLK-30003-LDN', 'Priya Sharma',        'Engineer', 'Camden',      'Department for Transport'],
    ARRAY['BLK-30004-LDN', 'James Pemberton',     'Nurse',    'Hackney',     'UKHSA'],
    ARRAY['BLK-30005-LDN', 'Amara Diallo',        'Other',    'Lambeth',     'Home Office']
  ];
  gov_docs TEXT[][] := ARRAY[
    ARRAY['passport',  'identity'],
    ARRAY['degree',    'credential'],
    ARRAY['employer_letter', 'work']
  ];

  gov_uids UUID[] := ARRAY[]::UUID[];
  uid      UUID;
  gov_uid  UUID;
  dname    TEXT;
  i        INT;
  d        INT;
BEGIN
  FOR i IN 1..5 LOOP
    uid   := gen_random_uuid();
    dname := gov_data[i][2];

    INSERT INTO users (id, node_id, display_name, skill, password_hash, score, tier, borough)
    VALUES (
      uid,
      gov_data[i][1],
      dname,
      gov_data[i][3],
      'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
      100,
      'gov_official',
      gov_data[i][4]
    )
    ON CONFLICT (node_id) DO NOTHING
    RETURNING id INTO uid;

    -- If ON CONFLICT fired, fetch the existing ID
    IF uid IS NULL THEN
      SELECT id INTO uid FROM users WHERE node_id = gov_data[i][1];
    END IF;

    gov_uids := array_append(gov_uids, uid);

    -- Insert into gov_officials table
    INSERT INTO gov_officials (id, user_id, level, organisation)
    VALUES (gen_random_uuid(), uid, 1, gov_data[i][5])
    ON CONFLICT DO NOTHING;

    -- 3 verified claims each
    FOR d IN 1..3 LOOP
      INSERT INTO claims (id, user_id, type, status, doc_type, extracted_name, confidence, content_hash)
      VALUES (
        gen_random_uuid(), uid,
        gov_docs[d][2],
        'verified',
        gov_docs[d][1],
        dname,
        0.99,
        encode(digest(uid::TEXT || gov_docs[d][1], 'sha256'), 'hex')
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  -- Gov officials vouch for each other (all 5 × 4 = 20 vouches)
  FOR i IN 1..5 LOOP
    FOR d IN 1..5 LOOP
      IF i <> d THEN
        INSERT INTO vouches (id, voucher_id, vouchee_id)
        VALUES (gen_random_uuid(), gov_uids[i], gov_uids[d])
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE '5 gov officials seeded (score 100, cross-vouched).';
END $$;

-- ── STEP 3: 200 REGULAR LONDONERS ────────────────────────────────────────────
DO $$
DECLARE
  first_names TEXT[] := ARRAY[
    'James','Sarah','Michael','Fatima','David','Priya','John','Amara',
    'Richard','Zoe','Emmanuel','Chloe','Kwame','Lucy','Marcus','Aisha',
    'Oliver','Nadia','Thomas','Grace','Daniel','Yemi','Robert','Helena',
    'Samuel','Mei','Christopher','Fatou','Andrew','Iris','Leon','Nia',
    'Patrick','Sana','George','Leila','Victor','Adaeze','Simon','Rosa'
  ];
  last_names TEXT[] := ARRAY[
    'Mitchell','Osei','Patel','Williams','Ahmed','Thompson','Clarke',
    'Johnson','Adeyemi','Brown','Singh','Davies','Okonkwo','Taylor',
    'Chen','Anderson','Mensah','Wilson','Sharma','Moore','Diallo',
    'Martin','Park','White','Harris','Lewis','Jackson','Rivera','Khan',
    'Nguyen','Owusu','Campbell','Fernandez','Nwosu','Scott','Ali'
  ];
  boroughs TEXT[] := ARRAY[
    'Southwark','Westminster','Hackney','Tower Hamlets','Lewisham',
    'Greenwich','Lambeth','Islington','Camden','Haringey',
    'Newham','Wandsworth','Bromley','Croydon','Ealing','Enfield',
    'Barnet','Brent','Waltham Forest','Hounslow'
  ];
  skills    TEXT[] := ARRAY['Doctor','Engineer','Legal','Builder','Nurse','Other'];
  doc_types TEXT[] := ARRAY['passport','degree','employer_letter','nhs_card','driving_licence'];

  uid         UUID;
  fname       TEXT;
  lname       TEXT;
  dname       TEXT;
  borough     TEXT;
  skill       TEXT;
  score       INT;
  tier        TEXT;
  nid         TEXT;
  bucket      INT;
  num_docs    INT;
  dt          TEXT;
  i           INT;
  d           INT;
  uids        UUID[] := ARRAY[]::UUID[];
  scores      INT[]  := ARRAY[]::INT[];
  vouchee_uid UUID;
BEGIN
  FOR i IN 1..200 LOOP
    fname   := first_names[((i - 1) % array_length(first_names, 1)) + 1];
    lname   := last_names[(((i - 1) * 7 + 3) % array_length(last_names, 1)) + 1];
    dname   := fname || ' ' || lname;
    borough := boroughs[((i - 1) % array_length(boroughs, 1)) + 1];
    skill   := skills[(((i - 1) * 3) % array_length(skills, 1)) + 1];
    nid     := 'BLK-' || LPAD((20000 + i)::TEXT, 5, '0') || '-LDN';
    bucket  := (i - 1) % 10;

    CASE
      WHEN bucket < 2  THEN score := (i % 2) * 8;
      WHEN bucket < 3  THEN score := 15;
      WHEN bucket < 5  THEN score := 20 + ((i * 3) % 35);
      WHEN bucket < 7  THEN score := 55 + ((i * 2) % 16);
      WHEN bucket < 9  THEN score := 70 + ((i * 3) % 16);
      ELSE                  score := 85 + (i % 6);
    END CASE;
    score := LEAST(score, 90);

    IF    score >= 55 THEN tier := 'trusted';
    ELSIF score >= 20 THEN tier := 'verified';
    ELSE                   tier := 'unverified';
    END IF;

    uid := gen_random_uuid();
    uids   := array_append(uids,   uid);
    scores := array_append(scores, score);

    INSERT INTO users (id, node_id, display_name, skill, password_hash, score, tier, borough)
    VALUES (
      uid, nid, dname, skill,
      'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
      score, tier, borough
    )
    ON CONFLICT (node_id) DO NOTHING;

    IF    score >= 55 THEN num_docs := 3;
    ELSIF score >= 35 THEN num_docs := 2;
    ELSIF score >= 20 THEN num_docs := 1;
    ELSE                   num_docs := 0;
    END IF;

    FOR d IN 1..num_docs LOOP
      dt := doc_types[((d - 1) % array_length(doc_types, 1)) + 1];
      INSERT INTO claims (id, user_id, type, status, doc_type, extracted_name, confidence, content_hash)
      VALUES (
        gen_random_uuid(), uid,
        CASE d WHEN 1 THEN 'identity' WHEN 2 THEN 'credential' ELSE 'work' END,
        'verified', dt, dname, 0.95,
        encode(digest(uid::TEXT || dt || d::TEXT, 'sha256'), 'hex')
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  -- Trusted users vouch for the next 3 Trusted users
  FOR i IN 1..array_length(uids, 1) LOOP
    IF scores[i] >= 55 THEN
      FOR d IN 1..3 LOOP
        vouchee_uid := uids[((i - 1 + d) % array_length(uids, 1)) + 1];
        IF uids[i] <> vouchee_uid THEN
          INSERT INTO vouches (id, voucher_id, vouchee_id)
          VALUES (gen_random_uuid(), uids[i], vouchee_uid)
          ON CONFLICT DO NOTHING;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  RAISE NOTICE '200 regular users seeded.';
END $$;
