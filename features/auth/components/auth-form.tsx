"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, getGraphQLErrorCode } from "@/features/auth/auth-context";
import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from "@/features/auth/schemas";
import { cn } from "@/lib/utils/cn";

type AuthFormProps = Readonly<{
  mode: "login" | "register";
}>;

type AuthFormValues = {
  fullName?: string;
  email: string;
  password: string;
  accountType?: "CLIENT" | "CONSULTANT";
};

const defaultLoginValues: LoginFormValues = {
  email: "",
  password: "",
};

const defaultRegisterValues: RegisterFormValues = {
  fullName: "",
  email: "",
  password: "",
  accountType: "CLIENT",
};

const accountTypeOptions = [
  {
    value: "CLIENT" as const,
    label: "Patient",
    description: "Track and manage your health",
  },
  {
    value: "CONSULTANT" as const,
    label: "Provider",
    description: "Manage and consult patients",
  },
];

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register: registerAccount } = useAuth();
  const isRegister = mode === "register";
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [helperMessage, setHelperMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
    defaultValues: isRegister ? defaultRegisterValues : defaultLoginValues,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const selectedAccountType = watch("accountType");

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setHelperMessage(null);

    try {
      if (isRegister) {
        const result = await registerAccount({
          email: values.email,
          password: values.password,
          fullName: values.fullName ?? "",
          accountType: values.accountType ?? "CLIENT",
        });

        if (result.verificationRequired) {
          router.push(`/verify-email?email=${encodeURIComponent(result.user.email)}`);
          return;
        }

        router.push("/login");
        return;
      }

      await login({ email: values.email, password: values.password });

      const next = searchParams?.get("next");
      if (next) {
        router.push(next);
        return;
      }

      router.push("/auth/redirect");
    } catch (error) {
      const code = getGraphQLErrorCode(error);

      if (code === "AUTH_INVALID_CREDENTIALS") {
        setSubmitError("Incorrect email or password.");
        return;
      }

      if (code === "AUTH_USER_NOT_VERIFIED") {
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
        return;
      }

      if (code === "AUTH_USER_INACTIVE") {
        setSubmitError("This account is inactive.");
        return;
      }

      if (code === "AUTH_ACCOUNT_LOCKED") {
        setSubmitError("This account is locked. Try again later.");
        return;
      }

      setSubmitError(
        isRegister ? "Unable to create your account right now." : "Unable to sign in right now.",
      );
    }
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {submitError ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {submitError}
        </div>
      ) : null}

      {helperMessage ? (
        <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-text">
          {helperMessage}
        </div>
      ) : null}

      {isRegister ? (
        <div className="space-y-2">
          <Label>Account type</Label>
          <div className="grid grid-cols-2 gap-3">
            {accountTypeOptions.map(({ value, label, description }) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue("accountType", value)}
                className={cn(
                  "rounded-xl border p-4 text-left transition",
                  selectedAccountType === value
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-surface hover:bg-slate-50",
                )}
              >
                <p className="text-sm font-medium text-text">{label}</p>
                <p className="mt-0.5 text-xs text-muted">{description}</p>
              </button>
            ))}
          </div>
          {"accountType" in errors ? (
            <p className="text-sm text-danger">{errors.accountType?.message}</p>
          ) : null}
        </div>
      ) : null}

      {isRegister ? (
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" placeholder="Jane Doe" {...register("fullName")} />
          {"fullName" in errors ? (
            <p className="text-sm text-danger">{errors.fullName?.message}</p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" placeholder="jane@example.com" {...register("email")} />
        {errors.email?.message ? (
          <p className="text-sm text-danger">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          {!isRegister ? (
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary underline underline-offset-4"
            >
              Forgot password?
            </Link>
          ) : null}
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="pr-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-text"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password?.message ? (
          <p className="text-sm text-danger">{errors.password.message}</p>
        ) : null}
      </div>

      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
      </Button>

      <div className="text-center text-sm text-muted">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary underline underline-offset-4">
              Sign in
            </Link>
          </>
        ) : (
          <>
            Need an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary underline underline-offset-4"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </form>
  );
}
