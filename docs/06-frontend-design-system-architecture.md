# GlycoLink Frontend Design System Architecture v1.0

The reusable frontend foundation every screen composes from. Its job is to end the "isolated screens" problem by providing one canonical layer of **tokens → primitives → clinical components → layouts**, with clinical safety and accessibility baked into components rather than left to each page.

> **Scope:** this is the reusable system only. It does **not** redesign or build any screen (Monitoring, Dashboard, etc.). It is the foundation those redesigns will consume.

## Ratified decisions (locked)

1. **Canonical palette = Design System spec (doc 03): teal `#127C86` primary, flat, bordered, no shadows/gradients.** The legacy `tailwind.config.ts` (blue `#1565C0`, `subtle`/`soft` shadows, `hero-grid`/`clinical-grid` gradient textures) is **deprecated** and migrates to the token layer. This matches the saved flat/bordered UI preference.
2. **Charts use Recharts** (`npm i recharts`), isolated behind an internal `ChartProvider` adapter so no screen depends on the library directly.

## Repo reality (grounding)

- **Data layer:** Apollo Client + GraphQL (**not** React Query). DS components are presentational/data-agnostic, so this is a clean boundary — screens bind Apollo data and pass props into DS components.
- **Primitives:** shadcn-style components already exist in `components/ui/` (button, input, badge, card, label, textarea…) using CVA + clsx + tailwind-merge + lucide-react.
- **Shells/routing:** App Router with role route groups `app/(patient|consultant|admin|public)`; role shells exist (`PatientShell`/`ConsultantShell`/`AdminShell` + sidebars/headers).
- **Charts:** no chart library installed prior to this work — Recharts to be added in Phase 4.

---

## Architectural boundary (the rule that makes it reusable)

> **Design-system components are presentational and data-agnostic.** They receive typed props and emit events. They never call Apollo, never know routes, never fetch. Data binding (GraphQL), routing, and business logic live in *feature/screen* components that compose the DS. This is what lets the same `GlucoseChart` serve patient Monitoring and consultant Patient-detail unchanged.

```
Tokens → ui/ primitives (shadcn) → design-system/ (clinical components) → features/ & app routes (screens)
```

---

## 1. Folder Structure

```
glycolink-front/
├── app/                                  # App Router (existing route groups)
│   ├── (patient)/  (consultant)/  (admin)/  (public)/
│   ├── globals.css                       # imports tokens.css; minimal base only
│   └── layout.tsx
│
├── components/
│   ├── ui/                               # shadcn-style PRIMITIVES (existing) — atoms
│   │   ├── button.tsx  input.tsx  badge.tsx  card.tsx  label.tsx
│   │   ├── textarea.tsx  dialog.tsx  popover.tsx  select.tsx  tabs.tsx …
│   │   └── icons.ts
│   │
│   ├── design-system/                    # 🆕 GLYCOLINK DESIGN SYSTEM (reusable layer)
│   │   ├── index.ts                      # public barrel — screens import ONLY from here
│   │   ├── primitives/
│   │   │   ├── Text.tsx                   # typography scale (display/h1…/clinical)
│   │   │   ├── Stack.tsx  Inline.tsx      # spacing primitives (token-driven)
│   │   │   ├── Surface.tsx                # bordered flat surface (no shadow)
│   │   │   └── ClinicalValue.tsx          # tabular value + unit (safety primitive)
│   │   ├── status/
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── GlucoseStatusBadge.tsx
│   │   │   ├── AppointmentStatusBadge.tsx
│   │   │   └── status.config.ts           # locked status → {color,icon,label,style}
│   │   ├── cards/
│   │   │   ├── ClinicalSummaryCard.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── AlertCard.tsx
│   │   │   ├── ActionCard.tsx
│   │   │   └── TimelineCard.tsx
│   │   ├── charts/
│   │   │   ├── ChartProvider.tsx          # internal Recharts adapter (isolates the lib)
│   │   │   ├── GlucoseChart.tsx
│   │   │   ├── TimeInRangeBar.tsx
│   │   │   ├── TrendChart.tsx
│   │   │   └── chart.tokens.ts            # band colors, point shapes, axis config
│   │   ├── forms/
│   │   │   ├── ClinicalNumberInput.tsx    # unit-locked + range guard
│   │   │   ├── DateInput.tsx  TimeInput.tsx
│   │   │   ├── UnitSelector.tsx
│   │   │   ├── FormField.tsx              # label + helper + error wrapper
│   │   │   └── useRangeGuard.ts
│   │   ├── feedback/
│   │   │   ├── InlineAlert.tsx
│   │   │   ├── Toast.tsx / toast.ts
│   │   │   ├── ConfirmationDialog.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── layout/
│   │   │   ├── PageContainer.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── SectionHeader.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── CardGrid.tsx
│   │   └── navigation/
│   │       ├── Sidebar.tsx                # generic, config-driven
│   │       ├── BottomNav.tsx              # patient mobile
│   │       ├── Tabs.tsx                   # facet tabs
│   │       └── Breadcrumbs.tsx
│   │
│   ├── shared/                            # cross-feature COMPOSITES (not pure DS)
│   ├── layout/                            # role shells (existing)
│   └── patient/ consultant/ admin/       # SCREEN components (composition + data only)
│
├── lib/
│   ├── design-tokens/
│   │   ├── tokens.css                     # 🆕 CSS variables — SINGLE SOURCE OF TRUTH
│   │   └── tokens.ts                      # 🆕 typed token accessors
│   ├── glucose/units.ts                   # mg/dL ↔ mmol/L + status derivation (pure)
│   ├── utils/cn.ts                        # clsx + tailwind-merge (existing)
│   └── … (existing role services, validation)
│
├── features/  hooks/  types/  public/
├── tailwind.config.ts                    # maps tokens → utilities (refactored)
└── docs/
```

