# GlycoLink Design & UX Documentation

Foundational UX, design, and information-architecture documentation for **GlycoLink** — a diabetes care coordination and telemedicine platform serving **Patients**, **Consultants**, and **Administrators**.

These documents are produced and maintained before and during screen redesign. They build on each other in order: the audit framework defines *how we evaluate*, the design system defines *what we build with*, the IA defines *how it's connected*, and the redesign framework defines *how we change screens*.

## Governing principle

> **Safety, accuracy, and trust outrank polish.** GlycoLink is a clinical product, not a consumer app. A confusing checkout loses a sale; a confusing glucose log or prescription screen can cause harm. Clinical screens (Prescriptions, Monitoring, Labs) carry a hard-cap veto — any ambiguity there is automatically a launch blocker.

## Document index

| # | Document | Purpose |
|---|----------|---------|
| 01 | [UX Audit Framework](./01-ux-audit-framework.md) | Reusable instrument for evaluating every screen — per-screen definition template + 8-dimension scoring rubric. |
| 02 | [Patient Portal Audit](./02-patient-portal-audit.md) | Heuristic audit of all 14 patient screens + priority ranking + redesign order. |
| 03 | [Healthcare Design System](./03-design-system.md) | Foundational design language — typography, color, clinical status, cards, tables, forms, charts, tokens, components. |
| 04 | [Information Architecture & Navigation](./04-information-architecture.md) | Navigation structure, deep-linking, and IA for Patient / Consultant / Admin. |
| 05 | [Screen Redesign Framework](./05-screen-redesign-framework.md) | The repeatable 12-section methodology every screen redesign follows. |
| 06 | [Frontend Design System Architecture](./06-frontend-design-system-architecture.md) | Reusable frontend foundation — folder structure, token layer, component APIs, layouts, roadmap. |
| 07 | [Frontend Implementation Rules](./07-frontend-implementation-rules.md) | Practical rules for forms, backend choices, UUID selection, page separation, details pages, and modals. |

## How the documents relate

```
01 UX Audit Framework ──► tells us WHAT is wrong + HOW we score it
03 Design System ───────► supplies COMPONENTS, tokens, status language
04 IA & Navigation ─────► supplies ROUTES, deep-links, placement
05 Redesign Framework ──► the BRIDGE: audit finding → shippable redesign
                          (validated by re-scoring on 01)
06 Frontend DS Arch ────► HOW the design system is built in code
                          (tokens → ui/ primitives → design-system/ → screens)
07 Frontend Rules ──────► HOW implementation avoids raw IDs, raw choices,
                          overloaded pages, and misplaced forms
```

## Redesign order (from the audit)

**Phase 1 — Clinical safety foundation:** Prescriptions → Monitoring → Labs
**Phase 2 — Daily entry point:** Dashboard
**Phase 3 — Care + revenue journey:** Provider Discovery → Provider Profile → Booking → Payments → Appointment Details → PCQ → Consultation Area
**Phase 4 — Supporting & system:** Notifications → Profile → Settings

## Status

| Artifact | Version | Status |
|----------|---------|--------|
| UX Audit Framework | 1.0 | ✅ Complete |
| Patient Portal Audit | 1.0 | ✅ Complete |
| Healthcare Design System | 1.0 | ✅ Complete |
| IA & Navigation System | 1.0 | ✅ Complete |
| Screen Redesign Framework | 1.0 | ✅ Complete |
| Frontend Design System Architecture | 1.0 | ✅ Complete (palette: teal/flat; charts: Recharts) |
| Frontend Implementation Rules | 1.0 | ✅ Complete |
| Screen redesign specs | — | 🟡 Monitoring spec drafted (not yet built) |
| Design system build | — | ⬜ Not started (next: Phase 0 — token layer) |
