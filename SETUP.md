# Setup — Veille Virale Instagram

## 1. Installer les dépendances

```bash
cd veille-insta
npm install
```

## 2. Configurer Supabase

1. Crée un projet sur [supabase.com](https://supabase.com)
2. Va dans **SQL Editor** et exécute ce SQL :

```sql
-- Profils utilisateurs (lié à Supabase Auth)
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT,
  name         TEXT,
  role         TEXT NOT NULL DEFAULT 'viewer',
  invited_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Trigger auto-création profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'viewer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Comptes Instagram à surveiller
CREATE TABLE monitored_accounts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_username   TEXT UNIQUE NOT NULL,
  instagram_id         TEXT,
  added_by             UUID REFERENCES profiles(id),
  is_active            BOOLEAN DEFAULT true,
  last_scraped_at      TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- Posts scrappés
CREATE TABLE posts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id           UUID REFERENCES monitored_accounts(id) ON DELETE CASCADE,
  instagram_post_id    TEXT UNIQUE NOT NULL,
  type                 TEXT NOT NULL,
  url                  TEXT,
  thumbnail_url        TEXT,
  caption              TEXT,
  views_count          BIGINT DEFAULT 0,
  likes_count          BIGINT DEFAULT 0,
  comments_count       BIGINT DEFAULT 0,
  published_at         TIMESTAMPTZ,
  scraped_at           TIMESTAMPTZ DEFAULT now()
);

-- Historique métriques
CREATE TABLE post_metrics_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id        UUID REFERENCES posts(id) ON DELETE CASCADE,
  views_count    BIGINT,
  likes_count    BIGINT,
  comments_count BIGINT,
  recorded_at    TIMESTAMPTZ DEFAULT now()
);

-- Alertes virales
CREATE TABLE viral_alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          UUID UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  account_id       UUID REFERENCES monitored_accounts(id) ON DELETE CASCADE,
  baseline_views   BIGINT,
  viral_views      BIGINT,
  multiplier       FLOAT,
  detected_at      TIMESTAMPTZ DEFAULT now()
);

-- Lectures alertes par utilisateur
CREATE TABLE alert_reads (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  alert_id   UUID REFERENCES viral_alerts(id) ON DELETE CASCADE,
  read_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, alert_id)
);
```

## 2b. Migration admin panel (exécute dans un nouveau SQL Editor)

```sql
-- Colonnes supplémentaires pour le panel admin
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan        TEXT    NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS status      TEXT    NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS notes       TEXT,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Log d'activité admin
CREATE TABLE IF NOT EXISTS admin_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  target_id   UUID,
  target_type TEXT,
  meta        JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Emails envoyés (historique)
CREATE TABLE IF NOT EXISTS admin_emails (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subject      TEXT NOT NULL,
  body         TEXT NOT NULL,
  recipients   TEXT[],
  sent_at      TIMESTAMPTZ DEFAULT now()
);
```

3. Dans **Supabase → Settings → API**, copie :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (secret)

## 3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
# Remplis .env.local avec tes vraies clés
```

## 4. Créer le premier admin

Dans Supabase → **Authentication → Users** → Invite user
Puis dans SQL Editor :
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'ton@email.com';
```

## 5. Lancer en local

```bash
npm run dev
# → http://localhost:3000
```

## 6. Déploiement

### Frontend → Vercel
```bash
npx vercel deploy
# Ajoute les variables d'env dans Vercel Dashboard
```

### Cron → Railway
1. Crée un nouveau projet Railway
2. Ajoute un service "Cron Job"
3. Schedule : `0 */4 * * *`
4. Command : `curl -H "x-cron-secret: $CRON_SECRET" https://TON_DOMAINE_VERCEL.app/api/cron/scrape`
5. Ajoute la variable `CRON_SECRET`

## 7. Ajouter ta clé HikerAPI

1. Crée un compte sur [hikerapi.com](https://hikerapi.com)
2. Ajoute `HIKERAPI_KEY` dans `.env.local` et dans Vercel
