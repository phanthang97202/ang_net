# Website analytics storage and cutover

Migration `0062_UnifiedWebsiteAnalytics.sql` is additive and runs through the existing startup migrator. It preserves `AnalyticsEvent`, `AuditTrail`, and existing article/reel counters.

## Authoritative sources

- `WebsiteSession`: a persisted browser session, shared across tabs using a visitor UUID. A new session starts after 30 minutes without user activity. Passive heartbeats update online presence but cannot create or keep an inactive session alive. A session crossing midnight belongs to its start date, in Vietnam time.
- `AnalyticsEvent`: page, article and reel view events. The navigation ID makes retries idempotent. Article/reel counters and their event are written in one transaction.
- `MovieViewLog`: successful playback openings, with authenticated user, film, episode, server and time. This measures opening the player, not watched duration or completion. No new playback rows are written to `AuditTrail` or generic movie events. Historical rows remain intact.
- `AnalyticsLegacySnapshot`: the Redis total/month counters and snapshots of existing article/reel counters. Historical aggregate counters are not spread across fabricated daily values.

The public footer and admin dashboard use `WebAnalyticsService`. Normal tracking and reporting have no Redis dependency. The public summary has a 15-second in-process cache; online presence is read separately. Article/reel lifetime totals reflect counters on currently stored content.

## Deployment and historical import

1. Deploy the API and client together. The migration copies existing page sessions and generic movie events idempotently. A scheduled reconciliation also picks up old movie events that finish during rolling deployment; reports include that tail without counting copied rows twice.
2. Before accepting traffic, startup attempts to capture the old Redis counters. The legacy reader uses the original environment suffix. Existing Redis keys are read only and retained.
3. Open **Thống kê → Đối soát dữ liệu lịch sử** (`/dashboard/analytics-history`). Grant `analytics.import` through the existing role/permission management if needed. Review the old totals, source timestamps, eligible film audit rows, overlapping rows and unrecognised rows.
4. Click **Nhập theo bản đối soát này**. A changed source invalidates the reviewed plan (HTTP 409). Repeated or interrupted imports can be resumed without duplicating previously imported rows. Original logs are retained.
5. Only movie audit rows before the original `AnalyticsCollection.StartedAt` are imported. Rows after that boundary overlap with the first analytics implementation and are excluded. Missing user/session/episode metadata is left unknown, never invented.

A Redis snapshot is merged with new visits only when captured before this version creates new sessions. If Redis is unavailable until later, the snapshot is stored separately because overlap cannot be proven. The UI explains this rather than silently adding both totals. Missing Redis counters remain missing, not an assumed zero baseline.

## Admin access

- `analytics.view`: traffic charts and cumulative figures.
- `analytics.import`: reconciliation and legacy import.
- `movieviewlog.view`: `/dashboard/movie-view-logs`, with date/account/film filters and cursor-based automatic loading.

Existing accounts gain access through normal permission assignment; no role is silently elevated. Detailed playback logs are not public.

## Failures and maintenance

Tracking writes have a three-second budget and use the configured database transient retry strategy. Stable event IDs and transactions make retries safe. `Analytics/Track` returns 503 if a write fails; the browser retries the captured payload twice. Content/playback responses remain usable if analytics storage fails. This is bounded best-effort tracking, not a durable offline queue; a prolonged outage can lose new events.

The admin report exposes write failure count and last failure time for the current API process. These reset on restart. Server warnings provide operational diagnostics. If failures persist, investigate DB connectivity and latency before interpreting the affected period as complete.

The hourly worker closes expired session markers, removes only obsolete ephemeral `AnalyticsPresence` entries and reconciles remaining v1 movie rows. It does not delete session, event, movie or legacy history. Archival/retention of permanent history should be introduced explicitly when volume warrants it.

## Verification

`UnifiedAnalyticsTests` covers shared tabs, idle expiry, midnight grouping, Redis outage/capture, late-snapshot separation, legacy import boundaries/idempotency, plan invalidation and cursor ordering. Set `ANGNET_ANALYTICS_TEST_DB` to a disposable local PostgreSQL database to run the isolated migration/concurrency test. It creates and removes only a randomly named test schema, preserving other schemas.
