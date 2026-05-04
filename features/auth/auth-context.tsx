"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useApolloClient } from "@apollo/client";
import type { ApolloClient } from "@apollo/client";
import {
  MY_PATIENT_PROFILE_QUERY,
  MY_PROVIDER_PROFILE_QUERY,
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  ME_QUERY,
  POST_LOGIN_REDIRECT_QUERY,
  REQUEST_PASSWORD_RESET_MUTATION,
  REGISTER_MUTATION,
  RESET_PASSWORD_MUTATION,
  RESEND_VERIFICATION_MUTATION,
  VERIFY_EMAIL_MUTATION,
} from "@/lib/auth/graphql";
import { clearStoredTokens, getStoredTokens, setStoredTokens, subscribeToAuthChanges } from "@/lib/auth/storage";
import { getGraphQLErrorCode, refreshSessionTokens } from "@/lib/auth/session";

const USER_CACHE_KEY = "glycolink.user";

function cacheUser(user: AuthUser) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  }
}

function getCachedUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function clearCachedUser() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(USER_CACHE_KEY);
  }
}

export type AuthRole =
  | "CLIENT"
  | "PATIENT"
  | "STANDARD_USER"
  | "CONSULTANT"
  | "ADMIN"
  | string;

export type AuthAccountType = "PATIENT" | "CONSULTANT" | "ADMIN" | "UNKNOWN" | string;

export type AuthUser = {
  id: string;
  email: string;
  fullName?: string | null;
  primaryRole: AuthRole;
  accountType?: AuthAccountType | null;
  isStaff?: boolean | null;
  isSuperuser?: boolean | null;
  isVerified: boolean;
};

type PatientProfile = {
  id: string;
  onboardingStatus: string | null;
  profileComplete: boolean | null;
};

type ProviderProfile = {
  id: string;
  lifecycleStatus: string | null;
  verificationStatus: string | null;
};

type PostLoginRedirect = {
  route: string;
  reason: string;
  accountType: string | null;
};

type AuthStatus = "loading" | "authenticated" | "anonymous";

type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  accountType: "CLIENT" | "CONSULTANT";
};

type RegisterResult = {
  user: AuthUser;
  verificationRequired: boolean;
  verificationToken?: string | null;
};

type ResendVerificationResult = {
  success: boolean;
  verificationToken?: string | null;
};

type RequestPasswordResetResult = {
  success: boolean;
  resetToken?: string | null;
};

type ResetPasswordResult = {
  success: boolean;
};

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  patientProfile: PatientProfile | null;
  providerProfile: ProviderProfile | null;
  postLoginRedirect: PostLoginRedirect | null;
  isAuthenticated: boolean;
  login: (input: { email: string; password: string }) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<RegisterResult>;
  verifyEmail: (token: string) => Promise<AuthUser | null>;
  resendVerification: (email: string) => Promise<ResendVerificationResult>;
  requestPasswordReset: (email: string) => Promise<RequestPasswordResetResult>;
  resetPassword: (token: string, newPassword: string) => Promise<ResetPasswordResult>;
  logout: () => Promise<void>;
  bootstrapSession: () => Promise<AuthUser | null>;
  getDefaultAuthenticatedRoute: () => string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isPatientRole(role?: string | null) {
  return role === "CLIENT" || role === "PATIENT" || role === "STANDARD_USER";
}

function normalizeAccountType(value?: string | null): AuthAccountType {
  if (!value) return "UNKNOWN";
  if (value === "CLIENT") return "PATIENT";
  return value;
}

function roleToAccountType(role?: string | null): AuthAccountType {
  if (role === "ADMIN" || role === "platform_admin") return "ADMIN";
  if (role === "CONSULTANT") return "CONSULTANT";
  if (isPatientRole(role)) return "PATIENT";
  return "UNKNOWN";
}

export function getUserAccountType(user?: AuthUser | null): AuthAccountType {
  if (!user) return "UNKNOWN";

  if (isSystemAdminUser(user)) {
    return "ADMIN";
  }

  const normalized = normalizeAccountType(user.accountType);
  if (normalized !== "UNKNOWN") {
    return normalized;
  }

  return roleToAccountType(user.primaryRole);
}

