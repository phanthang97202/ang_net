# Canonical analytics ledger (migration 0063)

## One measurement source

`AnalyticsLedger` is the authoritative source for session starts, page views,
article/reel views, movie openings, lifetime figures and historical balances.
`WebsiteSession` manages activity and online presence only. Starting a session
also inserts its deterministic `session:<id>` fact in the same transaction.

All current writers use `AnalyticsWriter` and `AnalyticsLedgerStore`. A successful
published content response needs a valid public navigation context and a non-bot
user agent to count. Movie openings need the authenticated actor and matching
film path. Context-free/API/admin requests still return usable content but do
not invent views. Repeated calls use the same event ID; another episode or
navigation has a different ID. Playback duration/completion is not measured.

`News.ViewCount` and `Reel.ViewCount` are compatibility **projections**, not sources.
Database triggers rebuild them from accepted ledger facts and opening balances.
They cannot be increased by an independent `UPDATE ViewCount = ViewCount + 1`.
Their integer values saturate at `Int32.MaxValue`; ledger quantities and lifetime
totals are bigint. Sorting and existing DTOs keep using these projections.

Reports, footer figures, public view counters and movie logs read the ledger.
There is no reporting union, Redis lookup, periodic copy of movie logs, or sum of
the old content counters. Reporting uses one consistent DB snapshot, including
cards, series, rankings and lifetime totals. Online is deliberately a live metric,
not subject to the selected historical range.

## Cutover and historical accounting

Back up the production DB before deploying. Deploy API and client together.
Never rewrite migrations 0061/0062. Startup runs additive migration 0063 inside
the existing migrator's transaction/advisory lock:

1. Locks affected sources in writer order and records `CanonicalAt`.
2. Copies existing events, session starts and structured movie logs by stable ID.
3. Copies identifiable, timestamped film audits before the original collection
   boundary. Real actor/episode/server metadata is parsed when present. Unknown
   fields stay null. Overlapping or unrecognised audit rows are quarantined as
   `RecordType=excluded`, never counted automatically.
4. Reconciles each content counter: opening balance = old counter minus the
   already copied dated facts. Original values/provenance are retained. A negative
   difference is flagged with `Included=false`, not treated as a valid zero.
5. Converts existing Redis snapshots to ledger balances. A proven mergeable total
   subtracts copied session facts before its capture boundary. Unknown overlap or
   a negative difference remains excluded. UTC-month aggregates remain archived
   in the ledger; they are not recast as Vietnam months/days.
6. Rebuilds compatibility projections and validates that source facts were copied.
   Validation failure rolls back the whole migration.

All original tables remain intact as archives. Reapplying the conversion cannot
duplicate ledger rows or balances. Write-only bridge triggers preserve in-flight
old-version event/movie/session writes during rolling deployment. They are not
read sources, background import jobs, or an alternative modern tracking path.

Opening balances use their **capture time**, not an invented historical event
time. Only `RecordType=event` participates in date charts, rankings and date-range
comparisons. Accepted balances with an empty period contribute to lifetime
figures. Totals are retained even when content is later hidden/deleted.

## Reconciliation and exceptional recovery

`/dashboard/analytics-history` reads ledger provenance, original values and
quarantined rows, not the source archives. `analytics.import` is still required.
Timestamped movie history is already migrated; the import button now handles only
an explicit recovery of a missing Redis total. The Redis dependency is lazy, so
normal reports, startup, preview and maintenance do not resolve it.

A missing/empty total does not latch a successful import. A retry retains stable
source IDs. A late snapshot with unprovable overlap is kept excluded. Reviewing a
plan does not authorise inventing a merge: ambiguous balances require a separate,
evidence-backed reconciliation decision. Old tab-based totals and new 30-minute,
cross-tab sessions retain their distinct historical definitions.

## Completeness, time and failures

- All new timestamps are UTC; calendar buckets and filters are Vietnam UTC+7.
- A session belongs to its start date. Passive heartbeats do not start sessions
  or prolong activity beyond the 30-minute idle threshold.
- Historical oldest rows do not move the continuous-coverage boundary backwards.
- `DataQuality` distinguishes complete, partial and unavailable data for each
  metric/period. Only compatible complete periods can be compared.
- Missing history is not a real zero. Known positive historical facts can appear
  before continuous coverage; no zero curve is manufactured between them.
- Writes have a three-second bounded retry budget. Failed event payloads are not
  a durable offline queue. User-facing content remains usable on tracking failure.
- Failure windows are persisted in `AnalyticsGap` when writes recover. They survive
  process restart and disable misleading comparisons; affected empty chart buckets
  are gaps, not zeroes. If the process dies before DB recovery, only operational
  logs may retain the pending failures. Check logs after a prolonged outage.
- Hourly maintenance only closes expired operational sessions. It never rereads
  Redis, copies old facts or deletes permanent analytics history.

## Verification before deployment

Run the analytics/movie-viewing integration tests. Set `ANGNET_ANALYTICS_TEST_DB`
only to a disposable local PostgreSQL instance to exercise actual migration SQL,
projection guards, concurrent tabs and idempotent repeat conversion. The test
creates and drops only a random private schema. Do not point it at production.

Compare the opening balance `OriginalValue` with the accepted balance plus copied
facts. Review `Included=false` rows and their `Note` rather than silently forcing
them into totals. Validate period totals against series, footer against lifetime,
and movie logs against movie reporting before enabling automatic deployment.
