# Design QA — Blog create/edit

## Visual truth

- Source: user-provided enterprise SaaS editor reference, 1455 × 827.
- Implementation: Angular/NG-ZORRO route `/dashboard/blog/create`, checked at 1455 × 827 and 390 × 844.
- Captures:
  - `artifacts/design-qa/blog-create-final-a11y.png`
  - `artifacts/design-qa/blog-create-mobile-final.png`

## Fidelity review

| Area | Result | Evidence |
| --- | --- | --- |
| App shell | Pass | 68px navy desktop sidebar, white 68px page header, pale neutral workspace, active content group in brand blue. |
| Information hierarchy | Pass | Authoring panel receives most horizontal space; settings, article image, and related files are grouped in the secondary column. |
| Form styling | Pass | Labels sit above controls; controls share 40px height, 8px radius, neutral borders, consistent focus states, and compact spacing. |
| Editor | Pass | CKEditor toolbar and content surface are integrated into the card and preserve all existing editing/embed behavior. |
| Upload states | Pass | Article image has a dashed drop zone with clear file guidance and an image replacement state; related files have helper and empty states. |
| Responsive behavior | Pass | At 390px the sidebar contracts to 56px, the page has no horizontal overflow, the primary editor appears first, and secondary cards remain reachable by vertical scroll. |
| Create/edit parity | Pass | Both routes use the same redesigned component; route mode still controls `Tạo/Sửa bài viết` and `Đăng/Cập nhật`. |

## Functional and accessibility checks

- Production build: passed (`npm run build`).
- Browser interaction: title/description input, language tabs, category dropdown, status state, and active navigation state verified.
- Publication status dropdown: verified after syncing `origin/master`; it displays all three persisted states — `Công khai`, `Bản nháp`, and `Chỉ mình tôi` — with the NG-ZORRO virtual-scroll height matched to the custom option layout.
- Final dropdown capture: `artifacts/status-dropdown-final.png` at 1440 × 900.
- Scoped axe audit on `.blogpost`: 0 violations after fixes.
- Two automated checks remain inconclusive rather than failed: NG-ZORRO select overlay contrast detection and duplicate tab ARIA IDs generated internally by NG-ZORRO 17.
- Existing build warnings outside this page remain unchanged (detail-news optional chaining, LESS deprecation, navbar style budget, and CommonJS dependencies).

final result: passed

## Blog list redesign

- Visual truth: the existing `/dashboard/blog` screenshot supplied by the user, normalized to the AngNet enterprise SaaS dashboard system.
- Desktop verification: 1440 × 900 with populated draft, public, and private states.
- Mobile verification: 390 × 844 with deliberate horizontal table scrolling and a sticky action column.
- Captures:
  - `artifacts/blog-list-desktop-final.png`
  - `artifacts/blog-list-mobile-final.png`
- Production build: passed (`npm run build`).
- TypeScript verification after final accessibility adjustment: passed (`npx tsc -p tsconfig.app.json --noEmit`).
- Scoped axe audit on `.blog-list-page`: 0 violations; pagination page-number contrast remains inconclusive because the single-character label is too short for automated analysis.
- Primary behaviors preserved: server pagination, sorting, pin toggle, notification confirmation, permission-based edit/notification controls, cache clearing, and navigation to create/edit.

final result: passed

# Footer copyright scenery

- Source visual: screenshot attached to the current user message (2048 x 683 displayed pixels).
- Scope: use the existing configurable image only behind the copyright strip; preserve upper footer content.
- Implementation: `Client/src/app/components/footer/footer.component.html` and `.scss`.
- Implementation screenshot: unavailable; no in-app browser tool is available in this session.
- Viewport/state: desktop and mobile, light/dark; rendered states not captured.
- Density normalization and full-view/focused comparisons: not performed without browser evidence.
- Fonts/copy: existing footer typography and copyright content retained; visual fidelity unverified.
- Layout: responsive scenery strip set to 280–440px, 260px on mobile; visual fidelity unverified.
- Color/image: existing image and page theme token reused, with an upper-edge fade; crop/contrast unverified in browser.
- Comparison history: no visual comparison performed; this is not a visual QA pass.
- Next step: inspect the footer after local preview or deployment and confirm the crop and strip height.

final result: blocked
