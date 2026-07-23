# DB restore runbook

Last drill: 2026-06-10 · RTO: ~<N> seconds (66KB dump) · restored cleanly into scratch DB.

## Rule

NEVER restore into the production database (`photo-app`). Always restore into a
throwaway DB (`restore_drill`) and verify there. A botched restore must not be
able to touch live data.

## Restore from an S3 backup (drill or real recovery)

Run on the EC2 box. Container: `photo-app-prod-db-1`.

1. Find and pull the dump:
   aws s3 ls s3://homeroll-db-backups-prod/ --region us-east-1
   aws s3 cp s3://homeroll-db-backups-prod/homeroll-<STAMP>.dump /tmp/restore.dump --region us-east-1

2. Create scratch DB:
   docker exec photo-app-prod-db-1 psql -U postgres -c "DROP DATABASE IF EXISTS restore_drill;"
   docker exec photo-app-prod-db-1 psql -U postgres -c "CREATE DATABASE restore_drill;"

3. Restore into it:
   docker cp /tmp/restore.dump photo-app-prod-db-1:/tmp/restore.dump
   docker exec photo-app-prod-db-1 pg_restore -U postgres -d restore_drill --no-owner --no-acl /tmp/restore.dump

4. Verify (don't trust "no error" — check rows):
   docker exec photo-app-prod-db-1 psql -U postgres -d restore_drill -c "\dt"
   docker exec photo-app-prod-db-1 psql -U postgres -d restore_drill -c "SELECT count(\*) FROM media_item;"

5. Teardown:
   docker exec photo-app-prod-db-1 psql -U postgres -c "DROP DATABASE restore_drill;"
   docker exec photo-app-prod-db-1 rm -f /tmp/restore.dump
   rm -f /tmp/restore.dump

## Real recovery (NOT a drill)

For an actual prod recovery you'd restore into a fresh DB and cut the app over to
it (or rename), NOT restore over the running prod DB. Decide the cutover approach
when you're not mid-incident — for now, the safe known-good operation is
restore-and-verify into a scratch DB. Document the prod-cutover steps before you'd
ever need them under pressure.