**Naming & import rules**
- Screens import **only** from `@/components/design-system` (the barrel). Raw `ui/` imports in screens are lint-flaggable — wrap in the DS instead.
- DS components import `ui/` primitives + tokens, never feature code.
- PascalCase files; one component per file; co-locate `*.config.ts`, `*.tokens.ts`, hooks beside their component.

---

## 2. Design Tokens

**Architecture:** tokens live as **CSS custom properties in `lib/design-tokens/tokens.css`** (single source of truth, themeable, dark-mode-ready), surfaced to Tailwind as semantic utilities, mirrored in `tokens.ts` for TS. **Components reference semantic tokens only — never raw hex.**

```
Primitive tokens (raw scale) → Semantic tokens (intent) → Component tokens (optional)
--teal-500: #127C86          → --color-action: var(--teal-500)
```

**Naming convention:** `--{category}-{role|scale}-{state?}` — `--color-action`, `--color-action-hover`, `--color-status-low`, `--space-4`, `--radius-lg`, `--border-default`. Tailwind utilities mirror semantics: `bg-action`, `text-status-low`, `border-default`.

### Colors (canonical — teal/flat)

| Semantic token | Primitive | Use |
|---|---|---|
| `--color-bg-app` | neutral-50 `#F8FAFA` | App background |
| `--color-bg-surface` | neutral-0 `#FFFFFF` | Cards/surfaces |
| `--color-border` | neutral-200 `#E2E7E7` | Default 1px border |
| `--color-border-strong` | neutral-300 `#CBD2D2` | Dividers |
| `--color-text-primary` | neutral-900 `#171B1B` | Headings/body |
| `--color-text-secondary` | neutral-600 `#4B5454` | Secondary |
| `--color-text-muted` | neutral-500 `#6B7575` | T4 meta |
| `--color-action` / `-hover` | teal-500 `#127C86` / teal-600 `#0E646D` | Primary action/links |
| `--color-focus` | teal-500 | Focus ring |

### Status colors (locked)

| Token | Surface (50) | Base (500) | Text/icon (700) |
|---|---|---|---|
| `--color-success` / in-range | `#ECFDF3` | `#15A34A` | `#15803D` |
| `--color-warning` / high | `#FFFBEB` | `#F59E0B` | `#B45309` |
| `--color-danger` / low·critical | `#FEF2F2` | `#EF4444` | `#B91C1C` |
| `--color-info` / pending·scheduled | `#EFF6FF` | `#3B82F6` | `#1D4ED8` |
| `--color-neutral` / completed·expired | neutral-100/500/700 | | |

### Typography

