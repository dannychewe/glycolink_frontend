import { gql } from "@apollo/client";

export type ProviderProgrammeOffer = {
  id: string;
  name: string;
  description: string | null;
  organizationName: string | null;
  defaultDurationDays: number | null;
  defaultMonitoringCadenceDays: number;
  patientOffer: string | null;
  whoItIsFor: string | null;
  whatHappensNext: string | null;
  myEnrolmentId: string | null;
  prices: {
    id: string;
    name: string;
    amount: string;
    currency: string;
    billingModel: string;
    billingInterval: string | null;
    includedServiceSummary: string | null;
  }[];
};

export const PROVIDER_PROGRAMME_OFFERS_QUERY = gql`
  query ProviderProgrammeOffers($providerId: UUID!) {
    providerProgrammeOffers(providerId: $providerId) {
      id
      name
      description
      organizationName
      defaultDurationDays
      defaultMonitoringCadenceDays
      patientOffer
      whoItIsFor
      whatHappensNext
      myEnrolmentId
      prices {
        id
        name
        amount
        currency
        billingModel
        billingInterval
        includedServiceSummary
      }
    }
  }
`;

export const JOIN_PROVIDER_PROGRAMME_MUTATION = gql`
  mutation JoinProviderProgramme(
    $providerId: UUID!
    $programmeId: UUID!
    $priceId: UUID!
  ) {
    joinProviderProgramme(
      providerId: $providerId
      programmeId: $programmeId
      priceId: $priceId
    ) {
      enrolment {
        id
      }
      invoiceId
    }
  }
`;

export const CONFIGURE_PROVIDER_PROGRAMME_OFFER_MUTATION = gql`
  mutation ConfigureProviderProgrammeOffer(
    $programmeId: UUID!
    $providerIds: [UUID!]!
    $enabled: Boolean!
  ) {
    configureProviderProgrammeOffer(
      programmeId: $programmeId
      providerIds: $providerIds
      enabled: $enabled
    ) {
      programme {
        id
        publicEnrolmentEnabled
        offeringProviders {
          id
          displayName
        }
      }
    }
  }
`;
