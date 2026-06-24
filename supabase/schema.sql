-- ============================================================
-- FetchyScrap — SQL complet à exécuter dans Supabase
-- SQL Editor → coller et exécuter d'un coup
-- ============================================================

-- ── 1. Tables de base (créées si absentes) ──────────────────

CREATE TABLE IF NOT EXISTS monitored_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_username  TEXT NOT NULL UNIQUE,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  added_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_scraped_at     TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id          UUID NOT NULL REFERENCES monitored_accounts(id) ON DELETE CASCADE,
  instagram_post_id   TEXT NOT NULL UNIQUE,
  type                TEXT NOT NULL CHECK (type IN ('reel', 'carousel')),
  url                 TEXT,
  thumbnail_url       TEXT,
  caption             TEXT,
  views_count         BIGINT NOT NULL DEFAULT 0,
  likes_count         BIGINT NOT NULL DEFAULT 0,
  comments_count      BIGINT NOT NULL DEFAULT 0,
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS viral_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES monitored_accounts(id) ON DELETE CASCADE,
  baseline_views  BIGINT NOT NULL DEFAULT 0,
  viral_views     BIGINT NOT NULL DEFAULT 0,
  multiplier      NUMERIC(6,1) NOT NULL DEFAULT 0,
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_reads (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id  UUID NOT NULL REFERENCES viral_alerts(id) ON DELETE CASCADE,
  read_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, alert_id)
);

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  name        TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  plan        TEXT NOT NULL DEFAULT 'free'  CHECK (plan IN ('free', 'pro')),
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Tables complémentaires ────────────────────────────────

-- Historique de métriques (snapshot à chaque scrape)
CREATE TABLE IF NOT EXISTS post_metrics_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  views_count     BIGINT NOT NULL DEFAULT 0,
  likes_count     BIGINT NOT NULL DEFAULT 0,
  comments_count  BIGINT NOT NULL DEFAULT 0,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Paramètres applicatifs (threshold, baseline, fréquence)
CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Logs d'actions admin
CREATE TABLE IF NOT EXISTS admin_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  target_id    TEXT,
  target_type  TEXT,
  meta         JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Emails admin envoyés (log + audit)
CREATE TABLE IF NOT EXISTS admin_emails (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject      TEXT NOT NULL,
  body         TEXT NOT NULL,
  recipients   TEXT[] NOT NULL DEFAULT '{}',
  sent_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. Valeurs par défaut des settings ──────────────────────

INSERT INTO app_settings (key, value) VALUES
  ('viral_threshold',  '5'),
  ('baseline_size',    '30'),
  ('scrape_frequency', '4')
ON CONFLICT (key) DO NOTHING;

-- ── 4. Désactiver RLS sur toutes les tables ─────────────────

ALTER TABLE monitored_accounts   DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts                DISABLE ROW LEVEL SECURITY;
ALTER TABLE viral_alerts         DISABLE ROW LEVEL SECURITY;
ALTER TABLE alert_reads          DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_metrics_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings         DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_emails         DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs           DISABLE ROW LEVEL SECURITY;

-- ── 5. Trigger auto-création profil à l'inscription ─────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'plan', 'free')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── 6. Migrer les anciens rôles (analyst/viewer → user) ─────

UPDATE profiles SET role = 'user' WHERE role NOT IN ('admin', 'user');

-- ── 7. Index utiles ──────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_posts_account_id       ON posts(account_id);
CREATE INDEX IF NOT EXISTS idx_posts_published_at     ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_viral_alerts_detected  ON viral_alerts(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_viral_alerts_account   ON viral_alerts(account_id);
CREATE INDEX IF NOT EXISTS idx_metrics_post_id        ON post_metrics_history(post_id);
CREATE INDEX IF NOT EXISTS idx_metrics_recorded_at    ON post_metrics_history(recorded_at DESC);
