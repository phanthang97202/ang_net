# Dashboard Page Patterns

Choose the pattern that matches the user's task. Do not force one layout onto every screen.

## App Shell

Use a single admin shell around all `/dashboard` routes:

- Collapsed navigation rail around 68px on desktop, with a visible active item.
- White top/page header around 68px high.
- Pale blue-gray content canvas.
- Centered content container with a practical maximum width.
- Page-level spacing owned by the shell, not repeated ad hoc in every screen.

The shell should provide the `.admin-ui` scope and common tokens. Overlay components need an admin-specific overlay class or another explicit admin theme hook.

## Create/Edit Form

Use this for article creation and other long forms.

Desktop structure:

```text
Page header: back + title                     secondary  primary
┌────────────────────────────────────────┐  ┌──────────────┐
│ Primary task                           │  │ Settings     │
│ language tabs                          │  │ status       │
│ title                                  │  │ category     │
│ summary                                │  └──────────────┘
│ editor                                 │  ┌──────────────┐
│ hashtags                               │  │ Thumbnail    │
└────────────────────────────────────────┘  └──────────────┘
                                            ┌──────────────┐
                                            │ Related files│
                                            └──────────────┘
```

- Use `minmax(0, 1fr) minmax(300px, 380px)` rather than equal columns.
- Put the authoring task first in DOM and visual order; place metadata/settings in the right rail.
- Use one main authoring card and only a few semantic side cards.
- Labels are above inputs.
- Language tabs sit inside the authoring card and do not add a border around the whole form pane.
- If the settings rail becomes sticky, use a safe top offset and disable stickiness below desktop.
- At tablet width, move settings below the main task and allow suitable setting cards to form two columns.
- At mobile width, use one column, 16px page padding, full-width actions where needed, and no fixed minimum editor height.

Do not add draft or preview controls merely because the reference image contains them; only style actions backed by real behavior.

## List/Table Page

Structure:

```text
Page header: title / count                   primary action
┌─────────────────────────────────────────────────────────┐
│ Filters / search / reset                                │
├─────────────────────────────────────────────────────────┤
│ Data table                                              │
├─────────────────────────────────────────────────────────┤
│ Pagination                                              │
└─────────────────────────────────────────────────────────┘
```

- Use one table surface.
- Filters may share the table card or sit immediately above it; do not create unrelated nested layouts.
- Replace model-property headings with concise user-facing language.
- Put row actions together and keep their column predictable.
- On narrow screens, keep essential identity/status/action columns, allow deliberate horizontal scrolling, or switch to list cards when scanning would otherwise fail.

## Modal Form

- Use vertical labels and a clear modal title that names the task.
- Two columns are suitable for short related fields at modal widths around 720–760px.
- Collapse to one column on narrow screens.
- Keep the primary modal action on the right; cancel is secondary.
- Long explanatory copy should be helper text, not placeholder-only instruction.
- Upload previews and status controls need complete states, not default widgets dropped into a grid.

## Overview Dashboard

- Lead with actionable summaries, not decorative metric cards.
- Group metrics only when they support a decision or next action.
- Use a restrained grid; charts and tables get more space than small totals.
- Empty or unavailable metrics should explain why, not show ambiguous zeroes.

## Responsive Breakpoints

Use content behavior rather than device names, with these working checkpoints:

- Wide desktop: `>= 1280px` — two-column long forms and full tables.
- Compact desktop/tablet: `768–1279px` — one primary column; settings can use a compact grid below.
- Mobile: `< 768px` — one column, 16px padding, touch targets at least 44px, intentional table overflow/list conversion.

Avoid hiding required actions or fields at smaller widths. Reorder supporting information after the primary task instead.
