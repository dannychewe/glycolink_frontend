import { gql } from "@apollo/client";

export const SPECIALTIES_QUERY = gql`
  query Specialties {
    specialties {
      id
      name
    }
  }
`;

export const ADMIN_DASHBOARD_BOOTSTRAP_QUERY = gql`
  query AdminDashboardBootstrap {
    me {
      id
      email
      accountType
      primaryRole
      isSuperuser
    }
    systemTenants(page: 1, limit: 5) {
      total
    }
    notificationsPreview(limit: 5) {
      unreadCount
      items {
        id
        title
        message
        type
        isRead
        createdAt
      }
    }
    auditEvents(page: 1, limit: 10) {
      total
      items {
        id
        actionType
        entityType
        entityId
        createdAt
      }
    }
  }
`;

export const ADMIN_DASHBOARD_TENANTS_QUERY = gql`
  query AdminDashboardTenants {
    systemTenants(page: 1, limit: 10) {
      items {
        id
        name
        slug
        status
      }
      total
    }
  }
`;

export const ADMIN_DASHBOARD_USERS_QUERY = gql`
  query AdminDashboardUsers {
    systemUsers(page: 1, limit: 10) {
      items {
        id
        email
        fullName
        primaryRole
        isActive
        isVerified
      }
      total
    }
  }
`;

export const ADMIN_DASHBOARD_ORGANIZATIONS_QUERY = gql`
  query AdminDashboardOrganizations {
    systemOrganizations(page: 1, limit: 10) {
      items {
        id
        tenantId
        name
        type
        status
        logoUrl
      }
      total
    }
  }
`;

export const ADMIN_DASHBOARD_REVIEW_QUEUE_QUERY = gql`
  query AdminDashboardReviewQueue {
    reviewQueue(status: "pending", page: 1, limit: 10) {
      items {
        id
        rating
        comment
        moderationStatus
        reviewerName
        createdAt
      }
      total
    }
  }
`;

export const ADMIN_REVIEW_QUEUE_QUERY = gql`
  query AdminReviewQueue($status: String, $page: Int, $limit: Int) {
    reviewQueue(status: $status, page: $page, limit: $limit) {
      items {
        id
        appointmentId
        providerId
        rating
        comment
        moderationStatus
        providerReply
        providerRepliedAt
        reviewerName
        createdAt
      }
      total
      page
      limit
    }
  }
`;

export const ADMIN_MODERATE_REVIEW_MUTATION = gql`
  mutation AdminModerateReview($reviewId: UUID!, $decision: String!) {
    moderateReview(reviewId: $reviewId, decision: $decision) {
      review {
        id
        moderationStatus
        createdAt
      }
    }
  }
`;

export const ADMIN_PROVIDER_REVIEW_QUEUE_QUERY = gql`
  query AdminProviderReviewQueue($page: Int, $limit: Int) {
    systemProviders(status: "SUBMITTED", page: $page, limit: $limit) {
      items {
        id
        displayName
        hpczNumber
        status
        verificationStatus
        eligible
        createdAt
        organization {
          id
          name
        }
      }
      total
      page
      limit
    }
  }
`;

export const ADMIN_PROVIDERS_QUERY = gql`
  query AdminProviders(
    $search: String
    $status: String
    $tenantId: UUID
    $page: Int
    $limit: Int
  ) {
    systemProviders(
      search: $search
      status: $status
      tenantId: $tenantId
      page: $page
      limit: $limit
    ) {
      items {
        id
        displayName
        hpczNumber
        status
        verificationStatus
        eligible
        createdAt
        organization {
          id
          name
        }
      }
      total
      page
      limit
    }
  }
`;

export const ADMIN_PROVIDER_DETAIL_QUERY = gql`
  query AdminProviderDetail($id: UUID!) {
    providerProfile(id: $id) {
      id
      displayName
      hpczNumber
      bio
      status
      verificationStatus
      profilePictureUrl
      consultationFeeInitial
      consultationFeeFollowup
      specialties
      subSpecialties
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

export const ADMIN_APPROVE_PROVIDER_MUTATION = gql`
  mutation AdminApproveProvider($providerId: UUID!) {
    approveProvider(providerId: $providerId) {
      providerProfile {
        id
        status
        verificationStatus
        eligible
      }
    }
  }
`;

export const ADMIN_APPROVE_PROVIDER_LICENSE_MUTATION = gql`
  mutation AdminApproveProviderLicense($licenseId: UUID!) {
    approveProviderLicense(licenseId: $licenseId) {
      license {
        id
        type
        status
        expiryDate
        issuedAt
        fileUrl
      }
    }
  }
`;

export const ADMIN_REJECT_PROVIDER_LICENSE_MUTATION = gql`
  mutation AdminRejectProviderLicense($licenseId: UUID!, $reason: String) {
    rejectProviderLicense(licenseId: $licenseId, reason: $reason) {
      license {
        id
        type
        status
        expiryDate
        issuedAt
        fileUrl
      }
    }
  }
