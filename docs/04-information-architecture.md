# GlycoLink Information Architecture & Navigation System v1.0

The structural layer beneath the [design system](./03-design-system.md). Its job is to make the right action reachable in the fewest, most predictable steps for three very different users. It encodes one rule above all: **navigation depth should match how often a task is done.** Daily tasks live one tap from launch; rare tasks are allowed to be deeper.

---

## Shared navigation model

| User | Primary pattern | Rationale |
|---|---|---|
| **Patient** | Mobile-first **bottom tab bar (5 max)** + top app bar (logo, title, 🔔, avatar) | One-handed, daily, low cognitive load |
| **Consultant** | Desktop-first **collapsible left sidebar (grouped)** + master–detail | Dense, scan-many, keyboard-driven |
| **Admin** | Desktop-first **left sidebar (grouped)** + data tables | Configuration & oversight, infrequent but powerful |

**Universal route grammar** (Next.js App Router-friendly):

```
/[role]/[section]/[entityId]/[tab]?context=...
e.g. /patient/appointments/appt_123/details
     /consultant/patients/pat_456/labs
     /admin/providers/prov_789/verification
```

**Three laws of this IA:**
1. **Tabs = facets of one entity. Pages = different entities.**
2. **Every notification/alert/reminder deep-links to the screen that resolves it** — with context (filters, scroll, parent) preserved.
3. **One "home base" per role** that answers "what needs me now?" and routes outward — never a dead-end of widgets.

---

# PART A — Patient Navigation Architecture

*Mobile-first. Mental model: **daily** (log + status), **periodic** (appointments, care), **records** (Rx, labs), **account**.*

### 1. Top-level navigation structure
Bottom tab bar, **5 destinations**:

| Tab | Contains | Why top-level |
|---|---|---|
| **🏠 Home** | Dashboard | Session entry, "am I okay?", task routing |
| **📈 Monitoring** | Glucose log + trends | #1 daily action |
| **📅 Appointments** | Upcoming/past + Book entry | Core care + revenue path |
| **🗂 Health Records** | Prescriptions + Labs (tabs) | Grouped reference data |
| **⋯ More** | Profile, Settings, Providers, Payments, Help | Infrequent / account |

**Notifications** = 🔔 bell in top app bar, not a bottom tab. **Providers** = not a bottom tab — discovery is a means to booking.

### 2. Navigation groups
Daily health (Home, Monitoring) · Care (Appointments → Providers → Booking → Payment → Consultation) · Records (Prescriptions, Labs) · Account (More) · Cross-cutting inbox (Notifications).

### 3. Sidebar structure
No sidebar (mobile-first). On tablet/desktop web, the bottom bar promotes to a slim left rail with the same 5 items + Notifications.

### 4. Mobile navigation structure
```
┌─────────────────────────────────────┐
│ Top app bar: ☰/logo · Title · 🔔 · 👤 │
├─────────────────────────────────────┤
│              Screen content          │
├─────────────────────────────────────┤
│ 🏠 Home  📈 Monitor  📅 Appts  🗂 Records  ⋯ More │
└─────────────────────────────────────┘
```
Booking, Payment, Consultation pre-call, and PCQ open as full-screen flows / bottom sheets layered above the tab bar (hide it — focused, escapable, with progress).

### 5. Which pages are tabs
- **Monitoring** → `Overview · Log · Trends · History`
- **Appointments** → `Upcoming · Past` (Book = CTA, not a tab)
- **Appointment Details** → `Details · PCQ · Notes & Rx`
- **Health Records** → `Prescriptions · Labs`
- **Provider Profile** → `Overview · Availability · Reviews`

### 6. Which pages are separate pages
Dashboard, Provider Discovery, Provider Profile, Booking Flow, Payment, Consultation Area, Notifications, Profile, Settings — distinct. Each prescription, lab result, appointment, and reading detail = its own deep-linkable page.

### 7. Deep-linking strategy
| Trigger | Deep link | Lands on |
|---|---|---|
| Notification → appointment reminder | `/patient/appointments/{id}/details` | Appointment Details, Join enabled if live |
| Abnormal glucose reading | `/patient/monitoring/{readingId}?view=detail` | Monitoring → that reading in trend context |
| Prescription reminder | `/patient/records/prescriptions/{id}` | Rx detail, refill visible |
| Lab result ready | `/patient/records/labs/{id}` | Lab result, abnormal flags surfaced |
| Payment due | `/patient/payments/{invoiceId}` | Payment with amount + purpose |
| PCQ required | `/patient/appointments/{id}/pcq` | PCQ resume point |

Links restore filters/scroll/parent, support back-to-source, never dump on a generic list when a specific item was referenced.

### 8. Dashboard-to-task (shortest path)
- Log glucose: Home → "Log reading" card → save = **2 taps**
- Join consultation: Home → "Join" card = **1 tap** (when live)
- Pay bill: Home → "Pay" card → confirm = **2 taps**
- Refill Rx: Home → "Refill due" card → Request = **2 taps**