function withResolvedAccountType(user: AuthUser): AuthUser {
  return {
    ...user,
    accountType: getUserAccountType(user),
  };
}

export function getUserAudienceValues(user?: AuthUser | null): string[] {
  if (!user) return [];

  const values = new Set<string>();
  values.add(user.primaryRole);

  if (user.accountType) {
    values.add(user.accountType);
  }

  const accountType = getUserAccountType(user);
  values.add(accountType);

  if (accountType === "PATIENT") {
    values.add("CLIENT");
    values.add("PATIENT");
    values.add("STANDARD_USER");
  }

  if (isSystemAdminUser(user)) {
    values.add("ADMIN");
    values.add("platform_admin");
    values.add("SYSTEM_ADMIN");
  }

  return Array.from(values);
}

export function isSystemAdminUser(user?: AuthUser | null) {
  return user?.primaryRole === "platform_admin" || user?.isSuperuser === true;
}

function isRouteAllowedForAccountType(route: string, accountType: AuthAccountType) {
  if (route.startsWith("/patient")) {
    return accountType === "PATIENT";
  }

  if (route.startsWith("/consultant")) {
    return accountType === "CONSULTANT";
  }

  if (route.startsWith("/admin")) {
    return accountType === "ADMIN";
  }

  return true;
}

function fallbackRouteForAccountType(accountType: AuthAccountType) {
  if (accountType === "ADMIN") {
    return "/";
  }

  if (accountType === "CONSULTANT") {
    return "/consultant/dashboard";
  }

  if (accountType === "PATIENT") {
    return "/patient/dashboard";
  }

  return "/";
}

function isLikelyAuthFailure(error: unknown) {
  const code = getGraphQLErrorCode(error);
  if (
    code === "AUTH_TOKEN_INVALID" ||
    code === "AUTH_TOKEN_EXPIRED" ||
    code === "AUTH_SESSION_REVOKED" ||
    code === "AUTH_USER_INACTIVE" ||
    code === "UNAUTHENTICATED" ||
    code === "AUTHENTICATION_FAILED"
  ) {
    return true;
  }

  const message = (
    (error as { graphQLErrors?: Array<{ message?: unknown }> } | null)?.graphQLErrors?.[0]
      ?.message ?? ""
  )
    .toString()
    .toLowerCase();

  return message.includes("token") && (message.includes("expired") || message.includes("invalid"));
}

async function fetchPostLoginRedirect(client: ApolloClient<object>) {
  const result = await client.query<{
    postLoginRedirect: PostLoginRedirect | null;
  }>({
    query: POST_LOGIN_REDIRECT_QUERY,
    fetchPolicy: "network-only",
  });

  return result.data.postLoginRedirect;
}

