import { gql } from "@apollo/client";

export const PROVIDERS_QUERY = gql`
  query PatientProviders(
    $search: String
    $specialtyId: UUID
    $page: Int
    $limit: Int
  ) {
    providers(
      search: $search
      specialtyId: $specialtyId
      page: $page
      limit: $limit
    ) {
      total
      page
      limit
      items {
        id
        displayName
        bio
        avatarUrl
        profilePictureUrl
        consultationFeeInitial
        consultationFeeFollowup
        specialties
        subSpecialties
        languages
        status
        verificationStatus
        eligible
        averageRating
        reviewCount
        organization {
          id
          name
          type
        }
      }
    }
  }
`;

export const PROVIDER_QUERY = gql`
  query PatientProviderDetail($id: UUID!) {
    provider(id: $id) {
      id
      displayName
      bio
      consultationFeeInitial
      consultationFeeFollowup
      languages
      status
      verificationStatus
      eligible
      specialties
      subSpecialties
      averageRating
      reviewCount
      organization {
        id
        name
        type
      }
    }
  }
`;

export const PROVIDER_REVIEWS_QUERY = gql`
  query ProviderReviews($providerId: UUID!, $page: Int, $limit: Int) {
    providerReviews(providerId: $providerId, page: $page, limit: $limit) {
      total
      page
      limit
      items {
        id
        rating
        comment
        reviewerName
        createdAt
      }
    }
  }
`;

export const SUBMIT_PROVIDER_REVIEW_MUTATION = gql`
  mutation SubmitProviderReview($appointmentId: UUID!, $rating: Int!, $comment: String) {
    submitProviderReview(appointmentId: $appointmentId, rating: $rating, comment: $comment) {
      review {
        id
        rating
        comment
        reviewerName
        createdAt
      }
    }
  }
`;

export const MY_APPOINTMENTS_FOR_REVIEWS_QUERY = gql`
  query MyAppointmentsForReviews {
    myAppointments(status: "completed", limit: 50) {
      id
      providerId
      startsAt
      completedAt
      status
    }
  }
`;

export const DIRECTORY_MY_PROVIDER_PROFILE_QUERY = gql`
  query MyProviderProfile {
    myProviderProfile {
      id
      displayName
      status
      verificationStatus
      hpczNumber
      telemedApprovalExpiryDate
    }
  }
`;
