#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
printf '%s\n' 'Öffne nach dem Start: http://127.0.0.1:4173'
node scripts/dev-server.mjs