`;

export const ADMIN_REJECT_PROVIDER_MUTATION = gql`
  mutation AdminRejectProvider($providerId: UUID!, $reason: String!) {
    rejectProvider(providerId: $providerId, reason: $reason) {
      providerProfile {
        id
        status
        verificationStatus
      }
    }
  }
`;

export const ADMIN_SUSPEND_PROVIDER_MUTATION = gql`
  mutation AdminSuspendProvider($providerId: UUID!, $reason: String!) {
    suspendProvider(providerId: $providerId, reason: $reason) {
      providerProfile {
        id
        status
        verificationStatus
        eligible
      }
    }
  }
`;

export const ADMIN_HEADER_QUERY = gql`
  query AdminHeader {
    me {
      id
      email
      fullName
      accountType
      primaryRole
      isStaff
      isSuperuser
      isVerified
    }
  }
`;

export const ADMIN_PCQ_QUESTION_CONTRIBUTIONS_QUERY = gql`
  query AdminPCQQuestionContributions($status: String) {
    pcqQuestionContributions(status: $status, mine: false) {
      id
      templateId
      consultationType
      submittedByProviderId
      submittedByProviderName
      questionText
      questionType
      isRequired
      order
      options
      status
      adminNote
      reviewedAt
      appliedQuestionId
      createdAt
    }
  }
`;

export const ADMIN_APPROVE_PCQ_QUESTION_CONTRIBUTION_MUTATION = gql`
  mutation AdminApprovePCQQuestionContribution(
    $contributionId: UUID!
    $templateId: UUID
    $adminNote: String
  ) {
    approvePcqQuestionContribution(
      contributionId: $contributionId
      templateId: $templateId
      adminNote: $adminNote
    ) {
      contribution {
        id
        status
        adminNote
        appliedQuestionId
        reviewedAt
      }
    }
  }
`;

export const ADMIN_REJECT_PCQ_QUESTION_CONTRIBUTION_MUTATION = gql`
  mutation AdminRejectPCQQuestionContribution($contributionId: UUID!, $adminNote: String) {
    rejectPcqQuestionContribution(contributionId: $contributionId, adminNote: $adminNote) {
      contribution {
        id
        status
        adminNote
        reviewedAt
      }
    }
  }
`;

export const ADMIN_CREATE_PCQ_TEMPLATE_MUTATION = gql`
  mutation AdminCreatePCQTemplate($name: String!, $consultationType: String!, $specialtyId: UUID) {
    createPcqTemplate(name: $name, consultationType: $consultationType, specialtyId: $specialtyId) {
      template {
        id
        name
        consultationType
        status
        specialtyId
        isGlobal
      }
    }
  }
`;

export const ADMIN_CREATE_PCQ_TEMPLATE_VERSION_MUTATION = gql`
  mutation AdminCreatePCQTemplateVersion($templateId: UUID!) {
    createPcqTemplateVersion(templateId: $templateId) {
      templateVersion {
        id
        versionNumber
        isCurrent
        publishedAt
      }
    }
  }
`;

export const ADMIN_ADD_PCQ_QUESTION_MUTATION = gql`
  mutation AdminAddPCQQuestion($versionId: UUID!, $data: PCQQuestionInput!) {
    addPcqQuestion(versionId: $versionId, data: $data) {
      question {
        id
        questionText
        questionType
        isRequired
        order
        options
      }
    }
  }
`;

export const ADMIN_PCQ_TEMPLATES_QUERY = gql`
  query AdminPCQTemplates {
    pcqTemplates {
      id
      name
      consultationType
      status
      specialtyId
      isGlobal
      versions {
        id
        versionNumber
        isCurrent
        publishedAt
      }
    }
  }
`;

export const ADMIN_PCQ_TEMPLATE_DETAIL_QUERY = gql`
  query AdminPCQTemplateDetail($id: UUID!) {
    pcqTemplate(id: $id) {
      id
      name
      consultationType
      status
      specialtyId
      isGlobal
      versions {
        id
        versionNumber
        isCurrent
        publishedAt
        questions {
          id
          questionText
          questionType
          isRequired
          order
          options
        }
      }
    }
  }
`;

export const ADMIN_UPDATE_PCQ_TEMPLATE_MUTATION = gql`
  mutation AdminUpdatePCQTemplate($templateId: UUID!, $data: PCQTemplateUpdateInput!) {
    updatePcqTemplate(templateId: $templateId, data: $data) {
      template {
        id
        name
        consultationType
        status
      }
    }
  }
`;

export const ADMIN_DELETE_PCQ_TEMPLATE_MUTATION = gql`
  mutation AdminDeletePCQTemplate($templateId: UUID!) {
    deletePcqTemplate(templateId: $templateId) {
      ok
    }
  }
`;

export const ADMIN_PUBLISH_PCQ_TEMPLATE_VERSION_MUTATION = gql`
  mutation AdminPublishPCQTemplateVersion($versionId: UUID!) {
    publishPcqTemplateVersion(versionId: $versionId) {
      templateVersion {
        id
        versionNumber
        isCurrent
        publishedAt
      }
    }
  }
