import { gql } from "@apollo/client";

export const MY_PROVIDER_PROFILE_QUERY = gql`
  query ConsultantMyProviderProfile {
    myProviderProfile {
      id
      displayName
      avatarUrl
      profilePictureUrl
      status
      verificationStatus
      hpczNumber
      bio
      languages
      languagesJson
      specialties
      subSpecialties
      consultationFeeInitial
      consultationFeeFollowup
      certificateExpiryDate
      telemedApprovalExpiryDate
      licenses {
        id
        type
        status
        expiryDate
        issuedAt
        fileUrl
      }
      organization {
        id
        name
        type
      }
    }
  }
`;

export const UPLOAD_PROVIDER_PROFILE_PICTURE_MUTATION = gql`
  mutation ConsultantUploadProfilePicture($file: Upload!) {
    uploadProviderProfilePicture(file: $file) {
      providerProfile {
        id
        avatarUrl
        profilePictureUrl
      }
    }
  }
`;

export const PROVIDER_ONBOARDING_READINESS_QUERY = gql`
  query ConsultantProviderOnboardingReadiness {
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

export const PROVIDER_STATUS_SUMMARY_QUERY = gql`
  query ConsultantProviderStatusSummary($warningWindowDays: Int) {
    providerStatusSummary(warningWindowDays: $warningWindowDays) {
      status
      isApproved
      isSuspended
      verificationStatus
      verifiedAt
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
  }
`;

export const CREATE_PROVIDER_PROFILE_MUTATION = gql`
  mutation CreateProviderProfile($data: ProviderProfileInput!) {
    createProviderProfile(data: $data) {
      providerProfile {
        id
        displayName
        status
        verificationStatus
      }
    }
  }
`;

export const UPDATE_PROVIDER_PROFILE_MUTATION = gql`
  mutation ConsultantUpdateProviderProfile($data: ProviderProfileInput!) {
    updateProviderProfile(data: $data) {
      providerProfile {
        id
        displayName
        hpczNumber
        bio
        status
        verificationStatus
      }
    }
  }
`;

export const UPDATE_PROVIDER_SPECIALTIES_MUTATION = gql`
  mutation ConsultantUpdateProviderSpecialties($specialtyIds: [UUID]!, $subSpecialtyIds: [UUID]!) {
    updateProviderSpecialties(specialtyIds: $specialtyIds, subSpecialtyIds: $subSpecialtyIds) {
      providerProfile {
        id
        specialties
        subSpecialties
      }
    }
  }
`;

export const SUBMIT_PROVIDER_PROFILE_MUTATION = gql`
  mutation SubmitProviderProfile {
    submitProviderProfile {
      providerProfile {
        id
        status
        verificationStatus
      }
    }
  }
`;

export const UPLOAD_PROVIDER_LICENSE_MUTATION = gql`
  mutation ConsultantUploadProviderLicense(
    $file: Upload!
    $licenseType: String!
    $expiryDate: Date
    $issuedAt: Date
  ) {
    uploadProviderLicense(
      file: $file
      licenseType: $licenseType
      expiryDate: $expiryDate
      issuedAt: $issuedAt
    ) {
      license {
        id
        type
        fileUrl
        expiryDate
        issuedAt
        status
      }
    }
  }
`;

export const CONSULTANT_AVAILABILITY_QUERY = gql`
  query ConsultantAvailability($startDate: Date, $endDate: Date) {
    myAvailabilityRules {
      id
      weekday
      startTime
      endTime
      slotMinutes
      timezone
      isActive
    }
    myAvailabilityExceptions(startDate: $startDate, endDate: $endDate) {
      id
      date
      isAvailable
      overrideStartTime
      overrideEndTime
      reason
    }
  }
`;

export const DELETE_AVAILABILITY_RULE_MUTATION = gql`
  mutation ConsultantDeleteAvailabilityRule($ruleId: UUID!) {
    deleteAvailabilityRule(ruleId: $ruleId) {
      success
    }
  }
`;

export const DELETE_AVAILABILITY_EXCEPTION_MUTATION = gql`
  mutation ConsultantDeleteAvailabilityException($exceptionId: UUID!) {
    deleteAvailabilityException(exceptionId: $exceptionId) {
      success
    }
  }
`;

export const PREVIEW_SLOTS_QUERY = gql`
  query ConsultantPreviewSlots($providerId: UUID!, $date: Date!) {
    availableSlots(providerId: $providerId, date: $date) {
      startTime
      endTime
    }
  }
`;

export const SET_AVAILABILITY_RULE_MUTATION = gql`
  mutation ConsultantSetAvailability($data: AvailabilityRuleInput!) {
    setAvailabilityRule(data: $data) {
      rule {
        id
        weekday
        startTime
        endTime
        slotMinutes
        timezone
        isActive
      }
    }
  }
`;

export const ADD_AVAILABILITY_EXCEPTION_MUTATION = gql`
  mutation ConsultantAddAvailabilityException($data: AvailabilityExceptionInput!) {
    addAvailabilityException(data: $data) {
      exception {
        id
        date
        isAvailable
        overrideStartTime
        overrideEndTime
        reason
      }
    }
  }
`;

export const APPROVE_PROVIDER_MUTATION = gql`
  mutation ApproveProvider($providerId: UUID!) {
    approveProvider(providerId: $providerId) {
      providerProfile {
        id
        status
        verificationStatus
      }
    }
  }
`;

export const REJECT_PROVIDER_MUTATION = gql`
  mutation RejectProvider($providerId: UUID!, $reason: String!) {
    rejectProvider(providerId: $providerId, reason: $reason) {
      providerProfile {
        id
        status
        verificationStatus
      }
    }
  }
`;

export const SUSPEND_PROVIDER_MUTATION = gql`
  mutation SuspendProvider($providerId: UUID!, $reason: String!) {
    suspendProvider(providerId: $providerId, reason: $reason) {
      providerProfile {
        id
        status
        verificationStatus
      }
    }
  }
`;

export const CONSULTANT_SPECIALTIES_QUERY = gql`
  query Specialties {
    specialties {
      id
      name
    }
  }
`;

export const CONSULTANT_SUB_SPECIALTIES_QUERY = gql`
  query SubSpecialties($specialtyId: UUID) {
    subSpecialties(specialtyId: $specialtyId) {
      id
      name
      specialtyId
      specialtyName
    }
  }
`;

export const PROVIDER_LICENSE_TYPE_OPTIONS = [
  { value: "hpcz", label: "HPCZ License" },
  { value: "national_id", label: "National ID" },
  { value: "practicing_certificate", label: "Practicing Certificate" },
  { value: "telemed_approval", label: "Telemedicine Approval" },
  { value: "other", label: "Other" },
] as const;

export const PROVIDER_WEEKDAY_OPTIONS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
] as const;
