# GlycoLink Frontend Implementation Rules

These rules govern frontend implementation for GlycoLink forms, pages, and workflows. They are practical guardrails for building screens that are usable by clinic staff and patients while still submitting the exact values the backend expects.

## 1. Never Ask A User To Type A UUID

A visible form field must not ask a human user to type or paste an internal UUID.

If a mutation or form submit needs a UUID, the UI must provide a human-readable picker backed by data from the API.

Use this pattern:

- Query the relevant entities from GraphQL.
- Render a searchable selector, combobox, autocomplete, or modal picker.
- Display human-readable labels such as patient name, email, clinician name, organization, code, or status.
- Store the selected entity ID in component state.
- Submit the selected UUID as the backend value.

Examples:

- Patient ID: search patients by name, email, phone, or patient number.
- Provider ID: search clinicians by display name, specialty, and organization.
- Organization ID: select by organization name and tenant context.
- Programme ID: select by care plan/programme name, code, and status.
- User ID: select a staff member by name, role, email, or clinic membership.

Exceptions are limited to internal developer tools, diagnostics, or admin-only debug screens explicitly marked as such.

## 2. Backend Choices Must Be Human Dropdowns

When a backend model uses a fixed set of choices, the frontend must not expose raw enum values as free text.

Use this pattern:

- Define frontend option constants from the backend model choices.
- Show a human label in the UI.
- Submit the backend value unchanged.
- Reuse the same option constants anywhere that choice appears.
- Display returned backend values with the same label mapping.

Example:

```ts
[
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "care_coordinator", label: "Care coordinator" },
]
```

The user sees `Care coordinator`; the mutation sends `care_coordinator`.

Applies to:

- Care team roles.
- Programme types.
- Monitoring cadence types.
- Appointment types and statuses when editable or filterable.
- PCQ question types.
- Billing models, payer types, and payment states when used in forms.

If the backend adds or renames choices, update the frontend constants in the same change.

## 3. Pages Need One Primary Job

Do not overload one page with a list, details, create form, edit form, and multiple operational forms at the same time.

Use page separation and progressive disclosure:

- List pages: browse, filter, search, compare, and open details.
- Details pages: review one entity, see related records, and expose contextual actions.
- Create pages: create one new entity.
- Edit pages: change one existing entity.
- Modals: short contextual actions that do not deserve a route.
- Wizards: multi-step creation flows where sequencing reduces mistakes.

A page should have one dominant action. Secondary actions are allowed, but they should be clearly subordinate and contextual.

## 4. Forms Belong In The Right Surface

Use the smallest surface that still gives the task enough context.

- Use a create page for substantial creation workflows.
- Use an edit page for large or risky edits.
- Use a modal for short contextual actions, such as enrolling a patient into the care plan currently being viewed.
- Use inline controls only for small, reversible edits where the surrounding row or section is enough context.

Avoid placing two unrelated forms on the same page. If a page needs several operational actions, expose them as named buttons that open focused modals.

## 5. Buttons Must Describe The Action

Buttons should use clear action labels and icons where helpful.

Good:

- `New plan`
- `Enrol patient`
- `Add care team`
- `Assign care team`
- `Activate enrolment`

Avoid:

- Generic `Submit` on complex forms.
- Raw backend verbs when a user-facing verb is clearer.
- Buttons that reveal hidden form complexity without naming the action.

## 6. Lists Should Lead To Details

Operational list pages should not become full workspaces.

A list item should show enough information to choose the right record:

- Name/title.
- Status badge.
- Secondary identifiers such as code, email, date, or organization.
- One or two high-signal metrics.
- A clear details action or row click target.

Deeper workflows belong on the details page for that record.

## 7. Details Pages Should Own Contextual Actions

If an action depends on a selected record, put that action on the record details page.

Examples:

- Enrol a patient from a care plan details page.
- Add care team from an enrolment readiness section.
- Activate or pause an enrolment from the selected enrolment context.
- Review related patients from the care plan details page.

This keeps users from selecting the same context repeatedly across disconnected pages.

## 8. Empty, Loading, Error, And Success States Are Required

Every list, picker, modal, and form must account for:

- Loading state.
- Empty state.
- Validation errors.
- Mutation failure.
- Successful completion.

Errors should be plain language. Success should either close the modal and refresh the parent view or clearly show what changed.

## 9. Implementation Checklist

Before shipping a frontend workflow, verify:

- No visible field asks for a UUID.
- Every backend choice used in a form is a dropdown, segmented control, checkbox group, or other suitable selection control.
- Choice labels are human-readable.
- Submitted values match the backend contract.
- Pages have one primary job.
- Long or risky workflows have their own page or wizard.
- Short contextual workflows are in modals.
- Lists link to details instead of embedding full workflows.
- Details pages show related records and contextual actions.
- Loading, empty, error, and success states exist.
