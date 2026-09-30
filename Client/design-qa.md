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
