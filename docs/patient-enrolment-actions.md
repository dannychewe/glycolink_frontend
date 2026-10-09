# Patient Programme Actions

Patient Details > Programmes and programme administration share enrolment controls.
The `availableActions` field is the authority for which controls are displayed.
No action is enabled from `programme.enrol` alone.

- Care-team assignment uses `programmeEnrolment.careTeamCandidates`, not the public provider directory.
- Doctor/nurse roles require a provider in the enrolment's clinic; eligible staff can coordinate care.
- Selecting the doctor role assigns the lead provider. Assigning a role replaces its previous active assignment.
- Activation requires administrator access, a clinic provider identity, and passing readiness checks.
- Resume requires a paused enrolment and passing current readiness checks.
- Pause, completion, and withdrawal follow backend state transitions.
- Completed/withdrawn enrolments cannot change their care team.
- Every lifecycle action has a confirmation modal. Completion/withdrawal require a reason in the UI.
- Changes affect the selected enrolment, not the shared programme or its other patients.
- Successful mutations reload enrolments, readiness, plans, schedules, and monitoring requirements.
- Refresh failures are reported separately from mutation failures to avoid inviting a duplicate action.

The backend administrator restrictions are intentionally retained. Expanding
lead-doctor or coordinator authority requires an explicit access-policy change.
