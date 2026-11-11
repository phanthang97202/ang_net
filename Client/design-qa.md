# Design QA — My posts

- Source visual truth: user-provided `/userinfor` screenshot in the current conversation
- Source dimensions: 893 × 749 px (browser screenshot, density not available)
- Intended implementation: `http://127.0.0.1:4200/userinfor?tab=posts`
- Browser-rendered evidence: local Chrome preview; unauthenticated navigation redirects to `/login`
- Supporting implementation capture: shared `app-news-card` rendered on the local home page at a 705 × 547 px browser viewport
- State: light theme; responsive card list loaded from the public API
- Density normalization: not applicable because the authenticated target screen could not be captured

## Findings

- [Blocked] The exact authenticated “Bài viết của tôi” state could not be captured. The local origin has no authenticated session and correctly redirects to `/login`, so the source and implementation cannot be compared at the same route and state.
- The shared news card was visually checked in the running local application. Its mobile stacking, image crop, category/read-time badges, typography, spacing, colors, and content wrapping render correctly with the existing system tokens.
- The Public/Private tab interaction and empty/loading states compiled successfully, but browser interaction testing is blocked by the missing local authenticated session.

## Required fidelity surfaces

- Fonts and typography: shared card uses the existing Montserrat hierarchy; exact profile-page comparison blocked.
- Spacing and layout rhythm: responsive shared card verified; exact two-column profile layout comparison blocked.
- Colors and visual tokens: implementation uses the existing `--color-*` theme tokens throughout.
- Image quality and asset fidelity: real article thumbnails are reused with `object-fit: cover`; no placeholder artwork or custom SVG assets were introduced.
- Copy and content: Vietnamese/English labels added for the two tabs, descriptions, and empty states.

## Primary interactions checked

- Shared card article, category, and hashtag links are present in the rendered accessibility tree.
- Responsive card layout is visible at the local browser viewport.
- Exact Public/Private tab switching: blocked by authentication.

## Console errors checked

- No feature-specific build errors remain. The production build completes with the project’s pre-existing Angular and CommonJS warnings.

## Comparison history

- Initial pass: target route redirected to login because the local browser had no session.
- Supporting pass: verified the extracted shared news card on the public home route after the refactor.

final result: blocked

---

## Navbar notification badge clipping — 2026-11-11

- Source visual truth path: user-provided cropped navbar screenshot in the current conversation.
- Implementation screenshot path: unavailable; the in-app browser is unavailable and the Chrome connector could not navigate the local tab.
- Viewport: compact navbar crop; exact browser viewport and density are unknown.
- Source pixel dimensions: 67 × 57 px as supplied in the conversation.
- Implementation pixel dimensions / CSS size / density normalization: unavailable because a browser screenshot could not be captured.
- State: dark theme, authenticated navbar, notification/calendar indicators visible.

### Full-view comparison evidence

- Blocked: no controllable browser-rendered capture was available at the same state.
- The source clearly shows the corner indicator clipped by the circular notification button.

### Focused region comparison evidence

- ChromeHeadless computed-style verification confirms `.notification-bell` now resolves to `overflow: visible` and `.notification-badge` renders the unread value `1`.
- The fix is scoped to the notification bell; other `.navbar-icon-btn` controls retain circular overflow clipping.

### Findings

- [Fixed] The shared `.navbar-icon-btn { overflow: hidden; }` clipped the absolutely positioned unread badge and calendar indicator at the rounded button edge.
- [Blocked] Exact visual placement in desktop/mobile light/dark themes could not be screenshot-compared because browser navigation failed.

### Comparison history

- Initial evidence: the supplied screenshot showed only a small purple corner fragment above the bell.
- Fix: override the bell to `overflow: visible` and place the numeric badge above adjacent indicator layers with `z-index: 1`.
- Post-fix evidence: 5 notification-menu tests pass, including a computed-style and unread-badge regression assertion; production build passes.

### Required fidelity surfaces

- Fonts and typography: unchanged.
- Spacing and layout rhythm: button and indicator coordinates unchanged; only clipping behavior changed.
- Colors and visual tokens: unchanged.
- Image quality and asset fidelity: existing bell icon retained; no new assets introduced.
- Copy and content: unchanged.

final result: blocked

---

## Profile tabs, badges, and primary action — 2026-11-11

- Source visual truth path: three user-provided screenshots in the current conversation (`Bài viết của tôi`, `Reels của tôi`, `Danh mục của tôi`).
- Implementation screenshot path: unavailable; the in-app browser is not available and the Chrome connector could not navigate a local tab (`timeoutMs` connector failure).
- Viewport: intended desktop comparison at 893 × 749 px, matching the largest reference screenshot.
- Source pixel dimensions: 893 × 749 px for the main profile screenshot; density unknown.
- Implementation pixel dimensions / CSS size / density normalization: unavailable because no browser-rendered capture could be produced.
- State: authenticated profile, light theme; article visibility tabs, Reels header, and lookup tabs.

### Full-view comparison evidence

- Blocked: the implementation could not be opened in a controllable browser at the same authenticated route and state.
- Source structure was preserved in code: existing profile header, content list, routes, icons, theme tokens, and responsive breakpoints remain unchanged.

### Focused region comparison evidence

- Blocked for the same browser connector issue. Code-level checks confirm the lookup tabs now use the same segmented-control measurements and tokens as the article tabs, and the Reel CTA now uses the same shared primary-button primitive as `Thêm mục`.

### Findings

- [Blocked] No browser-rendered evidence is available for exact spacing, wrapping, dark theme, or responsive visual comparison.
- No build or changed-file lint errors were introduced. The targeted Reel test passes; the production build passes with pre-existing project warnings.

### Comparison history

- Initial pass: in-app Browser was unavailable.
- Fallback pass: Chrome was selected as allowed by the browser policy, but local tab navigation failed in the connector before a screenshot could be captured.
- Fixes made before the blocked visual pass: per-tab count badges added; Reel CTA standardized to the shared primary button; lookup tabs standardized to the article segmented control.

### Primary interactions tested

- Reel list loading, link rendering, pagination/deduplication, empty state, failure state, and retry: automated test passed.
- Article count APIs and template bindings: production compilation passed.
- Exact tab clicks and responsive wrapping in a browser: blocked.

### Console errors checked

- Browser console unavailable because navigation could not be established.
- Production compilation completed successfully.

final result: blocked

---

## Home calendar and featured articles — 2026-11-05

- Reference: generated home-page design showing a calendar alongside three featured articles and a day popover.
- Implementation: calendar and featured-article layout use existing Angular components, themes, access control, and live services.
- Automated checks: targeted calendar and permission tests passed; production build passed with existing warnings.
- Visual comparison and interaction checks in a browser: blocked. The in-app browser is unavailable and the Chrome browser connector failed with `Cannot read properties of undefined (reading 'timeoutMs')` while opening or selecting a tab.
- Remaining verification: capture desktop and mobile views in an authenticated session and compare the calendar, three-card layout, theme, and day popover against the reference.

final result: blocked