| Token | Size / line-height / weight | Notes |
|---|---|---|
| `--text-display` | 48px / 1.05 / 700 | tabular; hero metric |
| `--text-h1` | 30px / 1.15 / 700 | |
| `--text-h2` | 24px / 1.2 / 600 | |
| `--text-h3` | 18px / 1.3 / 600 | |
| `--text-body` | 16px / 1.5 / 400 | patient floor 16px |
| `--text-small` | 14px / 1.45 / 400 | |
| `--text-clinical` | 20–28px / 1.1 / 600 | **tabular-nums**, unit adjacent |
| `--text-label` | 13px / 1.3 / 600 | |

Families: `--font-sans` (Inter), clinical numerals via `tabular-nums lining-nums`. **Mandate:** all changing numbers use tabular figures.

### Spacing (4px base)
`--space-1`=4, `-2`=8, `-3`=12, `-4`=16 (default), `-6`=24 (card), `-8`=32, `-12`=48, `-16`=64. **Density modes:** patient 4/6, consultant 2/3 via `data-density` on the shell.

### Radius
`--radius-sm`=4 · `--radius-md`=8 · `--radius-lg`=12 · `--radius-full`=999.

### Borders
`--border-default`=1px var(--color-border) · `--border-strong`=1px var(--color-border-strong) · `--border-focus`=2px var(--color-focus). Borders are the primary separation device.

### Shadows
**None by default (flat).** Legacy `subtle`/`soft` shadows + `clinical-grid`/gradient backgrounds are **removed from the DS path**. A single optional `--shadow-overlay` is reserved **only** for true floating layers (dropdown/popover/toast/modal). Cards never use shadow.

### Motion / z-index
`--motion-fast`=120ms `-base`=200ms `-slow`=320ms, ease-out, reserved (Critical alerts only). z-index: sticky 100 · dropdown 200 · overlay 300 · modal 400 · toast 500 · critical-alert 600.

---

## 3. Core Components

APIs are TypeScript contracts (the implementation spec). All forward refs, accept `className` merged via `cn()`, and **never fetch data**.

### Status

**`StatusBadge`** — generic, drives every badge from the locked config.
```ts
type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";
type StatusStyle = "soft" | "solid" | "outline";
interface StatusBadgeProps {
  tone: StatusTone;
  label: string;            // always present — never icon/color alone
  icon?: LucideIcon;        // defaults from config
  style?: StatusStyle;      // default "soft"; "solid" forced for critical
  size?: "sm" | "md";
}
```
Variants: soft (info), solid (urgent/critical), outline (inactive: expired/cancelled). Rules: never recolor ad hoc; always render `label`; Critical must be solid; prefer domain wrappers.

**`GlucoseStatusBadge`**
```ts
interface GlucoseStatusBadgeProps { valueMgDl: number; targets?: GlucoseTargets; showValue?: boolean }
```
Derives In Range/High/Low/Critical via the single `deriveGlucoseStatus()` in `lib/glucose`. No screen computes status itself.

**`AppointmentStatusBadge`** — maps Active/Completed/Pending/Cancelled/Expired → tone/style/icon.

### Cards
All cards: flat `Surface` (white, 1px border, `--radius-lg`, `--space-6` padding, no shadow), one T1 element max, header (title left / status·action right), full-card hit area when `onPress`.

**`ClinicalSummaryCard`**
```ts
interface ClinicalSummaryCardProps {
  label: string; value: ReactNode; status?: ReactNode;
  referenceRange?: string; meta?: string; trend?: ReactNode;
  onPress?: () => void;
}
```
**`MetricCard`**
```ts
interface MetricCardProps {
  label: string; value: ReactNode;
  delta?: { direction: "up" | "down" | "flat"; text: string; tone?: StatusTone };
  sparkline?: ReactNode;
}
```
Delta uses arrow + sign + tone, never color alone.

**`AlertCard`**
```ts
interface AlertCardProps {
  tone: StatusTone; title: string; description?: string;
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;   // forbidden when clinical/critical
  critical?: boolean;      // solid + assertive aria-live
}
```
**`ActionCard`**
```ts
interface ActionCardProps {
  icon?: LucideIcon; title: string; description?: string;
  action: { label: string; onClick: () => void };  // exactly ONE CTA
  status?: "todo" | "done";
}
```
**`TimelineCard`**
```ts
interface TimelineItem { id: string; time: string; title: string; status?: ReactNode; onPress?: () => void }
interface TimelineCardProps { title?: string; items: TimelineItem[]; order?: "asc" | "desc" }
```

### Charts (Recharts behind `ChartProvider`)
All charts: plain data props, render a target/range band, encode out-of-range points by **shape + color**, and **require a data-table fallback**.

