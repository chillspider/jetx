#! /bin/sh

set -eu

if [ -z "$SCHEDULE" ]; then
  sh replica.sh
else
  exec go-cron "$SCHEDULE" /bin/sh replica.sh
fi
