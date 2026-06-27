# GlycoLink Healthcare Design System — Foundational Specification v1.0

The system every screen inherits before any redesign begins. It encodes the audit's governing principle into reusable primitives: **safety and legibility outrank decoration; trust is built through calm, structure, and consistency.** The visual language is deliberately **flat and bordered — structure through lines, spacing, and weight, not shadows or gradients** — which reads as clinical and credible rather than consumer-playful.

Everything below is expressed as tokens, scales, and rules that map cleanly to a **Tailwind theme + Next.js component library**.

---

## 1. Design Philosophy

**GlycoLink should feel like a calm, competent clinician — not an app fighting for attention.**

1. **Safety is a design property.** A number that can be misread is a defect. Clinical data gets the highest contrast, clearest type, tabular figures, explicit units, never color alone.
2. **Calm over stimulation.** Generous whitespace, restrained color, one accent per view. Color is *meaning*, not decoration.
3. **Structure through borders, not shadows.** Hierarchy from spacing, weight, dividers, 1px borders. No elevation theatrics.
4. **Trust through consistency.** The same status looks identical everywhere. Predictability *is* the brand.
5. **Context-appropriate density.** Patients: spacious, mobile-first, one-thing-at-a-time. Consultants: dense, desktop-first, scan-many.

Pre-resolved tensions: Clarity > cleverness · Legibility > brand expression · Recognition > recall · Prevention > correction.

---

## 2. Information Hierarchy Principles

| Tier | What it holds | Treatment |
|---|---|---|
| **T1 — Status** | "Am I okay?" / state (glucose range, Rx status, alerts) | Largest, highest contrast, color+icon, top/first |
| **T2 — Primary action** | The one thing to do here | Single dominant button |
| **T3 — Supporting data** | Trends, history, context, secondary fields | Medium weight, grouped, scannable |
| **T4 — Meta / utility** | Timestamps, IDs, settings, links | Smallest, neutral, low contrast |

Rules: one T1 focal point per view · one primary action per screen · clinical values are never T3/T4 legibility · reading order = priority order on mobile · grouping before styling.

---

## 3. Typography System

**Font families**
- **UI / text:** `Inter` (variable), with system fallback stack.
- **Clinical values & tabular data:** `Inter` with **tabular-nums + lining figures** enforced (or `IBM Plex Mono`). Tabular figures **mandatory** anywhere numbers change (glucose, doses, lab values, money, tables).

**Type scale** (base 16px = 1rem)

| Token | Use | Size | Weight | Line-height | Tracking |
|---|---|---|---|---|---|
| `text-display` | Hero metric | 48px / 3rem | 700 | 1.05 | −0.02em |
| `text-h1` | Screen title | 30px / 1.875rem | 700 | 1.15 | −0.01em |
| `text-h2` | Section heading | 24px / 1.5rem | 600 | 1.2 | −0.01em |
| `text-h3` | Card title | 18px / 1.125rem | 600 | 1.3 | 0 |
| `text-body` | Default text | 16px / 1rem | 400 | 1.5 | 0 |
| `text-small` | Meta, captions, helper | 14px / 0.875rem | 400 | 1.45 | 0 |
| `text-clinical` | Clinical values | 20–28px | 600 | 1.1 | 0 (tabular-nums) |
| `text-label` | Form labels, table headers | 13px / 0.8125rem | 600 | 1.3 | +0.02em |

Rules: patient body floor 16px; consultant tables may use 14px, never below 13px · clinical values always pair value + unit, never split across a line break · max 2 weights per view · line length 50–75 chars · never communicate meaning by italics/color alone.

---

## 4. Color System

Calm, clinical, trustworthy. **Saturation = meaning.** Neutrals carry ~90% of the UI; semantic color appears only for status and primary action. All target **≥4.5:1 contrast** for text use.

**Primary — "GlycoLink Teal-Blue"**

| Step | Hex | Use |
|---|---|---|
| 50 | `#ECFAFB` | Tinted backgrounds, selected rows |
| 100 | `#CFF0F2` | Hover surfaces |
| 200 | `#A2E1E6` | Borders on tinted surfaces |
| 300 | `#5FC7CE` | Disabled/secondary accents |
| 400 | `#2EAAB3` | — |
| 500 | `#127C86` | Default actions / links |
| 600 | `#0E646D` | Hover/active button |
| 700 | `#0B4F56` | Pressed, headings on tint |
| 800 | `#083C41` | — |
| 900 | `#052A2E` | Text on light tints |

