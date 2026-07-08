#!/bin/sh
set -e

# CapRover persistent volumes mount as root; ensure the app user can write SQLite + uploads.
mkdir -p /app/data/uploads
chown -R nextjs:nodejs /app/data

exec gosu nextjs "$@"
