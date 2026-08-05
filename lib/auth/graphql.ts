import { gql } from "@apollo/client";

export const REGISTER_MUTATION = gql`
  mutation Register(
    $email: String!
    $password: String!
    $fullName: String
    $phone: String
    $accountType: RegisterAccountTypeEnum
  ) {
    register(
      email: $email
      password: $password
      fullName: $fullName
      phone: $phone
      accountType: $accountType
    ) {
      user {
        id
        email
        firstName
        lastName
        phone
        primaryRole
        accountType
        isVerified
      }
      verificationRequired
      verificationToken
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      refreshToken
      user {
        id
        email
        fullName
        accountType
        isVerified
        primaryRole
      }
    }
  }
`;

export const VERIFY_EMAIL_MUTATION = gql`
  mutation Verify($token: String!) {
    verify(token: $token) {
      user {
        id
        email
        primaryRole
        accountType
        isVerified
      }
    }
  }
`;

export const RESEND_VERIFICATION_MUTATION = gql`
  mutation ResendVerification($email: String!) {
    resendVerification(email: $email) {
      success
      verificationToken
    }
  }
`;

export const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestReset($email: String!) {
    requestPasswordReset(email: $email) {
      success
      resetToken
    }
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(resetToken: $token, newPassword: $newPassword) {
      success
    }
  }
`;

export const ACCEPT_PROVIDER_ORGANIZATION_INVITE_MUTATION = gql`
  mutation AcceptProviderOrganizationInvite(
    $token: String!
    $password: String
    $fullName: String
    $phone: String
    $displayName: String
    $hpczNumber: String
  ) {
    acceptProviderOrganizationInvite(
      token: $token
      password: $password
      fullName: $fullName
      phone: $phone
      displayName: $displayName
      hpczNumber: $hpczNumber
    ) {
      invite {
        id
        status
        acceptedAt
        organization {
          id
          name
        }
        invitedProvider {
          id
          displayName
        }
      }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout($refreshToken: String!) {
    logout(refreshToken: $refreshToken) {
      revoked
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      primaryRole
      isVerified
      isStaff
      isSuperuser
      accountType
      firstName
      fullName
      lastLoginAt
      lastName
      phone
    }
  }
`;

export const POST_LOGIN_REDIRECT_QUERY = gql`
  query PostLoginRedirect {
    postLoginRedirect {
      route
      reason
      accountType
    }
  }
`;

export const BOOTSTRAP_CLIENT_QUERY = gql`
  query BootstrapClient {
    me {
      id
      email
      primaryRole
      isVerified
      isStaff
      isSuperuser
      accountType
      firstName
      fullName
      lastLoginAt
      lastName
      phone
    }
    postLoginRedirect {
      route
      reason
      accountType
    }
    myPatientProfile {
      id
      fullName
      email
      dateOfBirth
      diabetesType
      diagnosisDate
      phone
      profileComplete
      onboardingStatus
      onboardingComplete
    }
    profileCompletionStatus {
      isComplete
      pcqComplete
      consultationReady
      percentComplete
      missingItems
    }
    patientOnboardingReadiness {
      isComplete
      pcqComplete
      consultationReady
      percentComplete
      missingRequired
      missingSetup
      nextAction
      requiredItems {
        code
        label
        complete
        action
      }
      setupItems {
        code
        label
        complete
        action
      }
      patientProfile {
        id
        fullName
        email
        dateOfBirth
        diabetesType
        diagnosisDate
        phone
        allergies
        currentMedications
        additionalNotes
        profileComplete
        onboardingStatus
        onboardingComplete
      }
    }
  }
`;

export const BOOTSTRAP_CONSULTANT_QUERY = gql`
  query BootstrapConsultant($warningWindowDays: Int) {
    me {
      id
      email
      primaryRole
      isVerified
      isStaff
      isSuperuser
      accountType
      firstName
      fullName
      lastLoginAt
      lastName
      phone
    }
    postLoginRedirect {
      route
      reason
      accountType
    }
    myProviderProfile {
      id
      displayName
      status
      verificationStatus
      hpczNumber
    }
    providerStatusSummary(warningWindowDays: $warningWindowDays) {
      status
      isApproved
      isSuspended
      verificationStatus
      suspendedAt
      suspensionReason
      warningWindowDays
      expiryWarnings {
        type
        label
        status
        expiryDate
        daysRemaining
        currentStatus
      }
    }
    providerOnboardingReadiness {
      status
      verificationStatus
      canSubmit
      canResubmit
      submitted
      approved
      missingRequired
      missingSetup
      nextAction
      requiredItems {
        code
        label
        complete
        action
      }
      setupItems {
        code
        label
        complete
        action
      }
      provider {
        id
        tenantId
        userId
        organizationId
        displayName
        hpczNumber
        bio
        languages
        consultationFeeInitial
        consultationFeeFollowup
        status
        verificationStatus
        specialtyIds
        specialties
        subSpecialtyIds
        subSpecialties
        certificateExpiryDate
        telemedApprovalExpiryDate
        profilePictureUrl
        licenses {
          id
          providerId
          type
          status
          expiryDate
          issuedAt
          fileUrl
          createdAt
          updatedAt
        }
      }
    }
  }
`;

export const MY_PATIENT_PROFILE_QUERY = gql`
  query MyPatientProfile {
    myPatientProfile {
      baselineBpDiastolic
      baselineBpSystolic
      baselineWeight
      dateOfBirth
      diabetesType
      diagnosisDate
      email
      fullName
      id
      notes
      onboardingStatus
      phone
      profileComplete
    }
  }
`;

export const MY_PROVIDER_PROFILE_QUERY = gql`
  query MyProviderProfile {
    myProviderProfile {
      avatarUrl
      bio
      consultationFee
      consultationFeeFollowup
      consultationFeeInitial
      createdAt
      displayName
      eligible
      hpczNumber
      id
      languages
      profilePictureUrl
      shortBio
      specialties
      specialty
      status
      subSpecialties
      subSpecialty
      verificationStatus
      organization {
        id
        name
        type
        status
        regulatoryId
        logoUrl
        parentOrg {
          id
          name
          type
          status
          regulatoryId
          logoUrl
        }
      }
    }
  }
`;
