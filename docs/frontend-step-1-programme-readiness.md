# Frontend Step 1 Programme Readiness

This note records the frontend integration decisions for the Naje Health diabetes continuity-of-care programme work.

## Contract Source

The programme GraphQL contract was mapped from the backend handoff and backend Graphene source:

- `D:\Nakubiana\glycolink-api\docs\backend-integration-checkpoint.md`
- `apps/programmes/graphql/types.py`
- `apps/programmes/graphql/queries.py`
- `apps/programmes/graphql/mutations.py`
- `apps/monitoring/graphql/types.py`
- `apps/monitoring/graphql/queries.py`
- `apps/monitoring/graphql/mutations.py`
- `apps/payments/graphql/types.py`
- `apps/payments/graphql/queries.py`
- `apps/payments/graphql/mutations.py`

The exposed GraphQL operation names use Graphene camel-case names. For example, the backend mutation class `UpdateDraftCareProgramme` is exposed as `updateDraftCareProgramme`, and `ApproveActivateProgrammeCarePlan` is exposed as `approveActivateProgrammeCarePlan`.

## Frontend Contract Module

Programme GraphQL operations and shared DTOs are centralized in:

- `lib/programmes/graphql.ts`

The module intentionally follows the existing frontend pattern of colocated Apollo `gql` documents with manual TypeScript types. Full GraphQL codegen is not introduced in this step because the current repo does not have codegen tooling, scripts, or generated type usage. Adding codegen should be a separate hardening task after the first programme screens prove the field selections.

## Auth And Role Readiness

The current frontend auth model supports broad route gates:

- patient routes: `CLIENT`, `PATIENT`, `STANDARD_USER`
- consultant routes: `CONSULTANT`
- admin routes: system admin only

The backend programme model is more granular:

- clinic admin
- clinic viewer
- lead doctor
- nurse
- care coordinator
- billing viewer
- assigned care-team member

Frontend screens must not infer these roles from the broad account type alone. Until a dedicated role/permission payload is available in `me` or organization membership queries, Step 2 should use backend authorization as the source of truth and show permission-aware empty/error states for denied programme actions.

## Privacy Notes

Patient-facing screens must not display provider-only fields. The backend already suppresses some fields, but frontend components should still avoid exposing:

- care plan `internalNotes`
- private alert intervention clinical/coordination notes
- raw gateway data or internal payment reconciliation details
- detailed clinical values in notification previews

## Immediate Follow-Up For Step 2

Provider dashboard work should import programme operations from `lib/programmes/graphql.ts` and prioritize:

- `clinicProgrammeDashboardOverview`
- `clinicAlertWorkQueue`
- `clinicPatientCohort`

The current consultant dashboard can be modified in place, but its mental model should change from appointments-first to attention-first.