`;

export const ADMIN_UPDATE_PCQ_QUESTION_MUTATION = gql`
  mutation AdminUpdatePCQQuestion($questionId: UUID!, $data: PCQQuestionUpdateInput!) {
    updatePcqQuestion(questionId: $questionId, data: $data) {
      question {
        id
        questionText
        questionType
        isRequired
        order
        options
      }
    }
  }
`;

export const ADMIN_DELETE_PCQ_QUESTION_MUTATION = gql`
  mutation AdminDeletePCQQuestion($questionId: UUID!) {
    deletePcqQuestion(questionId: $questionId) {
      ok
    }
  }
`;

export const ADMIN_ORGANIZATIONS_DROPDOWN_QUERY = gql`
  query AdminOrganizationsDropdown {
    systemOrganizations(page: 1, limit: 100) {
      items {
        id
        name
        type
      }
    }
  }
`;

export const ADMIN_CREATE_CORPORATE_ACCOUNT_MUTATION = gql`
  mutation AdminCreateCorporateAccount($data: CorporateAccountInput!) {
    createCorporateAccount(data: $data) {
      corporateAccount {
        id
        organizationId
        name
        status
        createdAt
      }
    }
  }
`;

export const ADMIN_ENROLL_CORPORATE_MEMBER_MUTATION = gql`
  mutation AdminEnrollCorporateMember($corporateId: UUID!, $patientId: UUID!, $employeeId: String) {
    enrollCorporateMember(corporateId: $corporateId, patientId: $patientId, employeeId: $employeeId) {
      membership {
        id
        patientId
        employeeId
        status
        joinedAt
      }
    }
  }
`;

export const ADMIN_CREATE_BENEFIT_PLAN_MUTATION = gql`
  mutation AdminCreateBenefitPlan($corporateId: UUID!, $data: BenefitPlanInput!) {
    createBenefitPlan(corporateId: $corporateId, data: $data) {
      plan {
        id
        corporateId
        maxConsultations
        discountPercentage
        allowedSpecialties
        approvedProviders
        createdAt
      }
    }
  }
`;

export const ADMIN_CORPORATE_MEMBERS_QUERY = gql`
  query AdminCorporateMembers($corporateId: UUID!) {
    corporateMembers(corporateId: $corporateId) {
      id
      patientId
      employeeId
      status
      joinedAt
    }
  }
`;

export const ADMIN_CORPORATE_PLANS_QUERY = gql`
  query AdminCorporatePlans($corporateId: UUID!) {
    corporatePlans(corporateId: $corporateId) {
      id
      corporateId
      maxConsultations
      discountPercentage
      allowedSpecialties
      approvedProviders
      createdAt
    }
  }
`;

export const ADMIN_SYSTEM_NOTIFICATIONS_PREVIEW_QUERY = gql`
  query SystemNotificationsPreview($limit: Int, $tenantId: UUID, $type: String) {
    systemNotificationsPreview(limit: $limit, tenantId: $tenantId, type: $type) {
      unreadCount
      items {
        id
        tenantId
        userId
        userEmail
        title
        message
        type
        isRead
        sourceType
        sourceId
        createdAt
      }
    }
  }
`;

export const ADMIN_SYSTEM_NOTIFICATIONS_QUERY = gql`
  query SystemNotifications(
    $page: Int
    $limit: Int
    $tenantId: UUID
    $userId: UUID
    $type: String
    $isRead: Boolean
  ) {
    systemNotifications(
      page: $page
      limit: $limit
      tenantId: $tenantId
      userId: $userId
      type: $type
      isRead: $isRead
    ) {
      items {
        id
        tenantId
        userId
        userEmail
        title
        message
        type
        isRead
        sourceType
        sourceId
        createdAt
      }
      total
      page
      limit
    }
  }
`;

export const ADMIN_MARK_NOTIFICATION_READ_MUTATION = gql`
  mutation SystemMarkNotificationRead($notificationId: UUID!) {
    systemMarkNotificationRead(notificationId: $notificationId) {
      notification {
        id
        isRead
      }
    }
  }
`;

export const ADMIN_MARK_NOTIFICATIONS_READ_MUTATION = gql`
  mutation SystemMarkNotificationsRead($tenantId: UUID, $userId: UUID, $type: String) {
    systemMarkNotificationsRead(tenantId: $tenantId, userId: $userId, type: $type) {
      updatedCount
    }
  }
`;

export const ADMIN_AUDIT_STATUS_QUERY = gql`
  query AdminAuditStatus {
    auditStatus
  }
`;

export const ADMIN_AUDIT_EVENTS_QUERY = gql`
  query AdminAuditEvents($page: Int, $limit: Int) {
    auditEvents(page: $page, limit: $limit) {
      items {
        id
        actorUserId
        actionType
        entityType
        entityId
        metadata
        ipAddress
        userAgent
        createdAt
      }
      total
      page
      limit
    }
  }
`;

export const ADMIN_ACCESS_LOGS_QUERY = gql`
  query AdminAccessLogs($page: Int, $limit: Int) {
    accessLogs(page: $page, limit: $limit) {
      items {
        id
        actorUserId
        patientId
        entityType
        entityId
        reason
        accessedAt
        createdAt
      }
      total
      page
      limit
    }
  }
`;
