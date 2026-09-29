## Description
<!-- Summary of changes made and why they are needed -->

## Type of Change
- [ ] Feature (Non-breaking change adding dispatch or operational capability)
- [ ] Bug fix (Fixes an issue or calculation mismatch)
- [ ] Refactoring (Code cleanup without changing functionality)
- [ ] Documentation / CI update

## Invariants & Quality Checklist (from AGENTS.md)
- [ ] **Lint:** `npm run lint` passes with 0 errors and 0 warnings.
- [ ] **Typecheck:** `npx tsc --noEmit` passes with 0 errors (strict mode, zero `any`).
- [ ] **Unit Tests:** `npm run test:unit` passes 100%.
- [ ] **Production Build:** `npm run build` succeeds cleanly.
- [ ] **No Inline Styles:** Zero `style={{ ... }}` usage. Only Tailwind CSS utilities used.
- [ ] **Theme Variables:** Colors use theme tokens (`text-foreground`, `bg-card`, etc.), zero hardcoded hex codes.
- [ ] **Multi-Tenancy:** All new table queries respect `company_id` and Row Level Security (RLS).
- [ ] **No Hard Deletes:** Soft deletes (`is_active: false`) are used for operational data.
- [ ] **Zero Emojis:** Only vector icons from `lucide-react` are used.
