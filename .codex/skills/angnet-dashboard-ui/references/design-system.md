# AngNet Admin Design System

This reference translates the selected visual direction into implementation decisions for the AngNet dashboard.

## Design Character

The dashboard should feel like a modern enterprise SaaS product: clean, minimal, content-first, professional, subtle, spacious, and highly usable. Aim for the polish of Linear, Vercel, Notion, Shopify Admin, or Stripe Dashboard without copying any product directly.

Avoid heavy shadows, unnecessary gradients, excessive borders, oversized cards, inconsistent spacing, decorative UI without functional value, and multiple competing accent colors.

## Tokens

Define these under `.admin-ui` and consume them through variables. Values may be tuned together after visual comparison; do not change them independently on individual pages.

```scss
.admin-ui {
  --admin-bg: #f4f7fb;
  --admin-surface: #ffffff;
  --admin-surface-subtle: #f8fafc;
  --admin-sidebar: #14213a;
  --admin-sidebar-hover: #1d2d4c;
  --admin-text: #172033;
  --admin-text-secondary: #667085;
  --admin-text-tertiary: #8b97aa;
  --admin-border: #e2e8f0;
  --admin-border-strong: #cbd5e1;
  --admin-primary: #1677ff;
  --admin-primary-hover: #0958d9;
  --admin-primary-soft: #eaf4ff;
  --admin-danger: #dc2626;
  --admin-success: #15803d;
  --admin-warning: #b45309;
  --admin-focus: rgba(22, 119, 255, 0.24);

  --admin-radius-sm: 6px;
  --admin-radius-md: 10px;
  --admin-radius-lg: 12px;
  --admin-shadow-card: 0 4px 16px rgba(23, 32, 51, 0.05);
  --admin-shadow-floating: 0 12px 32px rgba(23, 32, 51, 0.12);

  --admin-space-1: 4px;
  --admin-space-2: 8px;
  --admin-space-3: 12px;
  --admin-space-4: 16px;
  --admin-space-5: 20px;
  --admin-space-6: 24px;
  --admin-space-8: 32px;
  --admin-space-10: 40px;

  --admin-control-height: 40px;
  --admin-page-max: 1600px;
  --admin-sidebar-width: 68px;
  --admin-topbar-height: 68px;
}
```

Use white as the main surface, pale blue-gray as the application canvas, deep navy for navigation, and one blue brand color. Additional colors must carry semantic meaning such as success, warning, or danger.

## Typography

- Use one sans-serif stack throughout admin: `Inter, "DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif`.
- Body: 14px/1.5, weight 400.
- Labels and table headers: 13–14px, weight 600.
- Page title: 20–24px, weight 650–700, line height about 1.25.
- Section title: 16px, weight 650.
- Supporting copy: 12–13px, normal weight, secondary color.
- Avoid all-caps headings except compact technical labels where scanning improves.

## Spacing And Density

Use an 8px base rhythm, with 4px only for fine internal alignment. Typical page padding is 20–24px; card padding is 20–24px; main grid gap is 16–20px; form item spacing is 18–20px.

The design is spacious but not oversized. More space should clarify grouping, not make controls or cards unnecessarily large.

## Surfaces And Cards

- Page canvas: `--admin-bg`.
- Cards: white, 1px `--admin-border`, 10–12px radius.
- Use the card shadow only when it helps distinguish a major surface. Prefer a border alone for nested or secondary groups.
- A card must have one semantic purpose, such as post settings, thumbnail, related files, filters, or a data table.
- Do not place every form field in its own card.
- Card headers use a compact icon, a section title, and an optional secondary action aligned right.

## Form Controls

- Put labels above controls. Labels should not consume a separate horizontal column.
- Controls are 40px high on desktop and at least 44px touch height on narrow screens.
- Use a 1px neutral border, 6–8px control radius, white background, and clear placeholder contrast.
- Focus uses the primary border plus a restrained focus ring. Never remove keyboard focus indication.
- Helper text sits directly below the control and explains format or consequence.
- Validation messages replace or follow helper text without shifting unrelated groups excessively.
- Required markers are semantic and restrained. Do not communicate errors through color alone.
- Primary fields such as article title, description, and content visually dominate status and metadata.

## Actions

- One filled primary button per page, placed at the right side of the page header or the end of the main task.
- Secondary actions use outline/default style. Tertiary actions use text/ghost style.
- Destructive actions are visually quiet until invoked, then require clear confirmation when irreversible.
- Buttons normally use 40px height, 8px radius, 12–16px horizontal padding, a real icon when useful, and 8px gaps.
- Do not add Draft, Preview, Delete, or Publish actions unless corresponding product behavior exists.

## Navigation And Page Shell

- Desktop sidebar may remain collapsed at about 68px when labels are discoverable through tooltips and active state.
- Use a deep navy sidebar, muted idle icons, a soft navy hover, and blue active surface/icon treatment.
- The top page header is a calm white surface with title/back navigation on the left and page actions on the right.
- Main content uses a centered max-width container and 20–24px padding.
- Use sticky positioning for a long-form page header or settings rail only when it does not hide validation errors or essential content.

## Tables And Lists

- Tables live in one primary surface, not inside nested `nz-layout` containers.
- Keep headers compact with a subtle neutral background and 12–13px semibold text.
- Prefer 48–52px rows, light separators, subtle hover, and no vertical gridlines unless comparison requires them.
- Use human-readable Vietnamese labels rather than raw property names such as `ShortTitle` or `FlagActive`.
- Keep row actions grouped at one edge; icon-only actions require accessible names/tooltips.
- Filters form a compact toolbar above the table and collapse cleanly on mobile.
- Empty states explain what is missing and present the next available action when one exists.

## Uploads

- Use a purposeful drop zone for prominent uploads: dashed border, 10px radius, clear icon, action title, supported formats, ratio, and size.
- Show preview, upload progress, error, replace, and remove states.
- Do not rely on the default small NG-ZORRO picture-card for a page-level thumbnail.
- Related file upload may use a smaller secondary button plus a structured empty/file list state.

## Editor

- Treat title, summary, editor toolbar, and editable canvas as one authoring flow.
- Keep the CKEditor toolbar visually integrated with the editor; align its border, radius, icon color, and spacing with admin controls.
- Extra embed tools belong in a compact secondary tool row, not as visually competing primary buttons.
- The editable area must have a useful minimum height without forcing excessive blank page height on mobile.

## Motion

- Use 140–200ms transitions for hover, focus, disclosure, and small state changes.
- Avoid decorative entrance animations in high-frequency admin workflows.
- Honor `prefers-reduced-motion`.

## Accessibility Minimums

- Target WCAG AA contrast for text and interactive states.
- Maintain logical heading order, visible labels, focus-visible rings, and keyboard-reachable actions.
- Icon-only controls require an accessible name and usually a tooltip.
- Do not encode state solely by hue; pair color with text, icon, or shape.
- Preserve semantic form errors and announce async upload/save outcomes through existing NG-ZORRO message mechanisms.