async function fetchAuthenticatedUser(client: ApolloClient<object>) {
  const result = await client.query<{
    me: AuthUser | null;
  }>({
    query: ME_QUERY,
    fetchPolicy: "network-only",
  });

  return result.data.me;
}

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const client = useApolloClient();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [postLoginRedirect, setPostLoginRedirect] = useState<PostLoginRedirect | null>(null);

  const resetSessionState = useCallback(() => {
    setUser(null);
    setPatientProfile(null);
    setProviderProfile(null);
    setPostLoginRedirect(null);
    setStatus("anonymous");
  }, []);

  const bootstrapSession = useCallback(async () => {
    const tokens = getStoredTokens();

    if (!tokens) {
      resetSessionState();
      return null;
    }

    setStatus("loading");

    try {
      const activeTokens = tokens.token ? tokens : await refreshSessionTokens();

      if (!activeTokens) {
        resetSessionState();
        return null;
      }

      const currentUser = await fetchAuthenticatedUser(client);

      if (!currentUser) {
        resetSessionState();
        return null;
      }

      const normalizedUser = withResolvedAccountType(currentUser);
      setUser(normalizedUser);

      if (normalizedUser.isVerified) {
        const accountType = getUserAccountType(normalizedUser);

        if (accountType === "PATIENT") {
          try {
            const profileResult = await client.query<{
              myPatientProfile: PatientProfile | null;
            }>({ query: MY_PATIENT_PROFILE_QUERY, fetchPolicy: "network-only" });
            setPatientProfile(profileResult.data.myPatientProfile);
          } catch {
            setPatientProfile(null);
          }
          setProviderProfile(null);
        } else if (accountType === "CONSULTANT") {
          try {
            const profileResult = await client.query<{
              myProviderProfile: ProviderProfile | null;
            }>({ query: MY_PROVIDER_PROFILE_QUERY, fetchPolicy: "network-only" });
            setProviderProfile(profileResult.data.myProviderProfile);
          } catch {
            setProviderProfile(null);
          }
          setPatientProfile(null);
        } else {
          setPatientProfile(null);
          setProviderProfile(null);
        }

        try {
          const redirect = await fetchPostLoginRedirect(client);
          setPostLoginRedirect(redirect);
        } catch {
          setPostLoginRedirect(null);
        }
      } else {
        setPatientProfile(null);
        setProviderProfile(null);
        setPostLoginRedirect(null);
      }

      setStatus("authenticated");
      cacheUser(normalizedUser);
      return normalizedUser;
    } catch (error) {
      const code = getGraphQLErrorCode(error);
      if (isLikelyAuthFailure(error) || code === "AUTH_USER_INACTIVE") {
        clearStoredTokens();
        clearCachedUser();
        resetSessionState();
        return null;
      }
      // Network error — restore from cache so a hard refresh doesn't log the user out
      const cached = getCachedUser();
      if (cached) {
        const normalizedCachedUser = withResolvedAccountType(cached);
        setUser(normalizedCachedUser);
        setStatus("authenticated");
        cacheUser(normalizedCachedUser);
        return normalizedCachedUser;
      }
      resetSessionState();
      return null;
    }
  }, [client, resetSessionState]);

  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);

  useEffect(() => {
    return subscribeToAuthChanges(() => {
      if (!getStoredTokens()) {
        resetSessionState();
      }
    });
  }, [resetSessionState]);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      const result = await client.mutate<{
        login: {
          token: string;
          refreshToken: string;
          user: AuthUser;
        };
      }>({
        mutation: LOGIN_MUTATION,
        variables: { email, password },
      });

      const payload = result.data?.login;

      if (!payload) {
        throw new Error("Login response was empty.");
      }

      setStoredTokens({
        token: payload.token,
        refreshToken: payload.refreshToken,
        refreshExpiresIn: null,
      });

      const currentUser = await fetchAuthenticatedUser(client);

      if (!currentUser) {
        throw new Error("Login succeeded but current user could not be loaded.");
      }

      const normalizedUser = withResolvedAccountType(currentUser);
      setUser(normalizedUser);
      setStatus("authenticated");
      cacheUser(normalizedUser);

      if (normalizedUser.isVerified) {
        const accountType = getUserAccountType(normalizedUser);

        if (accountType === "PATIENT") {
          try {
            const profileResult = await client.query<{
              myPatientProfile: PatientProfile | null;
            }>({ query: MY_PATIENT_PROFILE_QUERY, fetchPolicy: "network-only" });
            setPatientProfile(profileResult.data.myPatientProfile);
          } catch {
            setPatientProfile(null);
          }
          setProviderProfile(null);
        } else if (accountType === "CONSULTANT") {
          try {
            const profileResult = await client.query<{
              myProviderProfile: ProviderProfile | null;
            }>({ query: MY_PROVIDER_PROFILE_QUERY, fetchPolicy: "network-only" });
            setProviderProfile(profileResult.data.myProviderProfile);
          } catch {
            setProviderProfile(null);
          }
          setPatientProfile(null);
        } else {
          setPatientProfile(null);
          setProviderProfile(null);
        }

        try {
          const redirect = await fetchPostLoginRedirect(client);
          setPostLoginRedirect(redirect);
        } catch {
          setPostLoginRedirect(null);
        }
      }

      return normalizedUser;
    },
    [client],
  );

  const register = useCallback(
    async ({ email, password, fullName, accountType }: RegisterInput) => {
      const result = await client.mutate<{
        register: RegisterResult;
      }>({
        mutation: REGISTER_MUTATION,
        variables: {
          email,
          password,
          fullName,
          accountType,
        },
      });

      const payload = result.data?.register;

      if (!payload) {
        throw new Error("Registration response was empty.");
      }

      return payload;
    },
    [client],
  );

  const verifyEmail = useCallback(
    async (token: string) => {
      const result = await client.mutate<{
        verify: {
          user: AuthUser | null;
        };
      }>({
        mutation: VERIFY_EMAIL_MUTATION,
        variables: { token },
      });

      const verifiedUser = result.data?.verify?.user ?? null;

      if (verifiedUser && user?.id === verifiedUser.id) {
        const normalizedUser = withResolvedAccountType(verifiedUser);
        setUser(normalizedUser);
        cacheUser(normalizedUser);
        await bootstrapSession();
      }

      return verifiedUser;
    },
    [bootstrapSession, client, user?.id],
  );

  const resendVerification = useCallback(
    async (email: string) => {
      const result = await client.mutate<{
        resendVerification: ResendVerificationResult;
      }>({
        mutation: RESEND_VERIFICATION_MUTATION,
        variables: { email },
      });

      return result.data?.resendVerification ?? { success: false };
    },
    [client],
  );

  const logout = useCallback(async () => {
    const tokens = getStoredTokens();

    try {
      if (tokens?.refreshToken) {
        await client.mutate({
          mutation: LOGOUT_MUTATION,
          variables: {
            refreshToken: tokens.refreshToken,
          },
        });
      }
    } catch {
      // Clear the local session even if the backend session has already expired.
    } finally {
      clearStoredTokens();
      clearCachedUser();
      await client.clearStore();
      resetSessionState();
    }
  }, [client, resetSessionState]);

  const requestPasswordReset = useCallback(
    async (email: string) => {
      const result = await client.mutate<{
        requestPasswordReset: RequestPasswordResetResult;
      }>({
        mutation: REQUEST_PASSWORD_RESET_MUTATION,
        variables: { email },
      });

      return result.data?.requestPasswordReset ?? { success: false };
    },
    [client],
  );

  const resetPassword = useCallback(
    async (token: string, newPassword: string) => {
      const result = await client.mutate<{
        resetPassword: ResetPasswordResult;
      }>({
        mutation: RESET_PASSWORD_MUTATION,
        variables: { token, newPassword },
      });

      return result.data?.resetPassword ?? { success: false };
    },
    [client],
  );

  const getDefaultAuthenticatedRoute = useCallback(() => {
    if (!user) {
      return "/";
    }

    if (!user.isVerified) {
      return `/verify-email?email=${encodeURIComponent(user.email)}`;
    }

    if (isSystemAdminUser(user)) {
      return "/admin";
    }

    const accountType = getUserAccountType(user);

    if (accountType === "PATIENT") {
      if (
        postLoginRedirect?.reason === "PATIENT_ONBOARDING" ||
        postLoginRedirect?.reason === "PROFILE_MISSING"
      ) {
        return "/patient/onboarding";
      }
    }

    if (postLoginRedirect?.reason === "PROVIDER_ONBOARDING" && accountType === "CONSULTANT") {
      return "/consultant/dashboard";
    }

    if (
      postLoginRedirect?.route &&
      (!postLoginRedirect.route.startsWith("/admin") || isSystemAdminUser(user)) &&
      isRouteAllowedForAccountType(postLoginRedirect.route, accountType)
    ) {
      return postLoginRedirect.route;
    }

    return fallbackRouteForAccountType(accountType);
  }, [postLoginRedirect?.reason, postLoginRedirect?.route, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      patientProfile,
      providerProfile,
      postLoginRedirect,
      isAuthenticated: status === "authenticated" && !!user,
      login,
      register,
      verifyEmail,
      resendVerification,
      requestPasswordReset,
      resetPassword,
      logout,
      bootstrapSession,
      getDefaultAuthenticatedRoute,
    }),
    [
      bootstrapSession,
      getDefaultAuthenticatedRoute,
      login,
      logout,
      patientProfile,
      postLoginRedirect,
      providerProfile,
      requestPasswordReset,
      register,
      resetPassword,
      resendVerification,
      status,
      user,
      verifyEmail,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}

export { getGraphQLErrorCode };
