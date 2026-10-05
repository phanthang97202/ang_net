---
name: angnet-dashboard-ui
description: Design, redesign, or review the Angular/NG-ZORRO admin dashboard in the ang_net repository using its modern enterprise SaaS design system. Use for dashboard shells, create/edit forms, tables, filters, cards, uploads, editors, and admin modals; do not apply it to the public blog UI.
---

# AngNet Dashboard UI

Create a cohesive, production-ready admin experience while preserving the application's business behavior. The visual direction is clean, minimal, content-first, professional, subtle, spacious, and highly usable.

## Grounding

Before changing an admin screen:

1. Inspect the current template, styles, component logic, shared components, and the same page type elsewhere in the dashboard.
2. Read [references/design-system.md](references/design-system.md). Treat it as the visual source of truth.
3. Read the relevant archetype in [references/page-patterns.md](references/page-patterns.md).
4. When styling or composing NG-ZORRO/CKEditor components, read [references/angular-ng-zorro.md](references/angular-ng-zorro.md).
5. When migrating an existing dashboard screen, use [references/current-audit.md](references/current-audit.md) as the baseline, then verify the current code because the baseline can become stale.

## Product Decisions Before Styling

- Identify the user's primary task, primary action, supporting actions, metadata, and exceptional states.
- Give the primary task the most space. Never default to equal-width columns.
- Group fields by meaning and frequency, not by whichever NG-ZORRO component renders them.
- Use one primary action per page. Use outline or ghost styling for secondary actions.
- Do not add, remove, or reinterpret business actions, validation, permissions, API calls, or persisted fields unless the user explicitly requests that behavior change.

## Implementation Rules

- Scope the system to the admin shell with `.admin-ui`; do not leak admin overrides into public pages.
- Define shared design tokens and component primitives before accumulating page-specific magic values.
- Keep NG-ZORRO for behavior and accessibility, but compose and style it so the result does not look like an untouched Ant Design demo.
- Prefer semantic page classes and shared admin primitives over Tailwind utility chains for reusable patterns.
- Preserve Angular form control names, bindings, validation, translations, permission checks, loading states, and editor data flow.
- Cards group related information. Do not wrap every control or subsection in a card.
- Use real icons from the existing NG-ZORRO icon set; do not use emoji, CSS drawings, or improvised SVGs.
- Keep visible copy in the screen's established language. Do not create a mixed-language interface unless the feature is intentionally bilingual.

## Verification

Verify the complete screen, not isolated CSS:

- Compare hierarchy, spacing, density, alignment, control heights, borders, radii, and shadows against the selected reference.
- Check at approximately 1440 px, 1024 px, 768 px, and 390 px widths.
- Exercise default, hover, focus-visible, disabled, loading, validation error, empty, and populated states that the screen supports.
- Confirm keyboard focus remains visible and primary actions remain reachable without horizontal scrolling.
- Run the relevant build or tests after implementation. Report any state that could not be exercised.

Do not claim pixel fidelity or accessibility compliance from source inspection alone. Use browser screenshots and interaction checks when implementing a visual redesign.
