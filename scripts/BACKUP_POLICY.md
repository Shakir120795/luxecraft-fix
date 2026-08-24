# Database Backup Policy

## Backup Strategy

LuxeCraft implements automated database backups to ensure data protection and business continuity.

## Backup Schedule

| Frequency | Type | Retention |
|---|---|---|
| Daily (00:00 UTC) | Full backup | 30 days |
| Weekly (Sunday 02:00 UTC) | Full backup | 90 days |
| Monthly (1st day 03:00 UTC) | Full backup | 1 year |

## Implementation

### Manual Backup

```bash
./scripts/backup-db.sh ./backups
```

### Automated Backups (via cron)

Add to crontab for daily backups:

```cron
0 0 * * * cd /path/to/luxecraft && PGPASSWORD=<password> ./scripts/backup-db.sh ./backups >/var/log/luxecraft_backup.log 2>&1
```

### Environment Variables

- `DB_HOST` — PostgreSQL host (default: localhost)
- `DB_PORT` — PostgreSQL port (default: 5432)
- `DB_NAME` — Database name (default: luxecraft_db)
- `DB_USER` — Database user (default: postgres)
- `PGPASSWORD` — PostgreSQL password (required for automated backups)
- `RETENTION_DAYS` — Days to keep backups (default: 30)

## Storage

Backups should be stored in:

- **Local**: `./backups/` directory (development)
- **Production**: Remote storage (S3, Backblaze B2, or similar)
  - Use versioning to prevent accidental deletions
  - Enable encryption at rest and in transit

## Restore Procedure

### From Backup File

```bash
psql -h <host> -U <user> -d <database> < backup_file.sql
```

### Point-in-Time Recovery (PITR)

PostgreSQL WAL (Write-Ahead Logging) must be enabled:

1. Configure `wal_level = replica` in postgresql.conf
2. Enable continuous archiving to remote storage
3. Use `pg_restore` with timeline recovery

## Testing

Backup restoration must be tested:

- Monthly restore test to verify backup integrity
- Document any issues and resolution steps
- Keep restore procedure documentation current

## Monitoring & Alerts

- Monitor backup completion status
- Alert on backup failures
- Track backup size trends
- Verify backup integrity with periodic test restores

## Disaster Recovery

**RTO (Recovery Time Objective)**: 1 hour  
**RPO (Recovery Point Objective)**: 1 day

If data loss occurs:

1. Restore latest backup to temporary database
2. Verify data integrity
3. Perform point-in-time recovery if available
4. Failover to restored instance
5. Document incident and improvements

## Phase 8 Notes

- Backup scripts created for Phase 8 hardening
- Cron-based automation recommended for production
- Database backups required before major deployments
- Restore testing should be part of disaster recovery drills
