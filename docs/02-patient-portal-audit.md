# GlycoLink Patient Portal — UX Audit

Conducted against the [UX Audit Framework v1.0](./01-ux-audit-framework.md). This is a **heuristic audit** grounded in the framework's per-screen definitions and healthcare UX expertise — it evaluates what each screen *must* get right and where it's most likely to fail. It does **not** redesign anything. Scores/priority are likely-impact estimates; any screen can be re-scored against the live build.

Governing principle: **safety, accuracy, and trust outrank polish.** Clinical screens (Prescriptions, Monitoring, Labs) carry the framework's hard-cap veto — any ambiguity there is automatically P0.

Each screen below is evaluated on 8 facets:
1. What the screen should accomplish
2. Common UX mistakes in healthcare products
3. What users expect to see
4. What information to prioritize
5. What actions to prioritize
6. Potential navigation issues
7. Mobile usability concerns
8. Audit checklist

---

## 1. Dashboard
1. **Accomplish:** Answer "Am I okay, and what do I need to do?" in <5s, then route the patient.
2. **Mistakes:** Vanity metrics over actionable; raw data without interpretation; equal weight to everything; no clear next action; widget soup.
3. **Expect:** Glucose status, next appointment, pending tasks, active prescriptions, recent trend, alerts.
4. **Prioritize info:** Glucose status + time-in-range → next appointment → tasks/alerts → trend → shortcuts.
5. **Prioritize actions:** Log glucose; join/view consultation; resolve pending tasks.
6. **Navigation:** Becomes a dead-end of non-linking widgets; unclear what's tappable; duplicate paths vs nav bar.
7. **Mobile:** Too many cards = endless scroll; status pushed below fold; not reachable one-handed.
8. **Checklist:** glucose status visible w/o scroll + range context · single clearest next action · pending tasks surfaced · every widget deep-links · range uses icon+text not color · first-run empty state.

## 2. My Profile
1. **Accomplish:** View/maintain accurate personal + clinical profile data feeding the platform.
2. **Mistakes:** Confusing display/edit modes; clinical data buried among contact fields; no sense that edits affect care.
3. **Expect:** Personal details, medical history, meds, allergies, glucose targets, insurance, emergency contact.
4. **Prioritize info:** Clinical data above administrative.
5. **Prioritize actions:** Edit medical info; update targets; manage insurance.
6. **Navigation:** Overlap/confusion with Settings; long scroll, no anchors.
7. **Mobile:** Long forms; unclear save state; accidental edits.
8. **Checklist:** clinical vs admin separated · allergies/conditions safety-flagged · view vs edit clear + explicit save · no data loss on interruption · clean Settings boundary.

## 3. Provider Discovery
1. **Accomplish:** Find the right provider quickly and decide with confidence.
2. **Mistakes:** Weak filters; availability hidden until click; no cost transparency; decision paralysis; empty results no fallback.
3. **Expect:** Scannable cards — name, specialty, next availability, price, rating, language; filters/sort.
4. **Prioritize info:** Specialty match, availability, cost, trust signal at a glance.
5. **Prioritize actions:** Filter/sort; open profile; book directly.
6. **Navigation:** Losing filter state on back; unclear search → profile → booking path.
7. **Mobile:** Filters hard one-handed; dense cards; horizontal overflow.
8. **Checklist:** availability on card · filter by specialty/availability/cost/language · filter state persists on back · helpful empty state · trust markers not color-only.

## 4. Provider Profile
1. **Accomplish:** Give enough credibility + practical info to commit to booking.
2. **Mistakes:** Marketing bio over decision facts; verification unclear; availability/price buried; weak CTA.
3. **Expect:** Credentials/verification, specialties, experience, languages, fees, availability, reviews, location/telehealth.
4. **Prioritize info:** Verification + credentials → availability → fee → bio/reviews.
5. **Prioritize actions:** Book (dominant, persistent CTA); check availability.
6. **Navigation:** No persistent Book on long scroll; unclear return to results.
7. **Mobile:** Long scroll buries CTA; missing sticky book button; reviews dominate.
8. **Checklist:** verification explicit · sticky Book CTA · availability + price above fold · back returns to discovery with filters intact.

## 5. Booking Flow
1. **Accomplish:** Confirm the right slot with the right provider, correctly — especially timezone.
2. **Mistakes:** Timezone ambiguity; losing selection on back; surprise fees; no progress; hidden cancellation policy.
3. **Expect:** Provider, date/time (their tz), duration, price, type, confirmation summary.
4. **Prioritize info:** Selected slot + timezone + total at confirmation.
5. **Prioritize actions:** Select slot → confirm; reschedule/cancel discoverable after.
6. **Navigation:** Multi-step without progress; back loses choices; unclear exit.
7. **Mobile:** Awkward pickers; small slot targets; confirm-button stretch.
8. **Checklist:** timezone explicit everywhere · progress + safe back · confirmation summary complete · cancellation policy before confirm · save/resume.

