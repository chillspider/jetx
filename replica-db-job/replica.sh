#! /bin/sh

set -eo pipefail

get_formatted_date() {
  date +"%d/%m/%Y %H:%M:%S"
}

log() {
  echo "[$(get_formatted_date)] $1"
}

# Check if required environment variables are set
if [ "${SOURCE_DATABASE}" = "**None**" ]; then
  log "You need to set the SOURCE_DATABASE environment variable."
  exit 1
fi

if [ "${SOURCE_HOST}" = "**None**" ]; then
  log "You need to set the SOURCE_HOST environment variable."
  exit 1
fi

if [ "${SOURCE_PORT}" = "**None**" ]; then
  log "You need to set the SOURCE_PORT environment variable."
  exit 1
fi

if [ "${SOURCE_USER}" = "**None**" ]; then
  log "You need to set the SOURCE_USER environment variable."
  exit 1
fi

if [ "${SOURCE_PASSWORD}" = "**None**" ]; then
  log "You need to set the SOURCE_PASSWORD environment variable."
  exit 1
fi

if [ "${TARGET_DATABASE}" = "**None**" ]; then
  log "You need to set the TARGET_DATABASE environment variable."
  exit 1
fi

if [ "${TARGET_DATABASE}" = "dbwash24h" ]; then
  log "TARGET_DATABASE is dbwash24h, skipping sync."
  exit 1
fi

if [ "${TARGET_HOST}" = "**None**" ]; then
  log "You need to set the TARGET_HOST environment variable."
  exit 1
fi

if [ "${TARGET_PORT}" = "**None**" ]; then
  log "You need to set the TARGET_PORT environment variable."
  exit 1
fi

if [ "${TARGET_USER}" = "**None**" ]; then
  log "You need to set the TARGET_USER environment variable."
  exit 1
fi

if [ "${TARGET_PASSWORD}" = "**None**" ]; then
  log "You need to set the TARGET_PASSWORD environment variable."
  exit 1
fi

log "Starting sync ${SOURCE_DATABASE} database to ${TARGET_DATABASE} analytics database"

# Dump the source database
SRC_BACKUP_FILE="source_backup.dump"
export PGPASSWORD="$SOURCE_PASSWORD"

log "Creating dump of ${SOURCE_DATABASE} database from ${SOURCE_HOST}..."
pg_dump -h "$SOURCE_HOST" -p "$SOURCE_PORT" -U "$SOURCE_USER" -Fc "$SOURCE_DATABASE" >"$SRC_BACKUP_FILE"

# Restore to the target database
TARGET_DATABASE_URL="postgres://${TARGET_USER}:${TARGET_PASSWORD}@${TARGET_HOST}:${TARGET_PORT}/${TARGET_DATABASE}"

# Clean the public schema of the target database
log "Cleaning the public schema of the ${TARGET_DATABASE} database on ${TARGET_HOST}..."
psql "$TARGET_DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

log "Restoring dump to ${TARGET_DATABASE} database on ${TARGET_HOST}..."
pg_restore -d "$TARGET_DATABASE_URL" "$SRC_BACKUP_FILE" --clean --if-exists --no-owner --no-comments --no-privileges --exclude-schema=extension

log "Database ${SOURCE_DATABASE} dumped and restored to ${TARGET_DATABASE} successfully."

# Clean up
rm -rf "$SRC_BACKUP_FILE"
