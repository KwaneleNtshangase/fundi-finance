#!/usr/bin/env bash
# Usage: RESEND_API_KEY=re_xxxx bash fix_resend_templates.sh
# Patches both Resend templates to fix all dashboard warnings:
#   - From address
#   - Preview text
#   - Default subject
#   - Variable fallback values

set -euo pipefail

if [[ -z "${RESEND_API_KEY:-}" ]]; then
  echo "ERROR: Set RESEND_API_KEY first. e.g.: RESEND_API_KEY=re_xxxx bash fix_resend_templates.sh"
  exit 1
fi

AUTH="Authorization: Bearer ${RESEND_API_KEY}"
WELCOME_ID="a599bf54-7f17-4ed6-8f27-cdb058e0ae5d"
D1_ID="14f12c73-516c-4649-bf18-048c8891b535"

# ── Patch fundi-welcome ───────────────────────────────────────────────────────
echo "Patching fundi-welcome..."
python3 - << 'PY'
import subprocess, json

payload = {
    "from":         "Fundi Finance <hello@fundiapp.co.za>",
    "subject":      "Welcome to Fundi Finance, {{{username}}}!",
    "preview_text": "Your journey to financial confidence starts here.",
    "variables": [
        {"key": "username",   "type": "string", "fallback": "Mfundi"},
        {"key": "goal_emoji", "type": "string", "fallback": "💡"},
        {"key": "goal_label", "type": "string", "fallback": "Build Financial Confidence"},
        {"key": "goal_line",  "type": "string", "fallback": "Knowledge is the best investment you can make."},
    ],
}

import os, urllib.request

req = urllib.request.Request(
    "https://api.resend.com/emails/templates/a599bf54-7f17-4ed6-8f27-cdb058e0ae5d",
    data=json.dumps(payload).encode(),
    headers={
        "Authorization": f"Bearer {os.environ['RESEND_API_KEY']}",
        "Content-Type":  "application/json",
    },
    method="PATCH",
)
try:
    with urllib.request.urlopen(req) as r:
        print("  fundi-welcome OK:", r.read().decode()[:120])
except Exception as e:
    print("  fundi-welcome ERROR:", e)
PY

# ── Patch fundi-d1-retention ──────────────────────────────────────────────────
echo "Patching fundi-d1-retention..."
python3 - << 'PY'
import subprocess, json, os, urllib.request

payload = {
    "from":         "Fundi Finance <hello@fundiapp.co.za>",
    "subject":      "Your streak is waiting, {{{username}}} 🔥",
    "preview_text": "One lesson. Three minutes. Keep the chain alive.",
    "variables": [
        {"key": "username",     "type": "string", "fallback": "Mfundi"},
        {"key": "streak_badge", "type": "string", "fallback": ""},
        {"key": "streak_line",  "type": "string", "fallback": "Start your streak today, one lesson is all it takes."},
        {"key": "goal_emoji",   "type": "string", "fallback": "💡"},
        {"key": "goal_label",   "type": "string", "fallback": "Build Financial Confidence"},
    ],
}

req = urllib.request.Request(
    "https://api.resend.com/emails/templates/14f12c73-516c-4649-bf18-048c8891b535",
    data=json.dumps(payload).encode(),
    headers={
        "Authorization": f"Bearer {os.environ['RESEND_API_KEY']}",
        "Content-Type":  "application/json",
    },
    method="PATCH",
)
try:
    with urllib.request.urlopen(req) as r:
        print("  fundi-d1-retention OK:", r.read().decode()[:120])
except Exception as e:
    print("  fundi-d1-retention ERROR:", e)
PY

echo ""
echo "Done. All template warnings should now be resolved."
echo "Return to resend.com/templates and refresh to confirm."
