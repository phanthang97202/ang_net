# Blog maintenance

Migration `0043_SeedBaoTriBlog.sql` seeds `BLOG_MAINTENANCE` in category Blog with type bool and default value `false`. API startup applies the embedded script once; existing values are preserved. Configure it through `/dashboard/sysparameter`, requiring the existing system-parameter permissions.

Keep the parameter active and set both Vietnamese and English values to `true` to enable maintenance, or `false` to reopen the blog. The Vietnamese value is canonical, with English used only when Vietnamese is empty; changing the visitor's language cannot change maintenance state. Missing/inactive/null/empty configuration defaults to normal operation, as do configuration request failures (requests time out after five seconds).

Every blog navigation checks fresh public configuration before activating the page. Blog URLs, including `/login`, redirect to `/maintain` when enabled; the maintenance screen displays **Hệ thống đang bảo trì, vui lòng thử lại sau!**, without navbar/footer/chat. Its retry button navigates to home and checks configuration again. Existing visible blog tabs check every 30 seconds and redirect if maintenance is enabled. `/maintain` is exempt to prevent redirect loops.

`/dashboard` and its existing children bypass maintenance checks and retain their authentication and permission guards. `/dashboard/login` reuses the existing login page, allowing management access during maintenance when `/login` is unavailable. Anonymous dashboard access goes to that login route. Dashboard and maintenance pages do not poll the maintenance parameter.

This is blog UI maintenance; API endpoints and dashboard operations remain available. No real configuration value or database migration was changed locally.

## Shift report only

Migration `0072_SeedChiBaoCaoCa.sql` seeds `ONLY_SHIFT_REPORT` (category Blog, type bool, default `false`), configured the same way through `/dashboard/sysparameter`. When `true`, every blog URL redirects to `/tools/shift-report`; only that page and its sub-paths, `/login` and `/forgot-password` stay reachable. Signing in through `/login` lands on the shift report, while `/dashboard/login` still opens the dashboard. `/dashboard/*` is unaffected.

Signed-in users without the `shiftreport.view` permission are sent to `/maintain` instead, because the shift report's own guard would otherwise bounce them to `/` and back in a loop. `BLOG_MAINTENANCE` takes precedence when both are enabled. Open blog tabs pick up the change within 30 seconds through the same monitoring loop. Like maintenance mode, this only restricts the blog UI; API endpoints keep their usual authorization.

## Prank mode (TROLL_VIETNAM)

Migration `0073_SeedTrollVietnam.sql` seeds `TROLL_VIETNAM` (category Blog, type json) with `enabled: false`. The Vietnamese value is canonical and holds the whole configuration:

```json
{
  "enabled": true,
  "message": "Haha, mày là 1 tên hề!",
  "countdown": 3,
  "images": ["https://res.cloudinary.com/.../clown.png", "🤡", "🖕"],
  "excludedUserIds": ["<user id>"]
}
```

When enabled, every blog URL (including `/login`) redirects to `/haha`: a countdown, a BOOM flash, the images bursting across the screen, then the message, which stays on screen (no replay). `images` accepts up to 12 entries, each a transparent PNG URL or an emoji; an empty list falls back to 😂 🖕 🤡. `countdown` is 1-10 seconds (default 3) and `message` is capped at 200 characters. Signed-in users whose id is in `excludedUserIds` (copy it from `/dashboard/users` → "Sao chép ID") browse normally; the id is read from the stored token, so it still works while the session is waiting to refresh. Invalid JSON counts as disabled.

`/dashboard/*` and `/dashboard/login` are never redirected, so the owner can always switch it off. Priority when several modes are on: `BLOG_MAINTENANCE` > `TROLL_VIETNAM` > `ONLY_SHIFT_REPORT`. The three parameters are fetched in parallel on each blog navigation and every 30 seconds in open tabs. While enabled, search engine crawlers also see `/haha`, so keep it short.
