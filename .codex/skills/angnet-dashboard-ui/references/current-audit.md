# Current Dashboard Baseline

Date: 2026-10-02.

This is a migration baseline derived from the user-provided create-blog screenshots and repository source. Recheck the live screen before relying on it after future changes.

## What Already Helps

- Dashboard routes share an admin shell and reusable breadcrumb, button, upload, status, and editor components.
- The create-blog page already responds from two columns to one column.
- Several newer modal forms already use vertical labels.
- Global `:focus-visible` behavior exists instead of disabling keyboard focus.
- The create-blog editor is a shared CKEditor component and bilingual data flow is already separated.

## Highest-Impact Gaps

1. **Admin styling has no dedicated token layer.** Public theme variables exist, while admin pages mostly use hard-coded white, default NG-ZORRO values, and scattered local overrides.
2. **The shell is mostly default NG-ZORRO.** The sider/menu, canvas, and content spacing do not yet form a distinctive application frame. The intermediate dashboard layout component has no styling responsibility.
3. **The create-blog hierarchy is inverted.** Settings occupy the left column and the editor occupies the right. The chosen direction makes the authoring task the wide left region and groups settings, thumbnail, and related files in a right rail.
4. **Horizontal form labels consume useful width.** Status/category/thumbnail use 8/16 label-control grids, while the intended system uses labels above controls.
5. **The thumbnail upload is an untouched picture-card.** It is small and does not communicate ratio, accepted types, size, progress, or error states.
6. **The editor is functional but visually detached.** Embed tools, CKEditor toolbar, editable surface, labels, and help copy do not yet read as one authoring surface.
7. **Table pages expose library defaults.** Several tables are placed inside redundant `nz-layout` wrappers, use raw model names as column labels, and lack a shared surface/filter/empty-state pattern.
8. **Shared page spacing is implicit.** Many pages use `.master__container`, but no corresponding style definition was found in the inspected source.
9. **Component styling is inconsistent.** Some modals use vertical labels and deliberate grouping, while older forms and tables rely almost entirely on defaults.

## Create-Blog Target Structure

- White page header with back/title left and real actions right.
- Pale neutral application canvas.
- Wide authoring card on the left.
- Narrow semantic settings cards on the right.
- Vertical labels, 40px controls, 10–12px surfaces, restrained borders/shadows.
- Prominent thumbnail drop zone with clear requirements.
- Responsive collapse that keeps authoring before metadata.

## Evidence Limits

- The provided screenshots show only the create-blog page at desktop width.
- Hover, keyboard focus, validation, loading, upload progress, empty states, tablet/mobile behavior, and other dashboard routes were not visually exercised in this baseline.
- Repository inspection proves structure and styles, not final browser rendering or accessibility compliance.
