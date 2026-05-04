# Frontend Authentication Guide

This document defines how the frontend should authenticate against the API, which GraphQL operations to use, and how to interpret roles and authorization responses.

## API Endpoints

- GraphQL: `POST /graphql/`
- Health: `GET /healthz/`

## Token Model

`login` and `tokenAuth` return:

- `token`: short-lived JWT access token, send on authenticated API calls.
- `refreshToken`: long-lived token used to rotate access tokens.
- `payload`: decoded JWT claims.
- `refreshExpiresIn`: unix timestamp in seconds for refresh token expiry.

Authenticated request header:

- `Authorization: Bearer <token>`

## Registration

Frontend selects account type:

- `CLIENT`: creates a patient profile.
- `CONSULTANT`: creates a provider profile (draft).

Recommended register mutation:

```graphql
mutation Register(
  $email: String!
  $password: String!
  $fullName: String
  $accountType: RegisterAccountTypeEnum
) {
  register(
    email: $email
    password: $password
    fullName: $fullName
    accountType: $accountType
  ) {
    user {
      id
      email
      primaryRole
      isVerified
      accountType
    }
    verificationRequired
    verificationToken
  }
}
```

Notes:

- `verificationToken` is only returned when `DEBUG=True`. In production it is emailed.
- Backend automatically creates a personal tenant and profile based on `accountType`.

## Email Verification

```graphql
mutation Verify($token: String!) {
  verify(token: $token) {
    user {
      id
      email
      isVerified
      primaryRole
      accountType
    }
  }
}
```

Frontend handling:

- Verification link targets route like `/verify-email?token=<token>`.
- On page load, read query param and call `verify`.
- If `isVerified` is true, show success and redirect to login or continue active session.
- On mutation errors, map codes as follows.
- `AUTH_EMAIL_VERIFICATION_EXPIRED`: show expired-link UI and offer resend.
- `AUTH_EMAIL_VERIFICATION_INVALID`: show invalid/used link state.
- Any other error: show generic failure state.

Example flow:

```ts
const token = new URLSearchParams(location.search).get("token");
if (!token) {
  showError("Invalid verification link.");
  return;
}

try {
  const data = await graphql.mutate(VERIFY_MUTATION, { token });
  if (data?.verify?.user?.isVerified) {
    showSuccess("Email verified. Please log in.");
    redirect("/login");
  } else {
    showError("Verification failed.");
  }
} catch (err) {
  const code = err?.graphQLErrors?.[0]?.extensions?.code;
  if (code === "AUTH_EMAIL_VERIFICATION_EXPIRED") {
    showExpiredUIWithResend();
  } else if (code === "AUTH_EMAIL_VERIFICATION_INVALID") {
    showError("This link is invalid or already used.");
  } else {
    showError("Verification failed. Try again.");
  }
}
```

Resend verification:

```graphql
mutation ResendVerification($email: String!) {
  resendVerification(email: $email) {
    success
    verificationToken
  }
}
```

## Login

```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    payload
    refreshToken
    refreshExpiresIn
  }
}
```

Alias with same behavior:

```graphql
mutation TokenAuth($email: String!, $password: String!) {
  tokenAuth(email: $email, password: $password) {
    token
    payload
    refreshToken
    refreshExpiresIn
  }
}
```

After login:

- Store access token in memory (or secure storage on mobile).
- Store refresh token in secure storage if session persistence is needed.
- Add `Authorization` header on subsequent authenticated calls.
- Immediately call `me` to fetch bootstrap identity fields.

## Refresh Token

```graphql
mutation Refresh($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    token
    payload
    refreshToken
    refreshExpiresIn
  }
}
```

Use for:

- Recovering from access token expiry.
- Proactive token rotation before expiry.

## Logout

```graphql
mutation Logout($refreshToken: String!) {
  logout(refreshToken: $refreshToken) {
    revoked
  }
}
```

Equivalent mutation:

