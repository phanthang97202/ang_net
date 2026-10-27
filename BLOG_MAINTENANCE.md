# Blog maintenance

Migration `0043_SeedBaoTriBlog.sql` seeds `BLOG_MAINTENANCE` in category Blog with type bool and default value `false`. API startup applies the embedded script once; existing values are preserved. Configure it through `/dashboard/sysparameter`, requiring the existing system-parameter permissions.

Keep the parameter active and set both Vietnamese and English values to `true` to enable maintenance, or `false` to reopen the blog. The Vietnamese value is canonical, with English used only when Vietnamese is empty; changing the visitor's language cannot change maintenance state. Missing/inactive/null/empty configuration defaults to normal operation, as do configuration request failures (requests time out after five seconds).

Every blog navigation checks fresh public configuration before activating the page. Blog URLs, including `/login`, redirect to `/maintain` when enabled; the maintenance screen displays **Hệ thống đang bảo trì, vui lòng thử lại sau!**, without navbar/footer/chat. Its retry button navigates to home and checks configuration again. Existing visible blog tabs check every 30 seconds and redirect if maintenance is enabled. `/maintain` is exempt to prevent redirect loops.

`/dashboard` and its existing children bypass maintenance checks and retain their authentication and permission guards. `/dashboard/login` reuses the existing login page, allowing management access during maintenance when `/login` is unavailable. Anonymous dashboard access goes to that login route. Dashboard and maintenance pages do not poll the maintenance parameter.

This is blog UI maintenance; API endpoints and dashboard operations remain available. No real configuration value or database migration was changed locally.

## Shift report only

Migration `0072_SeedChiBaoCaoCa.sql` seeds `ONLY_SHIFT_REPORT` (category Blog, type bool, default `false`), configured the same way through `/dashboard/sysparameter`. When `true`, every blog URL redirects to `/tools/shift-report`; only that page and its sub-paths, `/login` and `/forgot-password` stay reachable. Signing in through `/login` lands on the shift report, while `/dashboard/login` still opens the dashboard. `/dashboard/*` is unaffected.

Signed-in users without the `shiftreport.view` permission are sent to `/maintain` instead, because the shift report's own guard would otherwise bounce them to `/` and back in a loop. `BLOG_MAINTENANCE` takes precedence when both are enabled. Open blog tabs pick up the change within 30 seconds through the same monitoring loop. Like maintenance mode, this only restricts the blog UI; API endpoints keep their usual authorization.