**Semantic palettes** (50 surface / 500 base / 700 text-on-light)

| Role | 50 | 500 | 700 | Meaning |
|---|---|---|---|---|
| **Success / In Range** | `#ECFDF3` | `#15A34A` | `#15803D` | Good, in-range, completed, verified |
| **Warning / High** | `#FFFBEB` | `#F59E0B` | `#B45309` | Elevated, attention, pending-with-risk |
| **Error / Critical / Low** | `#FEF2F2` | `#EF4444` | `#B91C1C` | Danger, critical, hypo, failed |
| **Info** | `#EFF6FF` | `#3B82F6` | `#1D4ED8` | Neutral information, scheduled, system |

**Neutral**

| Step | Hex | Use |
|---|---|---|
| 0 | `#FFFFFF` | Card / surface |
| 50 | `#F8FAFA` | App background |
| 100 | `#EFF2F2` | Subtle fill, table stripe |
| 200 | `#E2E7E7` | **Default border** |
| 300 | `#CBD2D2` | Strong border, dividers |
| 400 | `#9AA4A4` | Disabled text, placeholders |
| 500 | `#6B7575` | T4 meta text |
| 600 | `#4B5454` | Secondary body |
| 700 | `#343B3B` | Body text |
| 900 | `#171B1B` | Headings / primary text |

Rules: color never the only signal (status = color + icon + text) · one accent per view · no gradients, no shadows (separate via `neutral-200` borders + spacing) · glucose High = amber, Low = red, In-range = green · pure red reserved for error/critical/hypo.

---

## 5. Clinical Status System

Every status renders as a **badge = fill + border + icon + text label**, identical platform-wide. Two weights: **Solid** (urgent/critical) and **Soft** (informational). Shape + icon ensure meaning survives grayscale.

| Status | Domain | Color role | Style | Icon | Label |
|---|---|---|---|---|---|
| **In Range** | Glucose | Success | Soft | ● check-circle | "In Range" |
| **High** | Glucose | Warning | Soft | ▲ arrow-up | "High" |
| **Low** | Glucose | Error | Soft | ▼ arrow-down | "Low" |
| **Critical** | Glucose/Labs | Error | **Solid** | ◆ alert-octagon | "Critical" + value |
| **Active** | Rx / appt | Success | Soft (dot) | ● filled dot | "Active" |
| **Completed** | Appt / lab / Rx | Neutral | Soft | ✓ check | "Completed" |
| **Pending** | Lab / payment | Info | Soft | ◷ clock | "Pending" |
| **Expired** | Rx | Neutral-muted | Outline | ⊘ slash-circle | "Expired" |
| **Cancelled** | Appt / payment | Error-muted | Outline | ✕ x-circle | "Cancelled" |

Rules: badge = 1px border (200), fill (50), icon+text (700); solid inverts to fill 500/600 + white text; pill radius, padding `2px 8px`, `text-small`/600 · Critical never soft, always shows value · abnormal labs/glucose pair status + value + range · status colors locked (a component may not recolor a status) · animation only for Critical live alerts.

---

## 6. Card System

Flat: white, `neutral-200` 1px border, `radius-lg`, padding `space-4/6`, **no shadow.**

| Card | Purpose | Anatomy | Key rule |
|---|---|---|---|
| **Clinical Summary Card** | Snapshot of a clinical domain | Header (label + status) → T1 value → trend/meta → action link | T1 value dominant; unit always shown; tap deep-links |
| **Alert Card** | Surface something needing attention | 4px status accent bar + icon → message → action | Urgency from status system; critical = solid |
| **Action Card** | Prompt a specific task | Icon → title → context → single primary button | Exactly one CTA; changes state when done |
| **Metric Card** | Single KPI with context | Label → big value (tabular) → delta (↑/↓ %) → sparkline | Delta uses status colors + arrow, not color only |
| **Timeline Card** | Chronological events | Vertical line + node per event → time → title → status | Reverse-chron; each node deep-links |

