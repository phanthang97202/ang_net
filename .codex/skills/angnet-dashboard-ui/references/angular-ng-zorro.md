# Angular And NG-ZORRO Implementation Guide

The application currently uses Angular 17, NG-ZORRO 17, standalone components, CKEditor 5, SCSS, and some Tailwind utilities. Preserve those choices unless the user requests a migration.

## Scoping

- Add `.admin-ui` at the admin shell, not separately on every dashboard page.
- Keep public theme tokens separate from admin tokens.
- Avoid unscoped global `.ant-*` overrides because the public site also uses NG-ZORRO.
- Overlay content renders outside the component tree. Use component overlay class inputs when available, or toggle one explicit admin marker on `html`/`body` while the admin layout is active.
- Internal `.ant-*` selectors are version-sensitive. Centralize unavoidable overrides in an admin theme stylesheet and annotate why they are necessary.

## Forms

- Prefer `[nzLayout]="'vertical'"` for dashboard forms.
- Use `nz-form-label` text above `nz-form-control`; avoid label/control span grids for ordinary fields.
- Keep validation bindings and `FormControl` names unchanged.
- Set input, select, tree-select, date picker, and buttons to the shared control height.
- Ensure `nz-select`, `nz-tree-select`, and upload areas fill their intended container.
- Do not use placeholders as the only label.

## Shared Components

Evolve shared components when several screens need the same visual behavior:

- `app-breadcrumb`: page header, back action, title, and action hierarchy.
- `app-button-common`: explicit visual variant and accessible icon-only usage.
- `app-upload-common`: drop zone, preview, progress/error, replace/remove states.
- `app-tag-status`: semantic, readable status treatment.
- `app-text-editor`: integrated toolbar/editor surface.

Keep public-facing use cases in mind. Add admin variants or scoped classes instead of silently changing every consumer.

## Tables

- Do not wrap a page table in another `nz-layout`/`nz-content`; the admin shell already owns layout.
- Apply a shared admin table class for header, row, hover, empty, loading, pagination, and scroll treatment.
- Preserve sorting, filtering, pagination, and permission-gated columns.
- Icon-only edit/delete controls need `aria-label` or an accessible tooltip.

## CKEditor

CKEditor renders child DOM that component-scoped styles may not reach. Put necessary editor overrides in the scoped global admin theme, for example `.admin-ui app-text-editor ...`, rather than globally restyling every `.ck-*` element.

Do not alter the editor plugin list, HTML support, upload behavior, or emitted content while performing a visual-only redesign.

## CSS Architecture

Preferred order:

1. Admin tokens on `.admin-ui`.
2. Admin shell layout.
3. Shared admin primitives (`admin-page-header`, `admin-card`, `admin-form`, `admin-table`, upload/editor variants).
4. Small page-specific layout rules.

Avoid repeated hex colors, shadows, radii, and control heights in component SCSS. Avoid `!important` unless required to beat a library rule, and document that requirement.

## Behavior Preservation Checklist

Before and after a visual refactor, confirm:

- Route and permission behavior is unchanged.
- Reactive form control names and submitted payloads are unchanged.
- Validation still marks and displays invalid fields.
- Translation switching still works.
- Upload callbacks and previews still work.
- CKEditor still initializes, updates both languages, and emits content.
- Table sorting, filtering, pagination, and row actions still work.
- Loading, disabled, and confirmation states are still reachable.