## 6. Appointment Details
1. **Accomplish:** Single source of truth for a visit + what to do next.
2. **Mistakes:** No clear join entry; missing prep; reschedule/cancel buried; past vs upcoming conflated.
3. **Expect:** Date/time (tz), provider, type, status, join button, prep steps, link, cancellation policy, post-visit summary.
4. **Prioritize info:** Status + time + join for upcoming; summary + Rx/notes for past.
5. **Prioritize actions:** Join; reschedule/cancel; add to calendar; complete PCQ.
6. **Navigation:** Disconnected from Consultation Area + PCQ; unclear return to list.
7. **Mobile:** Join button unmistakable + reachable; timezone clarity.
8. **Checklist:** time-aware Join · reschedule/cancel + policy · links to PCQ + Rx/notes · upcoming vs past differentiated.

## 7. PCQ Questionnaire *(safety-critical)*
1. **Accomplish:** Capture accurate clinical answers without fatigue.
2. **Mistakes:** Long monotonous forms → satisficing; ambiguous wording; no progress; no save; color-only scales.
3. **Expect:** One question (or tight group) at a time, plain language, progress, back + save.
4. **Prioritize info:** Current question + progress; why asked when unclear.
5. **Prioritize actions:** Answer + advance; back; save/resume.
6. **Navigation:** No exit without losing answers; unclear link from appointment; no resume entry.
7. **Mobile:** Small radio/scale targets; long scroll; keyboard covering inputs.
8. **Checklist:** plain-language items · progress + save/resume · answer reversibility · scales not color-only + ≥44px · clear completion + next step.

## 8. Payments *(financial-critical)*
1. **Accomplish:** Pay quickly and feel secure.
2. **Mistakes:** Hidden fees; unclear total; no receipt; scary errors; double-charge fear.
3. **Expect:** Clear total + purpose, payment methods, security signals, receipt.
4. **Prioritize info:** Amount + purpose, most prominent.
5. **Prioritize actions:** Enter/confirm payment; save method; view receipt.
6. **Navigation:** Unclear return after payment; no later path to receipt; disconnect from booking.
7. **Mobile:** Numeric keyboards, autofill, wallet; large confirm; no horizontal scroll.
8. **Checklist:** total + breakdown unambiguous · security signaling · receipt retrievable · graceful failure + safe retry · correct mobile inputs.

## 9. Consultation Area *(trust-critical)*
1. **Accomplish:** Join + hold a stable clinical video conversation effortlessly.
2. **Mistakes:** No pre-call check; permission confusion; hidden controls; failure no fallback; no "doctor joining" status.
3. **Expect:** Pre-call mic/cam check, clear join, in-call controls, chat, captions, reconnect, post-call next steps.
4. **Prioritize info:** Connection/permission status pre-call; who you're with; controls in-call.
5. **Prioritize actions:** Join; toggle mic/cam; end; access notes/chat.
6. **Navigation:** Hard return after drop; unclear path to summary/Rx.
7. **Mobile:** Large reachable controls; audio-only fallback; screen-wake; reconnect; captions.
8. **Checklist:** pre-call readiness check · always-reachable controls · failure + reconnect fallback · captions · clear post-call next steps.

## 10. Prescriptions *(highest-stakes — any ambiguity = P0)*
1. **Accomplish:** Read + act on a prescription with zero ambiguity.
2. **Mistakes:** Dose truncation on mobile; look-alike drug names; unit ambiguity; unclear active/expired; color-only warnings.
3. **Expect:** Drug, dose, frequency, duration, prescriber, date, status, refills, instructions, pharmacy action.
4. **Prioritize info:** Drug + dose + frequency + duration — unmistakable, uncrowded.
5. **Prioritize actions:** View detail; request refill; send to pharmacy; view instructions.
6. **Navigation:** Disconnected from consultation that generated it; active vs past conflated.
7. **Mobile:** No truncation of dose ever; high contrast; large legible type; warnings icon+text+color.
8. **Checklist:** dose/frequency fully legible never truncated · status explicit · warnings not color-only · refill/pharmacy obvious · look-alike names disambiguated · **treat ambiguity as P0**.

## 11. Labs *(safety-critical)*
1. **Accomplish:** Understand what to do (orders) + what results mean.
2. **Mistakes:** Raw values without interpretation; abnormal not highlighted (or color-only); no ranges; anxiety from naked numbers.
3. **Expect:** Value vs reference range, abnormal flags, date, ordering provider, plain-language meaning, next steps, pending orders.
4. **Prioritize info:** Abnormal/critical first; value paired with range.
5. **Prioritize actions:** View detail; understand meaning; see next steps; download/share.
6. **Navigation:** Pending vs completed conflated; disconnect from ordering appointment.
7. **Mobile:** Tables overflow; ranges hard to read; flags rely on color.
8. **Checklist:** abnormal salient (icon+text+color) · value paired with range · plain-language + next step · pending vs completed separated · tables reflow on mobile.

