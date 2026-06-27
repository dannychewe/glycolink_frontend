# GlycoLink Screen Redesign Framework v1.0

The repeatable methodology every screen redesign follows. It binds the four prior artifacts into a single operating procedure so any designer — on any screen, at any time — produces work that is consistent, safe, and on-system.

**How it connects:**
- The [UX Audit Framework](./01-ux-audit-framework.md) tells us *what's wrong* and *how we score it*.
- The [Design System](./03-design-system.md) supplies *components, tokens, status language*.
- The [IA & Navigation System](./04-information-architecture.md) supplies *routes, deep-links, placement*.
- **This framework** is the *bridge from audit finding → shippable redesign*.

Governing rule: *safety and legibility outrank polish.* Clinical screens carry the audit's hard-cap veto.

---

## How to use this framework

```
1. DEFINE   → complete Sections 1–7 (intent, before touching pixels)
2. VALIDATE → run Sections 8–11 (a11y, mobile, clinical safety, UX review)
3. HANDOFF  → produce Section 12 (developer requirements)
4. VERIFY   → re-score against the UX Audit rubric; must beat the baseline
```

One screen = one completed template. Sections 1–7 are written *before* design begins. Sections 8–12 gate the work *before* handoff. A screen isn't "done" until its post-redesign audit score beats baseline and no safety/financial cap is triggered.

---

# PART 1 — The 12-Section Methodology

