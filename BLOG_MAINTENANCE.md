# Blog maintenance

Migration `0043_SeedBaoTriBlog.sql` seeds `BLOG_MAINTENANCE` in category Blog with type bool and default value `false`. API startup applies the embedded script once; existing values are preserved. Configure it through `/dashboard/sysparameter`, requiring the existing system-parameter permissions.

Keep the parameter active and set both Vietnamese and English values to `true` to enable maintenance, or `false` to reopen the blog. The Vietnamese value is canonical, with English used only when Vietnamese is empty; changing the visitor's language cannot change maintenance state. Missing/inactive/null/empty configuration defaults to normal operation, as do configuration request failures (requests time out after five seconds).

Every blog navigation checks fresh public configuration before activating the page. Blog URLs, including `/login`, redirect to `/maintain` when enabled; the maintenance screen displays **Hệ thống đang bảo trì, vui lòng thử lại sau!**, without navbar/footer/chat. Its retry button navigates to home and checks configuration again. Existing visible blog tabs check every 30 seconds and redirect if maintenance is enabled. `/maintain` is exempt to prevent redirect loops.

`/dashboard` and its existing children bypass maintenance checks and retain their authentication and permission guards. `/dashboard/login` reuses the existing login page, allowing management access during maintenance when `/login` is unavailable. Anonymous dashboard access goes to that login route. Dashboard and maintenance pages do not poll the maintenance parameter.

This is blog UI maintenance; API endpoints and dashboard operations remain available. No real configuration value or database migration was changed locally.