## 12. Monitoring *(#1 daily surface — safety-critical on units/time)*
1. **Accomplish:** Log a reading in seconds + reveal trends at a glance.
2. **Mistakes:** Unit confusion (mg/dL vs mmol/L); tedious entry; charts that hide patterns; time-in-range not obvious; no context.
3. **Expect:** Current reading + range status, quick-log, trend chart, time-in-range, history, targets.
4. **Prioritize info:** Current reading + range status → trend → history.
5. **Prioritize actions:** Quick-log (correct units + time); view trend; adjust targets.
6. **Navigation:** Quick-log buried; disconnect from Dashboard status; unclear link to targets in Profile.
7. **Mobile:** One-handed quick-log; big numeric entry; ranges not color-only; charts need text alt; usable in real life.
8. **Checklist:** speed-to-log in seconds · units explicit + consistent · range/time-in-range obvious · trends reveal patterns · charts text-accessible · answers "am I okay?" instantly.

## 13. Notifications
1. **Accomplish:** Surface what needs attention, ranked by urgency, with a clear action each.
2. **Mistakes:** Flat undifferentiated list; clinical mixed with marketing; no read/unread; no deep-link.
3. **Expect:** Grouped/prioritized alerts (clinical > appointment > admin), timestamps, read state, tap-to-resolve.
4. **Prioritize info:** Urgent clinical + appointment reminders at top.
5. **Prioritize actions:** Tap to act/resolve; mark read; manage preferences.
6. **Navigation:** Notifications that don't deep-link; no clear return.
7. **Mobile:** Long lists; small targets; undiscoverable swipe actions.
8. **Checklist:** clinical distinct from admin/marketing · every notification deep-links · read/unread + timestamps · preference management accessible.

## 14. Settings
1. **Accomplish:** Control account, privacy, notifications, units, security with confidence.
2. **Mistakes:** Overlap with Profile; unguarded destructive actions; buried privacy/consent; no glucose-unit preference.
3. **Expect:** Account/security, notification prefs, units (mg/dL ↔ mmol/L), privacy/consent, language, devices, logout/delete.
4. **Prioritize info:** Security + privacy + unit preference.
5. **Prioritize actions:** Change password/MFA; set units; manage notifications; manage data/consent.
6. **Navigation:** Boundary with Profile unclear; deep settings hard to find; no search.
7. **Mobile:** Long nested menus; toggle targets; destructive actions too easy to hit.
8. **Checklist:** clean Profile boundary · global glucose-unit preference · destructive actions confirmed/reversible · privacy/consent accessible · logical grouping, security prominent.

---

# Screen Priority Ranking

Ranked by **likely impact on patient experience and safety** (clinical safety > financial trust > daily-use friction > supporting screens).

### 🔴 Critical Priority
| Screen | Why |
|---|---|
| **Prescriptions** | Highest harm potential; dosing ambiguity intolerable (hard-cap P0). |
| **Monitoring** | #1 daily surface; unit/time errors safety-critical; friction kills adherence. |
| **Labs** | Misread/unflagged abnormal results cause harm + anxiety. |
| **Dashboard** | First thing seen every session; sets trust + routes everything. |

### 🟠 High Priority
| Screen | Why |
|---|---|
| **Booking Flow** | Timezone/price errors = missed visits + lost trust; core conversion. |
| **Payments** | Financial-critical; amount/receipt ambiguity erodes trust + revenue. |
| **Consultation Area** | The actual care moment; failure = failed visit. |
| **PCQ Questionnaire** | Feeds clinical decisions; fatigue → bad data. |

### 🟡 Medium Priority
| Screen | Why |
|---|---|
| **Provider Discovery** | Decision quality + conversion, but recoverable. |
| **Provider Profile** | Trust + booking CTA; supports discovery. |
| **Appointment Details** | Important hub, largely informational. |
| **Notifications** | Drives engagement/adherence; prioritization matters. |

### 🟢 Low Priority
| Screen | Why |
|---|---|
| **My Profile** | Important data, infrequent, low-stakes. |
| **Settings** | Infrequent; needs structure + clean Profile boundary. |

---

# Recommended Redesign Order

**Phase 1 — Clinical-safety foundation**
1. **Prescriptions** — highest stakes; sets clinical legibility/safety patterns the portal reuses.
2. **Monitoring** — daily driver; defines glucose status, units, range patterns.
3. **Labs** — reuses abnormal-value / range / plain-language patterns.

**Phase 2 — Daily entry point**
4. **Dashboard** — aggregates the finalized clinical patterns + routes correctly.

**Phase 3 — Core care + revenue path (flow order)**
5. Provider Discovery → 6. Provider Profile → 7. Booking Flow → 8. Payments → 9. Appointment Details → 10. PCQ → 11. Consultation Area

**Phase 4 — Supporting & system polish**
12. Notifications → 13. My Profile → 14. Settings

**Rationale:** fix what can *harm* first, standardize its patterns, anchor the dashboard, repair the end-to-end care-and-payment journey as one flow, finish with supporting screens that merely link into everything else.
