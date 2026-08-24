#!/bin/bash
# Click Shield — custom dev flow (runs at container boot via /start.sh).
#
# Why this exists:
#   /start.sh rewrites /home/z/my-project/.env with a SQLite default
#   (DATABASE_URL=file:...custom.db) on EVERY boot. Click Shield now uses
#   Neon PostgreSQL, so this script restores the Neon credentials before
#   starting the dev server. It runs as user z in the background at boot,
#   replacing the default bun install / db:push / dev flow.
#
# Security:
#   - These credentials are SERVER-SIDE ONLY. They are written to .env,
#     which is gitignored and loaded only by server-side code (Prisma via
#     src/lib/db.ts, imported exclusively by API routes).
#   - Nothing here is ever prefixed with NEXT_PUBLIC_ or shipped to the
#     client bundle.

cd /home/z/my-project

# ---------------------------------------------------------------------------
# Neon PostgreSQL credentials (server-side only)
#   DATABASE_URL          → pooled connection (Neon PgBouncer) for app queries
#   DATABASE_URL_UNPOOLED → direct connection for prisma db push / migrate (DDL)
# ---------------------------------------------------------------------------
cat > .env <<'EOF'
# ⚠️ SERVER-SIDE ONLY — never expose these credentials to client code.
# Do NOT prefix any of these with NEXT_PUBLIC_.

# Pooled connection (Neon PgBouncer) — used by the app at runtime
DATABASE_URL='postgresql://neondb_owner:npg_84pUoWvLSCFK@ep-shiny-sound-azsp6g6n-pooler.c-3.ap-southeast-1.aws.neon.tech/ClickShield?sslmode=require&channel_binding=require'

# Unpooled (direct) connection — used by prisma db push / migrate for DDL
DATABASE_URL_UNPOOLED='postgresql://neondb_owner:npg_84pUoWvLSCFK@ep-shiny-sound-azsp6g6n.c-3.ap-southeast-1.aws.neon.tech/ClickShield?sslmode=require&channel_binding=require'
EOF

echo "[DEV] Neon .env restored"

# Record our PID for the platform's process tracking (.zscripts/dev.pid).
echo $$ > /home/z/my-project/.zscripts/dev.pid

# Install dependencies (fresh containers have no node_modules).
bun install

# Ensure the Prisma client matches the postgresql schema.
bun run db:generate

# Sync schema to Neon (no-op when already in sync; non-fatal on network hiccups).
bun run db:push || echo "[DEV] db:push failed (continuing — runtime connects lazily)"

echo "[DEV] Starting Next.js dev server on port 3000…"
exec bun run dev