Shared: consistent radius, header pattern (title left, status/action right), full-card hit area on mobile, never more than one T1 element.

---

## 7. Tables

**Patient tables:** used sparingly; prefer cards on mobile. Comfortable rows (48–56px), `text-body` 16px, zebra via `neutral-100`, status as badges, money/values right-aligned tabular.

**Clinical / consultant tables:** dense (36–40px), `text-small` 14px, **tabular figures mandatory**, sticky header + sticky first column, sortable/filterable, abnormal rows surfaced, abnormal values flagged (color + icon, never color-only) with range adjacent, numeric right-aligned, row selection + bulk actions + overflow menu.

**Mobile table behavior (rule):** tables do **not** horizontally scroll on patient mobile — they transform to **card-per-row (stacked)** label–value pairs or a **2-column priority view** expandable to detail. Consultant tablet tables may keep horizontal scroll **with frozen first column**. Never truncate clinical values — wrap/expand.

---

## 8. Form System

Designed for **prevention, one-thing-at-a-time, unambiguous input.**

- **Inputs:** height ≥44px, label **above** (never placeholder-as-label), `neutral-300` border, `radius-md`, 16px text. States: default/focus (primary-500 2px ring)/filled/disabled/error/success. Helper below; error replaces helper in `error-700` + icon.
- **Selects:** native on mobile; custom listbox on desktop; clinical pick-lists use **searchable combobox** with disambiguation (strength/form).
- **Date pickers:** calendar + numeric entry fallback; sensible default; **timezone explicit** for appointments; large targets; disabled dates not color-only.
- **Clinical numeric entry:** numeric keyboard, large tabular display, **unit always visible + fixed adjacent**, follows global unit preference, **range guards** (soft-warn implausible / hard-block impossible / confirm out-of-range), optional steppers but never the only method.
- **Validation:** inline on blur (not per keystroke); prevented via constraints first; never color alone (icon + message + `aria-describedby`); summary at top + focus to first error for long forms; **save/resume** on all clinical + onboarding forms; success confirmation for clinical submissions; destructive actions confirmed/reversible.

---

## 9. Chart Standards

Universal: **target/reference band as shaded zone**; out-of-range points by **shape + color**; axis units labeled, tabular figures; **text/table alternative** for every chart; no 3D/gradient/chart-junk; tooltips show value + unit + timestamp + status.

- **Glucose charts:** Day/Week/2-week views; line/scatter with target band; **Time-in-Range** headline metric (stacked bar low/in-range/high); low (red) + high (amber) excursions emphasized; mark meals/events.
- **Lab charts:** per-analyte trend with reference range band; abnormal points flagged; latest value called out as a metric with numeric range.
- **Trend charts:** sparklines in Metric Cards; delta vs prior with arrow + sign; consistent status color mapping; avoid smoothing that hides spikes.

---

## 10. Mobile Design Rules (Patient — mobile-first)

Thumb-zone primary actions + bottom tab bar + sticky CTA · one primary task per screen, progressive disclosure · targets ≥44×44px, ≥8px apart · **quick-log glucose in ≤2 taps** · body ≥16px, Dynamic Type to 200% · no horizontal scroll; tables → stacked cards; clinical values never truncated · correct keyboards + autofill + biometric login · offline-tolerant logging, clear save/sync · bottom-sheets for secondary actions.

---

## 11. Consultant Desktop Design Rules (desktop-first)

Information-dense multi-column + persistent left nav + optional right context panel · master–detail split views without full reloads · dense tables (sticky headers, sort/filter, abnormal-first, bulk actions) · keyboard-first (shortcuts, full tab order, command palette) · higher density (14px tables) but clinical values keep T1 legibility · queues + pending-review status + unsigned-items badge · same tokens, denser spacing · minimize clicks to clinical action (efficiency is a safety feature).

---

## 12. Accessibility Standards

Baseline **WCAG 2.2 AA** as a floor (retinopathy/neuropathy = core, not edge-case):
- Contrast ≥4.5:1 text, ≥3:1 large text & UI/graphical (incl. chart elements, borders, status icons).
- **Never color-only:** status/validation/abnormal = color + icon + text.
- Keyboard: full operability, visible focus, logical order, no traps, skip links.
- Screen readers: semantic structure, labels for every control, `aria-live` for alerts/errors, chart text alternatives, associated table headers.
- Touch targets ≥44px; ≥8px spacing.
- Text scaling to 200% without loss; reflow at 320px.
- Motion: respect `prefers-reduced-motion`; animation for critical alerts only.
- Forms: programmatic error association, clear instructions, no time-pressure on clinical entry.
- Plain-language clinical content (~grade 8).

