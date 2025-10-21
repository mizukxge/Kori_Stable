# Records Verification Cron Schedule

## Recommended Schedules

### Daily Verification (2 AM)
```bash
0 2 * * * cd /path/to/kori_web_stable && pnpm tsx apps/api/src/jobs/records.ts --verify
```

### Weekly Disposal (Sunday 3 AM)
```bash
0 3 * * 0 cd /path/to/kori_web_stable && pnpm tsx apps/api/src/jobs/records.ts --dispose
```

### Monthly Statistics Report (1st of month, 4 AM)
```bash
0 4 1 * * cd /path/to/kori_web_stable && pnpm tsx apps/api/src/jobs/records.ts --stats
```

## Windows Task Scheduler

For Windows, create scheduled tasks:

### Daily Verification
```powershell
$action = New-ScheduledTaskAction -Execute "pnpm" -Argument "tsx apps/api/src/jobs/records.ts --verify" -WorkingDirectory "E:\Applications\kori_web_stable"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "KoriRecordsVerify" -Action $action -Trigger $trigger
```

### Weekly Disposal
```powershell
$action = New-ScheduledTaskAction -Execute "pnpm" -Argument "tsx apps/api/src/jobs/records.ts --dispose" -WorkingDirectory "E:\Applications\kori_web_stable"
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 3am
Register-ScheduledTask -TaskName "KoriRecordsDispose" -Action $action -Trigger $trigger
```

## Manual Execution
```bash
# Verify all records
pnpm tsx apps/api/src/jobs/records.ts --verify

# Dispose expired records
pnpm tsx apps/api/src/jobs/records.ts --dispose

# Show statistics
pnpm tsx apps/api/src/jobs/records.ts --stats
```

## Monitoring

Consider setting up alerts for:
- Failed verifications (potential tampering)
- Verification errors (missing files)
- High number of expired records
- Legal hold records approaching retention expiry