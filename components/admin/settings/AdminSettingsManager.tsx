"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { AlertCircle, CheckCircle, Settings2, X } from "lucide-react";
import {
  ADMIN_PLATFORM_SETTINGS_QUERY,
  ADMIN_UPDATE_PLATFORM_SETTINGS_MUTATION,
} from "@/lib/admin/graphql";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlatformSettings = {
  id: string;
  platformName: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  defaultCountry: string | null;
  defaultTimezone: string | null;
  brandingJson: Record<string, unknown> | null;
  securityPolicyJson: Record<string, unknown> | null;
  notificationTemplatesJson: Record<string, unknown> | null;
  integrationSettingsJson: Record<string, unknown> | null;
  featureFlagsJson: Record<string, unknown> | null;
  maintenanceModeEnabled: boolean;
  maintenanceMessage: string | null;
  updatedAt: string | null;
};

type SettingsData = { platformSettings: PlatformSettings | null };

type AlertState = { type: "success" | "error"; message: string } | null;

type FeatureFlags = {
  videoCalls: boolean;
  deviceSync: boolean;
  pharmacyOrders: boolean;
  insuranceClaims: boolean;
  aiRiskScoring: boolean;
};

type SecurityPolicy = {
  requireTwoFactorForAdmins: boolean;
  sessionTimeoutMinutes: number;
};

type IntegrationSettings = {
  emailProvider: string;
  smsProvider: string;
};

type FormState = {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  defaultCountry: string;
  defaultTimezone: string;
  maintenanceModeEnabled: boolean;
  maintenanceMessage: string;
  brandingPrimaryColor: string;
  patientInviteSubject: string;
  featureFlags: FeatureFlags;
  securityPolicy: SecurityPolicy;
  integrationSettings: IntegrationSettings;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeString(val: unknown): string {
  return typeof val === "string" ? val : "";
}

function safeBool(val: unknown, fallback = false): boolean {
  return typeof val === "boolean" ? val : fallback;
}

function safeInt(val: unknown, fallback: number): number {
  return typeof val === "number" ? val : fallback;
}

function settingsToForm(s: PlatformSettings): FormState {
  const branding = s.brandingJson ?? {};
  const security = s.securityPolicyJson ?? {};
  const integration = s.integrationSettingsJson ?? {};
  const templates = s.notificationTemplatesJson ?? {};
  const flags = s.featureFlagsJson ?? {};
  const patientInvite = (templates.patientInvite ?? {}) as Record<string, unknown>;

  return {
    platformName: s.platformName ?? "",
    supportEmail: s.supportEmail ?? "",
    supportPhone: s.supportPhone ?? "",
    defaultCountry: s.defaultCountry ?? "",
    defaultTimezone: s.defaultTimezone ?? "",
    maintenanceModeEnabled: s.maintenanceModeEnabled,
    maintenanceMessage: s.maintenanceMessage ?? "",
    brandingPrimaryColor: safeString(branding.primaryColor) || "#1565C0",
    patientInviteSubject: safeString(patientInvite.subject),
    featureFlags: {
      videoCalls: safeBool(flags.videoCalls),
      deviceSync: safeBool(flags.deviceSync),
      pharmacyOrders: safeBool(flags.pharmacyOrders),
      insuranceClaims: safeBool(flags.insuranceClaims),
      aiRiskScoring: safeBool(flags.aiRiskScoring),
    },
    securityPolicy: {
      requireTwoFactorForAdmins: safeBool(security.requireTwoFactorForAdmins),
      sessionTimeoutMinutes: safeInt(security.sessionTimeoutMinutes, 60),
    },
    integrationSettings: {
      emailProvider: safeString(integration.emailProvider) || "smtp",
      smsProvider: safeString(integration.smsProvider) || "manual",
    },
  };
}

function formToVariables(form: FormState) {
  return {
    platformName: form.platformName || null,
    supportEmail: form.supportEmail || null,
    supportPhone: form.supportPhone || null,
    defaultCountry: form.defaultCountry || null,
    defaultTimezone: form.defaultTimezone || null,
    maintenanceModeEnabled: form.maintenanceModeEnabled,
    maintenanceMessage: form.maintenanceMessage || null,
    brandingJson: JSON.stringify({
      primaryColor: form.brandingPrimaryColor || null,
    }),
    securityPolicyJson: JSON.stringify({
      requireTwoFactorForAdmins: form.securityPolicy.requireTwoFactorForAdmins,
      sessionTimeoutMinutes: form.securityPolicy.sessionTimeoutMinutes,
    }),
    notificationTemplatesJson: JSON.stringify({
      patientInvite: {
        subject: form.patientInviteSubject || null,
      },
    }),
    integrationSettingsJson: JSON.stringify({
      emailProvider: form.integrationSettings.emailProvider,
      smsProvider: form.integrationSettings.smsProvider,
    }),
    featureFlagsJson: JSON.stringify({ ...form.featureFlags }),
  };
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Never";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InlineAlert({ alert, onDismiss }: { alert: AlertState; onDismiss: () => void }) {
  if (!alert) return null;
  const isError = alert.type === "error";
  return (
    <div className={cn(
      "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
      isError
        ? "border-danger/30 bg-danger/5 text-danger"
        : "border-success/30 bg-success/5 text-success",
    )}>
      {isError
        ? <AlertCircle className="mt-0.5 size-4 shrink-0" />
        : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="size-4" />
      </button>
    </div>
  );
}

function Toggle({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <div className="relative mt-0.5 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={cn(
          "h-5 w-9 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-border",
        )}>
          <div className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          )} />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-text">{label}</p>
        {description ? <p className="text-xs text-muted">{description}</p> : null}
      </div>
    </label>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const FEATURE_FLAG_META: { key: keyof FeatureFlags; label: string; description: string }[] = [
  { key: "videoCalls", label: "Video Calls", description: "Enable in-platform video consultations" },
  { key: "deviceSync", label: "Device Sync", description: "Allow patient device data synchronisation" },
  { key: "pharmacyOrders", label: "Pharmacy Orders", description: "Enable pharmacy order creation from encounters" },
  { key: "insuranceClaims", label: "Insurance Claims", description: "Enable insurance claims workflow" },
  { key: "aiRiskScoring", label: "AI Risk Scoring", description: "Enable AI-assisted patient risk scoring" },
];