> Mandate: Dashboard surfaces 3–4 highest-priority pending actions as direct-action cards, each ≤2 taps to done.

### 9. IA mistakes to avoid
Providers in the bottom bar (it's a sub-step of booking) · Notifications as a bottom tab instead of a bell · splitting Prescriptions/Labs when they're one bucket · read-only widget dashboards that don't deep-link · burying glucose logging >2 taps · ambiguous Profile/Settings split (clinical/personal → Profile; app controls → Settings).

### 10. Final navigation map
```
PATIENT
├── 🏠 Home (Dashboard) → action cards deep-link out
├── 📈 Monitoring {Overview · Log · Trends · History}
├── 📅 Appointments {Upcoming · Past}
│     └─ [Book] → Provider Discovery → Provider Profile
│                  → Booking Flow → Payment → Confirmation
│     └─ Appointment Details {Details · PCQ · Notes & Rx}
│            └─ Consultation Area (pre-call → call → post)
├── 🗂 Health Records {Prescriptions → Rx Detail · Labs → Lab Detail}
├── 🔔 Notifications (top bar inbox)
└── ⋯ More {Profile · Payments · Find a provider · Settings · Help}
```

---

# PART B — Consultant Navigation Architecture

*Desktop-first. Mental model: **triage queues** ↔ **patient record**. The Patient is the hub; clinical functions are both cross-patient queues and tabs within a patient.*

### 1. Top-level structure
Grouped left sidebar + master–detail content + top utility bar (search, 🔔 alerts, profile).

### 2. Navigation groups
| Group | Items | Purpose |
|---|---|---|
| **Today** | Dashboard, Alerts, Messages | "What needs me now" |
| **Clinical** | Appointments, Consultations, Patients | The care work |
| **Queues** | Prescriptions, Labs | Cross-patient review/sign triage |
| **Schedule** | Availability | Manage bookable time |
| **Account** | Settings | Profile, preferences |

### 3. Sidebar structure
```
GLYCOLINK · Consultant
─ TODAY
   ▣ Dashboard
   ⚠ Alerts            (badge: critical count)
   ✉ Messages          (badge: unread)
─ CLINICAL
   📅 Appointments
   🎥 Consultations
   👥 Patients          ← hub (master list → detail)
─ QUEUES
   ℞ Prescriptions      (to sign / renew — badge)
   🧪 Labs              (results to review — badge)
─ SCHEDULE
   🗓 Availability
─ ACCOUNT
   ⚙ Settings
```
Collapsible to icon-rail; badges show actionable counts; global patient search pinned top.

### 4. Mobile navigation structure
Responsive companion (on-call): bottom bar `Dashboard · Alerts · Patients · Messages` + More (Appointments, Consultations, Availability, Settings). Queues under More on mobile.

### 5. Which pages are tabs
- **Patient Detail** → `Overview · Monitoring · Appointments · Consultations · Prescriptions · Labs · Notes`
- **Appointments** → `Today · Upcoming · Past`
- **Consultations** → `Active/Now · Awaiting notes · History`
- **Availability** → `Weekly schedule · Exceptions · Booking rules`

### 6. Which pages are separate pages
Dashboard, Alerts, Messages, Patients (list), Prescriptions (queue), Labs (queue), Availability, Settings. Consultation workspace = focused full-screen route.

### 7. Deep-linking strategy
| Trigger | Deep link | Lands on |
|---|---|---|
| Alert: critical glucose | `/consultant/patients/{patId}/monitoring?reading={id}` | Patient monitoring, reading flagged |
| Lab needs review | `/consultant/patients/{patId}/labs/{labId}` | Lab in patient context |
| Rx awaiting signature | `/consultant/patients/{patId}/prescriptions/{rxId}?action=sign` | Rx ready to sign |
| Appointment starting | `/consultant/consultations/{apptId}` | Consultation workspace |
| New message | `/consultant/messages/{threadId}` | Thread, with patient link |

Rule: a queue item **always carries its patient** — clicking a lab from the cross-patient queue opens it *inside* that patient's record (safety).

### 8. Dashboard-to-task (shortest path)
- Start next consultation: Dashboard → "Join" = **1 click**
- Review critical alert: Dashboard → Alerts → alert = **2 clicks** into patient monitoring
- Sign Rx: Dashboard → "Rx to sign (N)" → item → Sign = **2–3 clicks**
- Open patient: Global search → name → Enter = **~1 action**

> Mandate: consultant Dashboard is a work queue, not a report — every widget is a count + direct entry.

### 9. IA mistakes to avoid
Function-only IA (Labs/Rx without patient context) · merging Appointments (schedule) with Consultations (encounter workspace) · hiding actionable counts/badges · forcing navigation where master–detail would keep the list · omitting global patient search · burying Availability.

### 10. Final navigation map
```
CONSULTANT
├── Dashboard (work queue)
├── Alerts → Alert → Patient Detail (in context)
├── Messages → Thread
├── Appointments {Today · Upcoming · Past} → Appointment → Consultation
├── Consultations {Active · Awaiting notes · History} → Workspace
├── Patients (list + search)  ← HUB
│     └── Patient Detail {Overview · Monitoring · Appointments
│           · Consultations · Prescriptions · Labs · Notes}
├── Prescriptions (queue) → Patient ▸ Prescriptions
├── Labs (queue) → Patient ▸ Labs
├── Availability {Schedule · Exceptions · Rules}
└── Settings
```

---

# PART C — Admin Navigation Architecture

*Desktop-first oversight & configuration. Mental model: **who's on the platform**, **how it's configured**, **money**, **trust/compliance**.*

### 1. Top-level structure
Grouped left sidebar + data-table content + top bar (global search, environment indicator, profile).

### 2. Navigation groups
| Group | Items | Purpose |
|---|---|---|
| **Overview** | Dashboard | Platform health |
| **People & Orgs** | Providers, Organizations | Who operates on the platform |
| **Catalog & Config** | Specialties, PCQ Templates | What the platform offers/asks |
| **Finance** | Payments | Money flows |
| **Trust & Compliance** | Audit, Security | Accountability & safety |
| **System** | Settings | Platform configuration |

### 3. Sidebar structure
```
GLYCOLINK · Admin
─ OVERVIEW
   ▣ Dashboard
─ PEOPLE & ORGS
   🩺 Providers          (verification queue badge)
   🏢 Organizations
─ CATALOG & CONFIG
   🏷 Specialties
   📋 PCQ Templates
─ FINANCE
   💳 Payments
─ TRUST & COMPLIANCE
   📜 Audit
   🛡 Security
─ SYSTEM
   ⚙ Settings
```

### 4. Mobile navigation structure
Desktop-only by design. Optional responsive read-only view exposes Dashboard + approvals; full actions stay on desktop.

### 5. Which pages are tabs
- **Provider Detail** → `Profile · Verification · Specialties · Activity · Payments`
- **Organization Detail** → `Overview · Providers · Billing · Settings`
- **Payments** → `Transactions · Payouts · Refunds · Disputes`
- **PCQ Templates** → `Templates · Questions library · Versions`
- **Security** → `Roles & permissions · Sessions · Auth policy`

### 6. Which pages are separate pages
Dashboard, Providers, Organizations, Specialties, PCQ Templates, Payments, Audit, Security, Settings. PCQ Template Builder + Audit log entry = dedicated routes.

### 7. Deep-linking strategy
| Trigger | Deep link | Lands on |
|---|---|---|
| Provider verification pending | `/admin/providers/{id}/verification` | Verification tab |
| Payment dispute opened | `/admin/payments/disputes/{id}` | Dispute detail |
| Security event flagged | `/admin/security/sessions?event={id}` | Security event in context |
| Audit reference | `/admin/audit?entity={type}:{id}` | Filtered audit trail |
| Org onboarding step | `/admin/organizations/{id}/settings` | Org config |

Rule: every entity links to **its audit trail** and back; compliance traceability is first-class.

### 8. Dashboard-to-task (shortest path)
- Approve provider: Dashboard → "Pending verifications (N)" → provider → Approve = **2–3 clicks**
- Resolve dispute: Dashboard → "Disputes (N)" → dispute → action = **2 clicks**
- Investigate security flag: Dashboard → Security → event = **2 clicks**

> Mandate: admin Dashboard = operational console of pending approvals, anomalies, KPIs — each a direct link.

### 9. IA mistakes to avoid
Mixing configuration (Specialties, PCQ, Settings) with operations (Payments, Audit) · burying Audit/Security as settings · no entity → audit linking · over-nesting org→provider→specialty (keep cross-nav lateral) · building unneeded mobile admin nav.

### 10. Final navigation map
```
ADMIN
├── Dashboard (ops console)
├── Providers → {Profile · Verification · Specialties · Activity · Payments}
├── Organizations → {Overview · Providers · Billing · Settings}
├── Specialties (catalog)
├── PCQ Templates {Templates · Question library · Versions} → Builder
├── Payments {Transactions · Payouts · Refunds · Disputes}
├── Audit (filterable by entity; linked from every record)
├── Security {Roles & permissions · Sessions · Auth policy}
└── Settings
```

---

## Cross-role deep-linking principles
1. **Notifications are routers, never destinations** — resolve to exact screen + entity + action, source context preserved.
2. **Context travels with the link** — filters, scroll, parent, and (clinicians) the patient restored, never reconstructed.
3. **One canonical URL per entity** — deep-linkable from notification, search, dashboard, queue.
4. **Clinical links always carry clinical context** — a lab/reading opens with its range/patient, never in isolation (safety rule).
5. **Back goes where the user came from**, not a generic root.
