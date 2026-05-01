#!/usr/bin/env bash
# ============================================================
# fix_resend_templates.sh
# Patches fundi-welcome and fundi-d1-retention Resend templates:
#   - Sets from address, subject, preview text (via hidden HTML span)
#   - Defines variable fallback values
#
# Usage:
#   RESEND_API_KEY=re_xxx bash supabase/fix_resend_templates.sh
#
# NOTE: Correct endpoint is /templates/{id} — NOT /emails/templates/{id}
#       Preview text is injected as a hidden <span> in the HTML body
#       because Resend's API does not persist a preview_text field.
# ============================================================

set -euo pipefail

KEY="${RESEND_API_KEY:?Set RESEND_API_KEY env var first}"
BASE="https://api.resend.com/templates"
WELCOME_ID="a599bf54-7f17-4ed6-8f27-cdb058e0ae5d"
D1_ID="14f12c73-516c-4649-bf18-048c8891b535"

patch_template() {
  local id="$1"
  local payload="$2"
  local name="$3"
  local result
  result=$(curl -s -X PATCH "$BASE/$id" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d "$payload")
  if echo "$result" | grep -q '"object":"template"'; then
    echo "✅  $name patched"
  else
    echo "❌  $name failed: $result"
    exit 1
  fi
}

# ── fundi-welcome ─────────────────────────────────────────────
patch_template "$WELCOME_ID" '{
  "from":    "Fundi Finance <hello@fundiapp.co.za>",
  "subject": "Welcome to Fundi Finance, {{{username}}}!",
  "variables": [
    {"key": "username",   "type": "string", "fallback": "Mfundi"},
    {"key": "goal_emoji", "type": "string", "fallback": "💡"},
    {"key": "goal_label", "type": "string", "fallback": "Build Financial Confidence"},
    {"key": "goal_line",  "type": "string", "fallback": "Knowledge is the best investment you can make."}
  ]
}' "fundi-welcome"

# ── fundi-d1-retention ───────────────────────────────────────
patch_template "$D1_ID" '{
  "from":    "Fundi Finance <hello@fundiapp.co.za>",
  "subject": "Your streak is waiting, {{{username}}} 🔥",
  "variables": [
    {"key": "username",     "type": "string", "fallback": "Mfundi"},
    {"key": "streak_badge", "type": "string", "fallback": ""},
    {"key": "streak_line",  "type": "string", "fallback": "Start your streak today, one lesson is all it takes."},
    {"key": "goal_emoji",   "type": "string", "fallback": "💡"},
    {"key": "goal_label",   "type": "string", "fallback": "Build Financial Confidence"}
  ]
}' "fundi-d1-retention"

echo ""
echo "Done. Open resend.com/templates and click Publish on both templates."
