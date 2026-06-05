#!/usr/bin/env bash
# Register the FamilyDoc-AI backend webhook URL with the Telegram Bot API.
#
# Usage:
#   export TELEGRAM_BOT_TOKEN="123:abc..."
#   ./scripts/setup-telegram-webhook.sh https://your-domain.tld/api/v1/telegram/webhook
#
# Inspect the current webhook:
#   ./scripts/setup-telegram-webhook.sh --info
#
# Remove the webhook:
#   ./scripts/setup-telegram-webhook.sh --delete

set -euo pipefail

: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN env var is required}"

API="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}"

case "${1:-}" in
  --info)
    curl -sS "${API}/getWebhookInfo" | jq .
    ;;
  --delete)
    curl -sS -X POST "${API}/deleteWebhook" | jq .
    ;;
  "")
    echo "Usage: $0 <https-webhook-url> | --info | --delete" >&2
    exit 1
    ;;
  *)
    URL="$1"
    if [[ "$URL" != https://* ]]; then
      echo "Webhook URL must start with https:// (Telegram requirement)" >&2
      exit 1
    fi
    curl -sS -X POST "${API}/setWebhook" \
      -H 'Content-Type: application/json' \
      -d "{\"url\": \"${URL}\"}" | jq .
    echo
    echo "Verification:"
    curl -sS "${API}/getWebhookInfo" | jq .
    ;;
esac
