# Consultant Patient Workspace Mapping

The frontend follows `apps/patients/services/consultant_workspace_service.py`
and the exposed GraphQL types. Workspace collections are provider-scoped and
limited to recent records (20 per collection here), not patient-wide totals.
Privacy preferences can suppress records; empty lists do not prove records do
not exist.

| UI | Backend source | Relationship |
| --- | --- | --- |
| Overview | PatientProfile; recommendations | Accepted consultant-patient relationship |
| Programmes | clinicProgrammeEnrolments | Patient -> enrolment -> programme |
| Enrolment Care Plan | programmeCurrentCarePlan / programmeCarePlanHistory | PatientCarePlan -> programme_enrolment; versioned clinical workflow |
| Shared Programme Plans | carePlanProgrammes | CarePlanProgramme -> programme; general, meal, and exercise plans are siblings |
| Patient Care Plans | ongoingCarePlans | PatientCarePlan -> patient/provider; may also be enrolment-linked |
| Encounters | encounters | Encounter -> appointment/patient/provider |
| Encounter Actions | carePlanActions; encounters.carePlanActions | CarePlanAction -> encounter; not PatientCarePlanAction |
| Patient plan Actions | ongoingCarePlans.actions | PatientCarePlanAction -> PatientCarePlan |
| Patient plan Milestones | ongoingCarePlans.milestones | PatientCareMilestone -> PatientCarePlan; optional encounter link |
| Labs / Orders | labOrders.tests.results | LabOrder -> Encounter; LabOrderTest -> LabOrder; LabResult -> LabOrderTest |
| Labs / Recent Results | labResults | Independently limited recent result collection; matched to test names only by result ID |
| Prescriptions | prescriptions.items | Prescription -> MedicationOrder items |
| Questionnaires | pcqResponses.template, responseScope, appointmentId | PCQResponse -> template version; appointment link is optional |
| Documents | documents | PatientDocument -> file asset; backend includes profiles for the same patient user |
| Monitoring | consultantPatientMonitoring | Backend-approved monitoring visibility, readings, thresholds, alerts |

## Care-Plan Ownership

`PatientCarePlanType` in the workspace currently omits `programme_enrolment_id`.
The frontend therefore checks all returned patient enrolments and joins care-plan
history records by exact care-plan ID and enrolment ID. Only after every history
lookup succeeds can an unmatched plan be treated as standalone. Failed or
unverified relationships remain read-only. Enrolment-linked plans open the
enrolment workflow; the standalone Add Action control cannot mutate them.

Shared programme plans are read-only in this patient workspace. They are not
children of an individual patient care plan, and this view does not create
patient-specific copies, assignments, or version snapshots.

Backend improvement: expose the enrolment ID on the workspace's PatientCarePlanType
to remove the extra history lookups. No backend files were changed for this UI work.
