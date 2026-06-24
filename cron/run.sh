#!/bin/sh
# ── FetchyScrap — Railway Cron ──────────────────────────────
# Appelé toutes les 4h par Railway, déclenche le scraping Instagram.
# Variables requises : APP_URL, CRON_SECRET

if [ -z "$APP_URL" ]; then
  echo "❌ APP_URL manquant"
  exit 1
fi
if [ -z "$CRON_SECRET" ]; then
  echo "❌ CRON_SECRET manquant"
  exit 1
fi

echo "🕐 Lancement scraping — $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "📡 Cible : $APP_URL/api/cron/scrape"

RESPONSE=$(curl \
  --silent \
  --show-error \
  --fail \
  --max-time 300 \
  --write-out "\nHTTP_STATUS:%{http_code}" \
  -X GET "$APP_URL/api/cron/scrape" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "📊 Statut HTTP : $HTTP_STATUS"
echo "📋 Réponse : $BODY"

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Scraping terminé avec succès"
  exit 0
else
  echo "❌ Erreur scraping (HTTP $HTTP_STATUS)"
  exit 1
fi
