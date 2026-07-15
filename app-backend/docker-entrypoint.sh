#!/bin/sh
# Container entrypoint: on every boot, apply pending migrations and seed, then
# start the API. Both steps are idempotent — the seed script boots AppModule
# (which runs migrations because RUN_MIGRATIONS=true) and adminSeed only creates
# the admin account if it doesn't already exist — so it is safe to run on every
# start; the real work happens on the first boot with an empty database.
set -e

echo "[entrypoint] Applying migrations and seeding database..."
node dist/seeds/seeds.js

echo "[entrypoint] Starting backend..."
exec node dist/main.js