**`GlucoseChart`**
```ts
interface GlucosePoint { t: string | number; valueMgDl: number; source?: "manual" | "device" }
interface GlucoseChartProps {
  data: GlucosePoint[]; targets?: GlucoseTargets;
  range: "day" | "week" | "2week" | "month";
  unit?: GlucoseUnit; onPointSelect?: (p: GlucosePoint) => void;
  ariaSummary: string;   // required text alternative
}
```
**`TimeInRangeBar`**
```ts
interface TimeInRangeBarProps { low: number; inRange: number; high: number; windowLabel?: string; ariaSummary: string }
```
**`TrendChart`** — generic line/area over time (labs, weight, metrics) with optional reference band; same shape-coding + aria rules.

### Forms

**`ClinicalNumberInput`** (safety-critical)
```ts
interface ClinicalNumberInputProps {
  value: number | null; onChange: (v: number | null) => void;
  unit: string;          // FIXED, always adjacent, never truncated
  guard?: { min?: number; max?: number; softMin?: number; softMax?: number };
  precision?: number; inputMode?: "decimal" | "numeric";
  label: string; status?: "default" | "error" | "warning";
}
```
Unit never editable here; `useRangeGuard` blocks impossible, soft-confirms implausible; tabular display; numeric keypad.

**`DateInput` / `TimeInput`** — calendar/clock + numeric fallback; `TimeInput` defaults to "Now"; appointment contexts must display timezone.
**`UnitSelector`** — mg/dL ↔ mmol/L (Settings/onboarding, not inline during logging).
**`FormField`** — label-above + helper + error wrapper enforcing a11y association.

### Layout
**`PageContainer`** `{ role?: "patient"|"consultant"|"admin"; width?: "default"|"wide"|"full" }` · **`PageHeader`** (title + breadcrumb? + actions slot) · **`SectionHeader`** · **`EmptyState`** (never looks like an error) · **`CardGrid`** (token gaps).

### Feedback
**`InlineAlert`** (banner: load errors, info, callouts; icon + text always) · **`Toast`** (imperative; aria-live polite, assertive for critical; preserves input on errors) · **`ConfirmationDialog`** (required for destructive/clinical mutations) · **`Skeleton`** (reserve space to avoid layout shift).

---

## 4. Page Layout System

| Aspect | Patient | Consultant | Admin |
|---|---|---|---|
| Content width | ~640–768px single column, centered | fluid master–detail, ≤~1440 | fluid tables, ≤~1440 |
| Density (`data-density`) | comfortable (4/6) | compact (2/3) | compact |
| Page header | title + 🔔 + avatar; back when nested | title + breadcrumb + search + actions | title + breadcrumb + actions |
| Actions area | sticky bottom primary (thumb zone) | top-right + row toolbars | top-right |
| Card spacing | `--space-4` vertical stack | `--space-3` grid | `--space-3` grid/tables |
| Responsive | mobile-first; tables → stacked cards | desktop-first; tablet frozen-column scroll | desktop-only; read-only mobile fallback |

Rules: one primary action per page; reading order = priority order; clinical values keep T1 legibility at every breakpoint, never truncate.

---

## 5. Navigation Components

Generic, **config-driven** (role shells declare nav data, not bespoke markup).

**`Sidebar`** (consultant/admin)
```ts
interface NavItem { label: string; href: string; icon: LucideIcon; badgeCount?: number }
interface NavGroup { label: string; items: NavItem[] }
interface SidebarProps { groups: NavGroup[]; collapsed?: boolean; activeHref: string; footer?: ReactNode }
```
**`BottomNav`** (patient mobile) — max 5 items, thumb-zone; 🔔 in app bar, not here.
**`Tabs`** — facets of one entity; URL-synced via `?tab=`; preserves sibling state. Not for different entities.
**`Breadcrumbs`** (consultant/admin) — ancestry + back-to-source; canonical routes.

All nav: active state never color-only; full keyboard; `aria-current="page"`.

---

## 6. Component Usage Rules