---

## 13. Design Tokens & Spacing Scale

**Spacing — 4px base** (`space-N` = N×4px)

| Token | px | Use |
|---|---|---|
| `space-1` | 4 | Icon–text gap |
| `space-2` | 8 | Badge padding, min gap |
| `space-3` | 12 | Compact padding |
| `space-4` | 16 | **Default** padding |
| `space-5` | 20 | — |
| `space-6` | 24 | Card padding, section inner |
| `space-8` | 32 | Section spacing |
| `space-10` | 40 | — |
| `space-12` | 48 | Major section / gutters |
| `space-16` | 64 | Page-level rhythm |

> **Density modes:** Patient uses `space-4/6`; Consultant uses `space-2/3`. Same tokens, different selection.

**Radius:** `radius-sm` 4 (inputs/badges) · `radius-md` 8 (buttons/fields) · `radius-lg` 12 (cards) · `radius-full` 999 (pills/avatars).

**Borders:** `border-default` 1px `neutral-200` · `border-strong` 1px `neutral-300` · `border-focus` 2px `primary-500`. **No shadow tokens.**

**Semantic token layer** (components reference these, never raw hex)

| Semantic token | → Primitive |
|---|---|
| `color-bg-app` | neutral-50 |
| `color-bg-surface` | neutral-0 |
| `color-border` | neutral-200 |
| `color-text-primary` | neutral-900 |
| `color-text-secondary` | neutral-600 |
| `color-text-muted` | neutral-500 |
| `color-action` / `-hover` | primary-500 / 600 |
| `color-status-inrange` | success scale |
| `color-status-high` | warning scale |
| `color-status-low` / `critical` | error scale |
| `color-status-info` | info scale |

**Breakpoints:** `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. Patient designs from 360px; consultant from `lg`.

**Motion:** `fast 120ms / base 200ms / slow 320ms`, ease-out, minimal.

**z-index:** base 0 · sticky 100 · dropdown 200 · overlay 300 · modal 400 · toast 500 · critical-alert 600.

---

## 14. Component Inventory

**Foundations:** Color tokens · Typography · Spacing · Icons (single line-icon set, 2px stroke) · Border/radius · Motion

**Primitives:** Button (primary/secondary/tertiary/destructive/icon) · Link · Badge · **Status Badge** · Tag/Chip · Avatar · Divider · Tooltip · Spinner/Skeleton · Toast

**Forms:** Text Input · Textarea · Numeric Input · **Clinical Numeric Entry (unit + range guard)** · Select · **Searchable Combobox (medication-safe)** · Checkbox · Radio · Toggle · **Date Picker** · Time/Timezone Picker · Slider/Stepper · File Upload · Form Field wrapper · Validation Summary

**Data display:** **Clinical Summary Card** · **Alert Card** · **Action Card** · **Metric Card** · **Timeline Card** · Patient Table · Clinical Table · Stacked/Mobile Table · Definition List · Reference-Range display · Empty State · Stat/KPI

**Clinical-specific:** Status Badge set · **Glucose Chart** · **Time-in-Range bar** · **Lab Chart + range band** · **Trend/Sparkline** · Prescription Item (dose-legible) · Lab Result Row (abnormal-flagged) · Vital/Reading entry

**Navigation:** Top App Bar · **Bottom Tab Bar (patient)** · **Side Nav (consultant)** · Breadcrumbs · Tabs · Stepper/Progress · Pagination · Back control · Command palette (consultant)

**Overlays & feedback:** Modal/Dialog · **Confirmation Dialog (destructive/clinical)** · Bottom Sheet (mobile) · Drawer/Side Panel (consultant) · Popover · Banner/Inline Alert · Notification item

**Patterns (composed):** Booking flow shell · PCQ question shell · Payment summary · Consultation pre-call check · Dashboard widget grid · Master–detail (consultant)