```graphql
mutation RevokeToken($refreshToken: String!) {
  revokeToken(refreshToken: $refreshToken) {
    revoked
  }
}
```

JWT verification utility:

```graphql
mutation VerifyToken($token: String!) {
  verifyToken(token: $token) {
    payload
  }
}
```

## Password Reset

Request reset:

```graphql
mutation RequestReset($email: String!) {
  requestPasswordReset(email: $email) {
    success
    resetToken
  }
}
```

Confirm reset:

```graphql
mutation ResetPassword($token: String!, $newPassword: String!) {
  resetPassword(resetToken: $token, newPassword: $newPassword) {
    success
  }
}
```

`resetToken` is only returned when `DEBUG=True`. In production it is emailed.

## Current User

```graphql
query Me {
  me {
    id
    email
    primaryRole
    isVerified
    accountType
  }
}
```

## Post-Login Bootstrap

Fetch identity and role:

- `me`

Fetch profile by account type:

- Patient: `myPatientProfile`
- Consultant: `myProviderProfile`

Optionally fetch tenant-scoped data needed by landing screen:

- notifications
- appointments
- similar home-screen dependencies

Example:

```graphql
query BootstrapClient {
  me {
    id
    email
    primaryRole
    isVerified
    accountType
  }
  myPatientProfile {
    id
    onboardingStatus
    profileComplete
  }
}
```

```graphql
query BootstrapConsultant {
  me {
    id
    email
    primaryRole
    isVerified
    accountType
  }
  myProviderProfile {
    id
    lifecycleStatus
    verificationStatus
  }
}
```

## Post-Login Redirect

If backend should choose initial route:

```graphql
query PostLoginRedirect {
  postLoginRedirect {
    route
    reason
    accountType
  }
}
```

Possible `reason` values:

- `PROVIDER_ONBOARDING`
- `PATIENT_ONBOARDING`
- `PROFILE_MISSING`
- `READY`

## Profile Queries

Patient profile:

```graphql
query MyPatientProfile {
  myPatientProfile {
    id
    onboardingStatus
    profileComplete
  }
}
```

Consultant profile:

```graphql
query MyProviderProfile {
  myProviderProfile {
    id
    lifecycleStatus
    verificationStatus
  }
}
```

## Authorization Notes

- `accountType` is the stable frontend routing signal in `me`, `register.user`, and `verify.user`.
- `tokenAuth` and `login` no longer return nested `user`; call `me` after login.
- Stable `accountType` values: `PATIENT`, `CONSULTANT`, `ADMIN`.
- `primaryRole` remains the coarse platform-level RBAC signal.
- Tenant/org access is enforced server-side; frontend should handle API authorization errors.
- Many queries require verified users. If `isVerified=false`, expect authorization failures until verification completes.
- `postLoginRedirect.accountType` remains backward-compatible (`CLIENT`, `CONSULTANT`, `UNKNOWN`). Prefer `me.accountType` for deterministic semantics.

## Common Error Codes

Domain auth/account flows may return `extensions.code`:

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_USER_NOT_VERIFIED`
- `AUTH_USER_INACTIVE`
- `AUTH_ACCOUNT_LOCKED`
- `AUTH_EMAIL_VERIFICATION_INVALID`
- `AUTH_EMAIL_VERIFICATION_EXPIRED`
- `AUTH_PASSWORD_RESET_INVALID`
- `AUTH_PASSWORD_RESET_EXPIRED`

JWT library mutations (`tokenAuth`, `refreshToken`, `verifyToken`, `revokeToken`) may return generic JWT errors with message text and may not include custom `extensions.code`.

Legacy codes from prior custom session flow should not drive current UX handling:

- `AUTH_TOKEN_INVALID`
- `AUTH_TOKEN_EXPIRED`
- `AUTH_SESSION_REVOKED`

Use current responses to drive UX actions like resend verification, retry refresh, and forced re-login.