export function AdminSettingsManager() {
  const [alert, setAlert] = useState<AlertState>(null);
  const [form, setForm] = useState<FormState | null>(null);

  const { data, loading, error } = useQuery<SettingsData>(ADMIN_PLATFORM_SETTINGS_QUERY, {
    fetchPolicy: "network-only",
  });

  const [updateSettings, { loading: saving }] = useMutation(
    ADMIN_UPDATE_PLATFORM_SETTINGS_MUTATION,
  );

  useEffect(() => {
    if (data?.platformSettings) {
      setForm(settingsToForm(data.platformSettings));
    }
  }, [data]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function setFlag(key: keyof FeatureFlags, value: boolean) {
    setForm((prev) => prev
      ? { ...prev, featureFlags: { ...prev.featureFlags, [key]: value } }
      : prev);
  }

  function setSecurity<K extends keyof SecurityPolicy>(key: K, value: SecurityPolicy[K]) {
    setForm((prev) => prev
      ? { ...prev, securityPolicy: { ...prev.securityPolicy, [key]: value } }
      : prev);
  }

  function setIntegration<K extends keyof IntegrationSettings>(key: K, value: IntegrationSettings[K]) {
    setForm((prev) => prev
      ? { ...prev, integrationSettings: { ...prev.integrationSettings, [key]: value } }
      : prev);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setAlert(null);
    try {
      await updateSettings({ variables: { data: formToVariables(form) } });
      setAlert({ type: "success", message: "Platform settings saved successfully." });
    } catch (err) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(err, "Failed to save settings. Please try again.") });
    }
  }

  const settings = data?.platformSettings ?? null;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Admin Workspace
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-text sm:text-4xl">System Settings</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Platform-level configuration for system admins and superusers. Changes apply globally
              and are not tenant-scoped.
            </p>
          </div>
          {settings?.updatedAt ? (
            <Badge variant="secondary">Last saved {formatDate(settings.updatedAt)}</Badge>
          ) : null}
        </div>
      </header>

      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      {error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {getGraphQLErrorMessage(error, "Unable to load platform settings.")}
        </div>
      ) : null}

      {loading || !form ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-border/40" />
          ))}
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          {/* Platform Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="size-4 text-primary" />
                Platform Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="platformName">Platform name</Label>
                <Input
                  id="platformName"
                  value={form.platformName}
                  onChange={(e) => set("platformName", e.target.value)}
                  placeholder="Naje Health"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={form.supportEmail}
                  onChange={(e) => set("supportEmail", e.target.value)}
                  placeholder="support@najehealth.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportPhone">Support phone</Label>
                <Input
                  id="supportPhone"
                  value={form.supportPhone}
                  onChange={(e) => set("supportPhone", e.target.value)}
                  placeholder="+260000000000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultCountry">Default country</Label>
                <Input
                  id="defaultCountry"
                  value={form.defaultCountry}
                  onChange={(e) => set("defaultCountry", e.target.value)}
                  placeholder="Zambia"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="defaultTimezone">Default timezone</Label>
                <Input
                  id="defaultTimezone"
                  value={form.defaultTimezone}
                  onChange={(e) => set("defaultTimezone", e.target.value)}
                  placeholder="Africa/Lusaka"
                />
              </div>
            </CardContent>
          </Card>

          {/* Feature Flags */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <p className="text-sm text-muted">
                Toggle platform-wide features. Changes take effect immediately for all tenants.
              </p>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURE_FLAG_META.map(({ key, label, description }) => (
                <Toggle
                  key={key}
                  id={`flag-${key}`}
                  checked={form.featureFlags[key]}
                  onChange={(val) => setFlag(key, val)}
                  label={label}
                  description={description}
                />
              ))}
            </CardContent>
          </Card>

          {/* Maintenance */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Mode</CardTitle>
              <p className="text-sm text-muted">
                When enabled, the platform shows a maintenance message to all users.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Toggle
                id="maintenanceModeEnabled"
                checked={form.maintenanceModeEnabled}
                onChange={(val) => set("maintenanceModeEnabled", val)}
                label="Enable maintenance mode"
                description="All non-admin users will see the maintenance message"
              />
              {form.maintenanceModeEnabled ? (
                <div className="space-y-2">
                  <Label htmlFor="maintenanceMessage">Maintenance message</Label>
                  <Input
                    id="maintenanceMessage"
                    value={form.maintenanceMessage}
                    onChange={(e) => set("maintenanceMessage", e.target.value)}
                    placeholder="We are currently performing scheduled maintenance. Back soon."
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Security Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Security Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Toggle
                id="requireTwoFactor"
                checked={form.securityPolicy.requireTwoFactorForAdmins}
                onChange={(val) => setSecurity("requireTwoFactorForAdmins", val)}
                label="Require two-factor for admins"
                description="Force all system admin accounts to use two-factor authentication"
              />
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min={5}
                  max={1440}
                  value={form.securityPolicy.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setSecurity("sessionTimeoutMinutes", Number(e.target.value))
                  }
                  className="max-w-[160px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Integrations */}
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emailProvider">Email provider</Label>
                <select
                  id="emailProvider"
                  value={form.integrationSettings.emailProvider}
                  onChange={(e) => setIntegration("emailProvider", e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="smtp">SMTP</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="ses">Amazon SES</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smsProvider">SMS provider</Label>
                <select
                  id="smsProvider"
                  value={form.integrationSettings.smsProvider}
                  onChange={(e) => setIntegration("smsProvider", e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="manual">Manual</option>
                  <option value="twilio">Twilio</option>
                  <option value="africas_talking">Africa&apos;s Talking</option>
                  <option value="vonage">Vonage</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="brandingColor">Primary color</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="brandingColor"
                    type="color"
                    value={form.brandingPrimaryColor}
                    onChange={(e) => set("brandingPrimaryColor", e.target.value)}
                    className="h-11 w-14 cursor-pointer rounded-xl border border-border bg-background p-1"
                  />
                  <Input
                    value={form.brandingPrimaryColor}
                    onChange={(e) => set("brandingPrimaryColor", e.target.value)}
                    placeholder="#1565C0"
                    className="w-32 font-mono uppercase"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientInviteSubject">Patient invite — email subject</Label>
                <Input
                  id="patientInviteSubject"
                  value={form.patientInviteSubject}
                  onChange={(e) => set("patientInviteSubject", e.target.value)}
                  placeholder="You have been invited to Naje Health"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-4">
            <p className="text-sm text-muted">
              Changes are applied globally across all tenants and take effect immediately.
            </p>
            <Button type="submit" disabled={saving} className="shrink-0">
              {saving ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
