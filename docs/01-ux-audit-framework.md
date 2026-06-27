# GlycoLink UX Audit Framework v1.0

A reusable instrument for evaluating every screen in the platform with consistent rigor. It has three layers:

- **Layer 1 — Per-Screen Definition Template** (the 10 qualitative dimensions)
- **Layer 2 — Scoring Rubric** (8 scores, 1–10, with defined anchors so two auditors land within ±1)
- **Layer 3 — GlycoLink Application Guide** (how the template applies to each functional area)

A core principle runs through all three: **GlycoLink is a clinical product, not a consumer app.** A confusing checkout loses a sale; a confusing glucose log or prescription screen can cause harm. The framework weights *safety, accuracy, and trust* above delight.

---

## How to use this framework

For each screen:
1. Fill in the **Layer 1 template** (qualitative definition — what the screen is *supposed* to do).
2. Walk the screen against the **Layer 2 rubric** and assign all 8 scores with evidence.
3. Compute the **weighted composite** and assign a **priority tier**.
4. Log findings as discrete, actionable issues (not vague impressions).

One screen = one audit record. The Layer 1 definition is written *before* scoring so you're measuring against intended purpose, not your in-the-moment reaction.

---

# LAYER 1 — Per-Screen Definition Template

Complete this for every screen before scoring.

1. **Purpose** — One sentence: why this screen exists. If you can't state it in one sentence, that's finding #1.
2. **Primary user goal** — The single thing the user came here to accomplish. Exactly one.
3. **Secondary user goals** — Legitimate but non-primary intents the screen must serve without crowding the primary goal.
4. **Critical actions** — Actions that, if they fail or mislead, cause real harm. Flag each as **Safety-critical**, **Financial-critical**, or **Trust-critical**.
5. **Information hierarchy requirements** — What must be seen *first, second, third*.
6. **UX risks** — Predicted failure modes: error states, ambiguity, dead ends, irreversible actions, data-entry traps, cognitive overload.
7. **Accessibility considerations** — Screen-specific a11y demands. Assume reduced vision (diabetic retinopathy) and reduced fine-motor precision (neuropathy) as the *default user*, not an edge case.
8. **Mobile considerations** — What changes on a phone: reachability, input method, truncation, where the screen is used in real life.
9. **Navigation considerations** — Entry points, exit points, back behavior, wayfinding, progress in multi-step flows.
10. **Recommended audit criteria** — The concrete checklist derived from items 1–9.

---

# LAYER 2 — Scoring Rubric (1–10)

Eight independent scores. Each uses the same calibrated band, with dimension-specific anchors below.

**Universal bands**
- **9–10 Exemplary** — best-practice; nothing to fix.
- **7–8 Solid** — works well; minor polish only.
- **5–6 Adequate** — functional but friction is real; users succeed with effort.
- **3–4 Poor** — users struggle, err, or abandon; needs rework.
- **1–2 Failing** — blocks the goal or risks harm; fix before anything else.

> **Hard rule:** any **Safety-critical** or **Financial-critical** defect caps **Overall Experience at 4**, regardless of how polished the rest is.

### The 8 dimensions

1. **Clarity** — Does the user instantly understand what this is and what to do?
2. **Usability** — Can the user complete the task efficiently and without error?
3. **Visual Hierarchy** — Does the eye land on the right thing in the right order?
4. **Accessibility** — Can people with vision, motor, hearing, cognitive, or situational limits use it? (WCAG 2.2 AA, ≥4.5:1 contrast, keyboard + screen-reader path, ≥44px targets, not color-only.)
5. **Mobile Friendliness** — Is it genuinely good on a phone, not just shrunk?
6. **Workflow Efficiency** — Minimum steps, minimum cognitive load, smart defaults?
7. **Information Architecture** — Is it in the right place, grouped sensibly, findable, labeled right?
8. **Overall Experience** — Holistic: trust, polish, confidence, emotional fit for a health context.

**Anchor example (Clarity):**
- 9–10: Purpose obvious in <3s; patient language; every element's role self-evident.
- 5–6: Understandable after a pause; some jargon or ambiguous labels.
- 1–2: User can't tell what the screen wants or what an action will do.

### Composite scoring (weighted)

| Dimension | Weight |
|---|---|
| Usability | 20% |
| Workflow Efficiency | 15% |
| Clarity | 15% |
| Information Architecture | 12% |
| Visual Hierarchy | 12% |
| Accessibility | 12% |
| Mobile Friendliness | 10% |
| Overall Experience | 4% |

> Overall Experience is weighted low *as a number* because it's largely emergent from the other seven — but it carries the **hard-cap veto** above.

**Priority tiers**
- **P0 — Critical (composite <5, or any safety/financial cap triggered):** fix now.
- **P1 — High (5–6.4):** schedule this cycle.
- **P2 — Medium (6.5–7.9):** polish backlog.
- **P3 — Low (≥8):** monitor.

---

# LAYER 3 — GlycoLink Application Guide

Pre-filled Layer 1 emphases per functional area.

### Cross-platform criteria (every screen)
- Loading / empty / error / success states all designed.
- Save & resume on clinical and onboarding flows.
- Reversibility for destructive/clinical actions.
- Trust signals where identity/security/provider matters.
- Units & locale explicit (glucose mg/dL ↔ mmol/L, date/time, currency).
- You-are-here: progress + escape route in multi-step flows.

### Per-area focus

- **Authentication** — fast return; anxiety-free registration. Error specificity without leaking info; recovery always reachable.
- **Patient Onboarding** — clinically useful profile, minimum perceived effort. Medical history/meds/targets are safety-critical. Chunk, save partial, resume.
- **Provider Onboarding** — verified, credible profile. Credentials trust-critical. Clear verification state, reliable uploads.
- **Provider Discovery** — find + decide with confidence. Availability visible on card; strong filters; helpful empty state.
- **Appointment Booking** — right slot, correctly; **timezone trust-critical**. Confirmation summary complete; no surprise fees.
- **Payments** — pay quickly + securely; **financial-critical**. Amount transparency, receipt, graceful failure/retry.
- **PCQ Questionnaires** — accurate clinical answers without fatigue; safety-critical. One question at a time, progress, save/resume.
- **Video Consultations** — join + hold a stable clinical conversation. Pre-call check, reachable controls, reconnect fallback, post-call next steps.
- **Prescriptions** — read + act with zero ambiguity; **highest-stakes screen**. Dose legibility, status clarity, no truncation. Any ambiguity = P0.
- **Lab Workflows** — understand orders/results; safety-critical. Abnormal-value salience, range context, plain-language meaning.
- **Monitoring & Glucose Tracking** — log in seconds, understand trends; #1 daily surface. Speed-to-log, unit safety, time-in-range clarity.

---

## Deliverables this framework produces
1. **Per-screen audit record** (Layer 1 + 8 scores + evidence).
2. **Issue log** — discrete, prioritized, actionable findings.
3. **Platform heatmap** — screens × 8 dimensions, to spot systemic weaknesses.
4. **Prioritized remediation backlog** (P0–P3) feeding the redesign phase.