| Use… | When | Not when |
|---|---|---|
| ClinicalSummaryCard | Current *state* of a clinical domain — one headline value + status | Several equal KPIs → MetricCards; needs a CTA → ActionCard |
| MetricCard | Single KPI + trend/delta in a grid | Needs status badge + range → ClinicalSummaryCard |
| AlertCard | Something needs attention now (abnormal/critical/overdue) | Routine info → InlineAlert/text |
| ActionCard | Prompting exactly one task | Pure info → summary/metric; multiple actions → rethink |
| TimelineCard | Chronological history | Non-temporal lists → list/table |
| StatusBadge (raw) | Building a new domain badge | A wrapper exists → use it |
| InlineAlert | Page-level non-blocking message | Transient confirmation → Toast; blocking → ConfirmationDialog |
| ConfirmationDialog | Destructive/clinical mutation | Reversible low-stakes → do it + Toast |
| Tabs | Facets of one entity | Different destinations → routes |

**Hard laws:** (1) one T1 + one primary action per surface; (2) status only via the status system; (3) clinical numbers only via `ClinicalValue`/`ClinicalNumberInput`; (4) charts always ship a text/table alternative; (5) screens import from the DS barrel, never raw `ui/`.

---

## 7. Accessibility Standards (every component)

WCAG 2.2 AA floor:
- Contrast ≥4.5:1 text, ≥3:1 large/UI/graphical (chart bands, points, borders, status icons).
- No color-only signaling (color + icon + text).
- Full keyboard, visible focus (`--border-focus`), logical order, no traps; overlays trap + restore focus.
- Screen readers: semantic roles, labelled controls, `FormField` association, charts expose `ariaSummary` + table fallback, live regions (polite default, assertive for Critical).
- Touch targets ≥44×44px, ≥8px apart.
- Text scaling to 200% / reflow at 320px; clinical values never truncate.
- `prefers-reduced-motion` respected; animation reserved for Critical alerts.
- Plain language (~grade 8) for patient copy.
- Enforcement: `eslint-plugin-jsx-a11y` in CI + component a11y tests + Storybook a11y addon.

---

## 8. Implementation Roadmap

Bottom-up; each phase gates on the prior passing a11y + visual review.

**Phase 0 — Scaffold (decisions ratified)**
- Create `lib/design-tokens/{tokens.css,tokens.ts}` with the **teal/flat** palette; refactor `tailwind.config.ts` to consume semantic tokens; **remove deprecated shadows/gradients/`clinical-grid`** from the DS path.
- Stand up `components/design-system/index.ts` barrel + Storybook + lint rule (no raw `ui/` in screens).

**Phase 1 — Tokens & primitives:** `Text`, `Stack`/`Inline`, `Surface`, `ClinicalValue`; map Button/Input primitives to tokens.

**Phase 2 — Status & cards:** `status.config.ts` + `StatusBadge` + `GlucoseStatusBadge` + `AppointmentStatusBadge`; `ClinicalSummaryCard`, `MetricCard`, `AlertCard`, `ActionCard`, `TimelineCard`.

**Phase 3 — Forms & feedback:** `FormField`, `ClinicalNumberInput` + `useRangeGuard`, `DateInput`, `TimeInput`, `UnitSelector`; `InlineAlert`, `Toast`, `ConfirmationDialog`, `Skeleton`; `lib/glucose/units.ts`.

**Phase 4 — Charts:** `npm i recharts`; `ChartProvider` adapter → `TimeInRangeBar`, `TrendChart`, `GlucoseChart` (band/shape encoding + table fallbacks).

**Phase 5 — Layout & navigation:** `PageContainer`, `PageHeader`, `SectionHeader`, `EmptyState`, `CardGrid`; `Sidebar`, `BottomNav`, `Tabs`, `Breadcrumbs`; wire existing role shells to config-driven nav.

**Phase 6 — Hardening:** visual regression + a11y CI gates; usage-rules in Storybook; migrate the pilot screen (Monitoring — the agreed first redesign) to validate end-to-end before rollout.

---

## 9. Output Summary

- **Architecture document:** this file — boundary (DS = presentational/data-agnostic), token layering (CSS vars → semantic → Tailwind), 4-layer composition model, ratified palette + chart decisions.
- **Component inventory:** 4 primitives · 3 status · 5 cards · 3 charts · 5 forms · 5 layout · 4 feedback · 4 navigation = **33 reusable components**, each with typed props, variants, usage rules.
- **Folder structure:** §1 — new `components/design-system/` layer on existing `ui/` primitives, single-source token module in `lib/design-tokens/`.
- **Development roadmap:** §8 — Phase 0 scaffold → primitives → status/cards → forms/feedback → charts → layout/nav → hardening.
