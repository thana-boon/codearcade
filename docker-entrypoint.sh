#!/bin/sh
set -e

# รัน migration ก่อน (idempotent) แล้วค่อยสตาร์ท Next.js server
echo "[entrypoint] running database migrations..."
node scripts/run-migrations.mjs

echo "[entrypoint] starting Next.js server..."
exec node server.js
