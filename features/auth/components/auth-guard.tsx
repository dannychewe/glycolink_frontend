"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getUserAccountType,
  getUserAudienceValues,
  isSystemAdminUser,
  useAuth,
  type AuthRole,
} from "@/features/auth/auth-context";

type AuthGuardProps = Readonly<{
  children: React.ReactNode;
  allowedRoles?: AuthRole[];
  requireSystemAdmin?: boolean;
}>;

export function AuthGuard({ children, allowedRoles, requireSystemAdmin = false }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, postLoginRedirect, getDefaultAuthenticatedRoute } = useAuth();

  const canAccess = requireSystemAdmin
    ? isSystemAdminUser(user)
    : !allowedRoles || allowedRoles.some((role) => getUserAudienceValues(user).includes(role));

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!user) {
      const next = encodeURIComponent(pathname ?? "");
      router.replace(`/login?next=${next}`);
      return;
    }

    if (!user.isVerified) {
      router.replace(`/verify-email?email=${encodeURIComponent(user.email)}`);
      return;
    }

    if (!canAccess) {
      router.replace(getDefaultAuthenticatedRoute());
      return;
    }

    if (
      getUserAccountType(user) === "CONSULTANT" &&
      postLoginRedirect?.reason === "PROVIDER_ONBOARDING" &&
      pathname !== "/consultant/onboarding"
    ) {
      router.replace("/consultant/onboarding");
      return;
    }

    if (
      getUserAccountType(user) === "PATIENT" &&
      (postLoginRedirect?.reason === "PATIENT_ONBOARDING" ||
        postLoginRedirect?.reason === "PROFILE_MISSING") &&
      pathname === "/patient/dashboard"
    ) {
      router.replace("/patient/onboarding");
    }
  }, [canAccess, getDefaultAuthenticatedRoute, pathname, postLoginRedirect?.reason, router, status, user]);

  if (status === "loading") {
    return <div className="px-6 py-10 text-sm text-muted">Loading your session...</div>;
  }

  if (!user || !user.isVerified) {
    return null;
  }

  if (!canAccess) {
    return null;
  }

  if (
    getUserAccountType(user) === "CONSULTANT" &&
    postLoginRedirect?.reason === "PROVIDER_ONBOARDING" &&
    pathname !== "/consultant/onboarding"
  ) {
    return null;
  }

  if (
    getUserAccountType(user) === "PATIENT" &&
    (postLoginRedirect?.reason === "PATIENT_ONBOARDING" ||
      postLoginRedirect?.reason === "PROFILE_MISSING") &&
    pathname === "/patient/dashboard"
  ) {
    return null;
  }

  return <>{children}</>;
}
