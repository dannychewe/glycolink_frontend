import { gql } from "@apollo/client";

export const MY_CONSULTANT_ORGANIZATIONS_QUERY = gql`
  query ConsultantMyOrganizations {
    myConsultantOrganizations {
      id
      name
      type
      status
      regulatoryId
      parentOrgId
      logoUrl
    }
  }
`;

export const CONSULTANT_ORGANIZATIONS_QUERY = gql`
  query ConsultantOrganizations($tenantId: UUID!) {
    myOrganizations(tenantId: $tenantId) {
      id
      name
      type
      status
      regulatoryId
      parentOrgId
      logoUrl
    }
  }
`;

export const ORGANIZATION_DETAIL_QUERY = gql`
  query ConsultantOrganizationDetail($organizationId: UUID!) {
    organization(organizationId: $organizationId) {
      id
      tenantId
      name
      type
      status
      regulatoryId
      parentOrgId
      logoUrl
      parentOrg {
        id
        name
        type
      }
    }
  }
`;

export const ORGANIZATION_PROVIDERS_QUERY = gql`
  query ConsultantOrganizationProviders($organizationId: UUID!) {
    organizationProviders(organizationId: $organizationId) {
      id
      displayName
      lifecycleStatus
      verificationStatus
      organization {
        id
        name
      }
      user {
        id
        email
      }
    }
  }
`;

export const ORGANIZATION_PROVIDER_INVITES_QUERY = gql`
  query ConsultantOrganizationProviderInvites($organizationId: UUID!, $status: String) {
    organizationProviderInvites(organizationId: $organizationId, status: $status) {
      id
      status
      invitedEmail
      note
      inviterProvider {
        id
        displayName
      }
      invitedProvider {
        id
        displayName
      }
      invitedUser {
        id
        email
      }
      acceptedAt
      expiresAt
      reviewedAt
      createdAt
    }
  }
`;

export const CREATE_PROVIDER_ORGANIZATION_MUTATION = gql`
  mutation ConsultantCreateProviderOrganization(
    $name: String!
    $type: String!
    $regulatoryId: String
    $parentOrgId: UUID
  ) {
    createProviderOrganization(
      name: $name
      type: $type
      regulatoryId: $regulatoryId
      parentOrgId: $parentOrgId
    ) {
      organization {
        id
        name
        type
        status
        regulatoryId
        parentOrgId
        logoUrl
      }
    }
  }
`;

export const UPDATE_ORGANIZATION_MUTATION = gql`
  mutation ConsultantUpdateOrganization($organizationId: UUID!, $data: OrganizationInput!) {
    updateOrganization(organizationId: $organizationId, data: $data) {
      organization {
        id
        name
        type
        status
        regulatoryId
        parentOrgId
        logoUrl
      }
    }
  }
`;

export const ORGANIZATION_SETTINGS_QUERY = gql`
  query ConsultantOrganizationSettings($organizationId: UUID!) {
    organizationSettings(organizationId: $organizationId) {
      id
      patientProviderVisibility
      updatedAt
    }
  }
`;

export const UPDATE_ORGANIZATION_SETTINGS_MUTATION = gql`
  mutation ConsultantUpdateOrganizationSettings(
    $organizationId: UUID!
    $data: OrganizationSettingsInput!
  ) {
    updateOrganizationSettings(organizationId: $organizationId, data: $data) {
      settings {
        id
        patientProviderVisibility
        updatedAt
      }
    }
  }
`;

export const DEACTIVATE_ORGANIZATION_MUTATION = gql`
  mutation ConsultantDeactivateOrganization($organizationId: UUID!) {
    deactivateOrganization(organizationId: $organizationId) {
      organization {
        id
        status
      }
    }
  }
`;

export const UPLOAD_ORGANIZATION_LOGO_MUTATION = gql`
  mutation ConsultantUploadOrganizationLogo($organizationId: UUID!, $file: Upload!) {
    uploadOrganizationLogo(organizationId: $organizationId, file: $file) {
      organization {
        id
        name
        logoUrl
      }
    }
  }
`;

export const INVITE_PROVIDER_TO_ORGANIZATION_MUTATION = gql`
  mutation ConsultantInviteProviderToOrganization(
    $organizationId: UUID!
    $email: String!
    $note: String
  ) {
    inviteProviderToOrganization(
      organizationId: $organizationId
      email: $email
      note: $note
    ) {
      invite {
        id
        status
        invitedEmail
        note
        organization {
          id
          name
        }
        invitedProvider {
          id
          displayName
        }
        invitedUser {
          id
          email
        }
        expiresAt
        createdAt
      }
    }
  }
`;

export const APPROVE_PROVIDER_ORGANIZATION_INVITE_MUTATION = gql`
  mutation ConsultantApproveProviderOrganizationInvite($inviteId: UUID!) {
    approveProviderOrganizationInvite(inviteId: $inviteId) {
      invite {
        id
        status
        reviewedAt
      }
    }
  }
`;

export const REJECT_PROVIDER_ORGANIZATION_INVITE_MUTATION = gql`
  mutation ConsultantRejectProviderOrganizationInvite($inviteId: UUID!, $reason: String) {
    rejectProviderOrganizationInvite(inviteId: $inviteId, reason: $reason) {
      invite {
        id
        status
        note
        reviewedAt
      }
    }
  }
`;

export const ORGANIZATION_TYPE_OPTIONS = [
  { value: "CLINIC", label: "Clinic" },
  { value: "LAB", label: "Laboratory" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "INSURER", label: "Insurer" },
  { value: "CORPORATE", label: "Corporate Account" },
  { value: "OTHER", label: "Other" },
] as const;
