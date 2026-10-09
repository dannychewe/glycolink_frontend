# Programme Plan Access

## Visibility

| Audience | Available content |
| --- | --- |
| Public share link | Programme offer, clinic, audience, duration, monitoring cadence, milestone titles/days, included services, prices and billing terms |
| Enrolled, awaiting payment | Baseline onboarding, existing individual clinical records, payment invoices and access status |
| Covered by payment | Shared programme care plans, meal plans and exercise plans, including items and instructions |
| Clinic team | Programme management and clinical workflows according to existing permissions |

Public milestone previews omit descriptions in both the API and frontend.
Shared plans use the backend `ProgrammeEnrolmentType.hasSharedPlanAccess` flag.
The backend also checks coverage on list and single-plan queries, including direct GraphQL requests.

## Coverage

- Active entitlement: today must fall within its start/end dates, inclusive.
- Grace period: coverage must have started and the grace deadline must be in the future. The entitlement deadline takes precedence over the billing-account deadline.
- Missing, pending, suspended, expired or cancelled entitlement: locked.
- Invited, completed or withdrawn enrolment: locked even with paid coverage.
- Clinical baseline approval and individual care-plan activation remain separate from commercial access.

## Enrolment And Payment

1. Publish an active programme with enrolment open and share its public link.
2. The patient registers, verifies their email and completes baseline onboarding.
3. In consultant Billing, create/select the payer and programme package and attach them to the enrolment.
4. Generate and issue the programme invoice.
5. The patient opens Payments and completes the existing mobile-money payment flow.
6. A confirmed payment updates the entitlement. The patient refreshes access in programme details, or waits for its periodic access check.
7. The clinic completes clinical approval and activates the individual enrolment through the existing workflow.

Registration does not automatically select a package or issue an invoice.
Payment confirmation must come from the existing backend payment workflow.
Existing enrolments without valid entitlement records will have shared plans locked.

## Release And Verification

Release the backend access service and GraphQL field before this frontend version.
No database migration is needed.

- Open a public share link: verify prices and milestone previews without detailed instructions.
- Open an unpaid patient's programme: verify payment/baseline actions and no shared-plan requests.
- Send direct shared-plan list/detail requests as that patient: verify access denied.
- Confirm payment: verify all three shared-plan sections become available.
- Verify future coverage, expiry, suspension, grace deadlines and ended enrolments.
- Verify staff management and existing individual clinical records remain accessible according to their permissions.

Backend regression tests: `apps.programmes.tests_shared_plan_access` and `apps.payments.tests_programme_billing`.
