#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
printf '%s\n' 'PixelForge startet unter http://127.0.0.1:4173'
npm run dev
