#!/bin/sh
# Nightly versioned backup of the agenda account files with restic (DEPLOY.md, 8a).
# Backs up to every repository configured in /etc/agenda-backup/*.env, one after
# the other, so that one failing target does not stop the others.
set -u
DATA=${AGENDA_DATA:-/var/lib/agenda/accounts}
CONF=${AGENDA_BACKUP_CONF:-/etc/agenda-backup}
status=0
for env in "$CONF"/*.env; do
  [ -e "$env" ] || { echo "no repository configured in $CONF"; exit 1; }
  name=$(basename "$env" .env)
  (
    set -a; . "$env"; set +a
    # SFTP targets: key and known_hosts are passed explicitly (the service has no home).
    r() { if [ -n "${RESTIC_SFTP_ARGS:-}" ]; then restic -o sftp.args="$RESTIC_SFTP_ARGS" "$@"; else restic "$@"; fi; }
    r backup --quiet --tag agenda --host agenda "$DATA" &&
    r forget --quiet --tag agenda --host agenda --prune \
      --keep-daily 14 --keep-weekly 8 --keep-monthly 12 &&
    r check --quiet
  ) && echo "$name: ok" || { echo "$name: FAILED"; status=1; }
done
exit $status
