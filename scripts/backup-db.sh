#!/bin/bash

# Database Backup Script for LuxeCraft
# Usage: ./backup-db.sh [output_dir]
# Note: Requires PGPASSWORD environment variable set or ~/.pgpass configured

set -e

OUTPUT_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$OUTPUT_DIR/luxecraft_db_$TIMESTAMP.sql"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Create backup directory
mkdir -p "$OUTPUT_DIR"

# Database connection parameters
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-luxecraft_db}"
DB_USER="${DB_USER:-postgres}"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting database backup..."

# Create backup
pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --file="$BACKUP_FILE" \
  --format=plain \
  --compress=9 \
  --verbose

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup completed: $BACKUP_FILE ($BACKUP_SIZE)"

# Cleanup old backups
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Cleaning up backups older than $RETENTION_DAYS days..."
find "$OUTPUT_DIR" -name "luxecraft_db_*.sql" -mtime "+$RETENTION_DAYS" -delete

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup script completed successfully."