### 1. Screen Objective
- **Why it exists:** one sentence (two = it's doing two jobs; split it).
- **Primary user outcome:** the single observable result of a successful visit.
- **Rule:** exactly one primary outcome; secondary outcomes never compete visually.

### 2. User Context
- **Arrival trigger:** how they got here (deep link? tab? mid-flow?).
- **Emotional state:** named explicitly — anxious / rushed / confused / focused. Sets tone, density, reassurance.
- **Prior knowledge:** what they carry, so we don't re-ask (pre-fill; carry context).
- **Rule:** assume the audit's default user — older, possible retinopathy/neuropathy, one-handed on mobile.

### 3. Success Criteria
- **Behavioral:** completion rate, time-to-action, error rate, drop-off, adherence.
- **Perceptual:** confidence/trust, reduced anxiety.
- **Audit:** target scores; must exceed baseline.
- **Rule:** every criterion maps to something observable or scorable.

### 4. Information Hierarchy (T1–T4)

| Tier | Holds | Treatment |
|---|---|---|
| **T1 — Status** | "What's the state / am I okay?" | Largest, highest contrast, color+icon+label, first |
| **T2 — Primary Action** | The one thing to do | Single dominant CTA |
| **T3 — Supporting Info** | Trends, history, secondary fields | Medium weight, grouped, scannable |
| **T4 — Meta** | Timestamps, IDs, links | Smallest, neutral, low contrast |

Rules: one T1 focal point; one T2 action; clinical values always T1-legibility; reading order = priority order on mobile.

### 5. Layout Framework
- **Mobile (patient default):** single column, thumb-zone action, bottom-sheet/full-screen flows, tables → stacked cards, no horizontal scroll.
- **Tablet:** bridge — single column (patient); master–detail begins (consultant).
- **Desktop (consultant/admin default):** multi-column, master–detail, dense tables, sticky headers, keyboard-first.
- **Rule:** define each breakpoint explicitly; state what reflows, stacks, or hides behind progressive disclosure.

### 6. Navigation Rules
- **Entry points:** every route in (tab, deep link, queue, search).
- **Exit points:** where the user goes on completion/cancel.
- **Deep links:** canonical URL(s) + restored context (incl. patient context for clinical screens).
- **Back behavior:** returns to source, never generic root; multi-step flows show progress + safe back (no data loss).
- **Rule:** tabs = facets of one entity; pages = different entities.

### 7. Component Selection Rules
- **Use:** the exact system components (Status Badge, Clinical Summary Card, Clinical Numeric Entry, Glucose Chart + range band, etc.).
- **Avoid:** anti-patterns (color-only status, placeholder-as-label, shadows, raw tables on patient mobile, modals for primary flows).
- **Rule:** semantic tokens only; status colors from the status system; no one-off components without adding them to the inventory first.

### 8. Accessibility Checklist (WCAG 2.2 AA floor)
- [ ] Contrast ≥4.5:1 text / ≥3:1 large & UI/graphics
- [ ] No color-only signaling
- [ ] Full keyboard operability + visible focus
- [ ] Screen-reader labels; `aria-live` for alerts/errors; chart text alternatives
- [ ] Touch targets ≥44px, ≥8px apart
- [ ] Text scales to 200%; reflows at 320px
- [ ] `prefers-reduced-motion` respected
- [ ] Plain-language clinical content (~grade 8)

### 9. Mobile Optimization Checklist
- [ ] Primary action in thumb zone
- [ ] Core task in ≤2 taps from entry (clinical/daily)
- [ ] Correct input types/keyboards; autofill
- [ ] No horizontal scroll; tables → stacked cards
- [ ] Clinical values never truncated
- [ ] Body text ≥16px
- [ ] Save/resume on interruption; offline-tolerant where relevant
- [ ] Performs on mid-tier devices

### 10. Clinical Safety Checklist (hard-cap gate)
- [ ] Clinical values: tabular figures, high contrast, unit always adjacent, never truncated
- [ ] Abnormal/critical values surfaced + paired with reference range
- [ ] Locked clinical status system (Critical = solid, never soft)
- [ ] Look-alike drug names disambiguated (strength/form)
- [ ] Range guards on numeric entry (warn implausible / block impossible)
- [ ] Destructive/irreversible clinical actions confirmed + reversible where possible
- [ ] Clinical data shown with context (patient/range), never in isolation
- [ ] **Any unresolved ambiguity = P0; screen cannot ship**

### 11. UX Review Checklist
- [ ] One clear T1 focal point; one T2 primary action
- [ ] All states designed: loading / empty / error / success
- [ ] Reading order = priority order
- [ ] Deep-link context restored; back behaves
- [ ] Consistent with system tokens/components
- [ ] Emotional tone matches user context
- [ ] Post-redesign audit score beats baseline on all 8 dimensions
- [ ] No safety/financial cap triggered

### 12. Developer Handoff Requirements
- Annotated layouts per breakpoint with spacing tokens marked.
- Component manifest: every system component + variant + state.
- Route + deep-link spec: canonical URL(s), params, restored context, back target.
- All states specified (loading/empty/error/success + critical/abnormal clinical states).
- Content spec: exact labels, units, microcopy, error messages, empty-state guidance.
- Interaction spec: validation timing, range-guard thresholds, confirmation dialogs.
- Accessibility notes: focus order, ARIA roles/live regions, alt text/data-table fallbacks.
- Acceptance criteria: Success Criteria restated as testable conditions.
- Analytics events to instrument success metrics.

---

# PART 2 — Reusable Screen Redesign Template

```
SCREEN REDESIGN — <Screen Name>   ·   Role: <Patient/Consultant/Admin>
Baseline audit score: <composite + per-dimension>   ·   Priority tier: <P0–P3>

1. SCREEN OBJECTIVE
   • Why it exists: ____
   • Primary user outcome (one): ____
   • Secondary outcomes: ____

2. USER CONTEXT
   • Arrival trigger(s): ____
   • Emotional state: ____
   • Prior knowledge / carried context: ____

3. SUCCESS CRITERIA
   • Behavioral: ____   • Perceptual: ____   • Target audit scores: ____

4. INFORMATION HIERARCHY
   • T1 Status: ____    • T2 Primary Action: ____
   • T3 Supporting: ____ • T4 Meta: ____

5. LAYOUT FRAMEWORK
   • Mobile: ____   • Tablet: ____   • Desktop: ____
   • Reflow / progressive disclosure notes: ____

6. NAVIGATION RULES
   • Entry points: ____   • Exit points: ____
   • Deep links (URL + restored context): ____   • Back behavior: ____

7. COMPONENT SELECTION
   • Use: ____   • Avoid: ____

8. ACCESSIBILITY CHECKLIST        □ (all items)
9. MOBILE OPTIMIZATION CHECKLIST  □ (all items)
10. CLINICAL SAFETY CHECKLIST     □ (all items — P0 gate)
11. UX REVIEW CHECKLIST           □ (all items)
12. DEVELOPER HANDOFF             □ (all artifacts attached)

VERIFY: post-redesign audit score vs baseline: ____  ·  caps triggered? Y/N
```

---

# PART 3 — Pre-Seeded Application (priority screens)

Quick-start stubs so each redesign begins grounded. The team completes the full template from here.

### Monitoring *(Patient · daily driver · safety-critical on units/time)*
- **Objective:** log a reading in seconds and reveal "am I okay?" at a glance.
- **T1:** current reading + range status. **T2:** Quick-log.
- **Context:** rushed, post-meal, one-handed. **Success:** log ≤2 taps; unit unambiguous; time-in-range obvious.
- **Use:** Clinical Numeric Entry (unit-locked + range guard), Glucose Chart + range band, Time-in-Range bar, Status Badge. **Avoid:** color-only ranges, charts without text alt.

### Prescriptions *(Patient · highest-stakes · ambiguity = P0)*
- **Objective:** read and act on an Rx with zero ambiguity.
- **T1:** drug + dose + frequency + duration. **T2:** Refill / send to pharmacy.
- **Context:** may be anxious/forgetful. **Success:** 0 dose misreads; status always clear.
- **Use:** Prescription Item (dose-legible, tabular), Status Badge, Confirmation Dialog. **Avoid:** truncated dose, look-alike names undisambiguated, color-only warnings.

### Labs *(Patient · safety-critical)*
- **Objective:** understand what results mean and what to do next.
- **T1:** abnormal/critical results first, value paired with range. **T2:** view detail / next step.
- **Context:** anxious. **Success:** abnormal salience; plain-language meaning present.
- **Use:** Lab Result Row (abnormal-flagged), Lab Chart + range band, Reference-Range display. **Avoid:** raw value dumps, color-only flags, horizontal-scroll tables on mobile.

### Dashboard *(Patient · session entry · routes everything)*
- **Objective:** answer "am I okay + what do I need to do?" and route out.
- **T1:** glucose status + time-in-range. **T2:** highest-priority pending action.
- **Context:** quick check-in. **Success:** ≤2 taps to any top task; every widget deep-links.
- **Use:** Clinical Summary Card, Action Card (3–4 pending tasks), Metric Card, Alert Card. **Avoid:** read-only widget soup, equal-weight everything.

### Booking *(Patient · core care + revenue · timezone trust-critical)*
- **Objective:** confirm the right slot with the right provider, correctly.
- **T1:** selected slot + timezone + total price (at confirm). **T2:** Confirm booking.
- **Context:** deciding, comparing. **Success:** 0 timezone errors; no surprise fees; safe back.
- **Use:** Stepper/Progress, Time/Timezone Picker, Payment summary, Confirmation. **Avoid:** ambiguous timezone, lost selection on back, hidden cancellation policy.

### PCQ *(Patient · feeds clinical decisions · safety-critical)*
- **Objective:** capture accurate clinical answers without fatigue.
- **T1:** current question + progress. **T2:** answer & advance.
- **Context:** possibly impatient → risk of satisficing. **Success:** completion rate up; save/resume; reversible answers.
- **Use:** PCQ question shell (one-at-a-time + progress + save), large-target inputs. **Avoid:** long monotonous pages, ambiguous wording, color-only scales.

### Consultations *(Patient + Consultant · the care moment · trust-critical)*
- **Objective:** join and hold a stable clinical conversation effortlessly.
- **T1:** connection/permission status (pre-call) → who you're with (in-call). **T2:** Join / mic-cam-end.
- **Context:** anxious about tech failing. **Success:** pre-call check passes; reconnect fallback; clear post-call next steps.
- **Use:** Consultation pre-call check, large reachable controls, captions. **Avoid:** hidden controls, no failure fallback, no post-call routing.

---

## The redesign workflow, end to end

```
Pick screen (per audit redesign order)
   → DEFINE (Sec 1–7) against design system + IA
   → DESIGN to intent
   → VALIDATE (Sec 8–11) — gates, incl. P0 clinical-safety
   → HANDOFF (Sec 12)
   → VERIFY — re-score on UX Audit rubric; must beat baseline, no caps
   → ship → instrument success metrics
```

Audit finds it, framework redesigns it, audit re-scores it. Consistency is guaranteed because every screen passes through the same gates and pulls from the same system and map.

**Next screen (per redesign order):** Patient Prescriptions (P0).
