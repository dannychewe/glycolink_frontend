"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Building2, CalendarClock, LayoutList, MapPin, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MY_CONSULTANT_ORGANIZATIONS_QUERY,
  UPDATE_ORGANIZATION_MUTATION,
} from "@/lib/consultant/organization-graphql";
import {
  CONSULTANT_APPOINTMENT_POLICY_QUERY,
  CONSULTANT_UPDATE_APPOINTMENT_POLICY_MUTATION,
  CONSULTANT_ORG_DEPARTMENTS_QUERY,
  CONSULTANT_UPSERT_DEPARTMENT_MUTATION,
  CONSULTANT_ORG_LOCATIONS_QUERY,
  CONSULTANT_NOTIFICATION_PREFERENCES_QUERY,
  CONSULTANT_UPDATE_NOTIFICATION_PREFERENCES_MUTATION,
} from "@/lib/consultant/settings-graphql";

type Tab = "organization" | "appointment-policy" | "departments" | "locations" | "notifications";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "appointment-policy", label: "Appointment Policy", icon: CalendarClock },
  { id: "departments", label: "Departments", icon: LayoutList },
  { id: "locations", label: "Locations", icon: MapPin },
  { id: "notifications", label: "Notifications", icon: Bell },
];

function InlineAlert({
  tone,
  message,
}: Readonly<{ tone: "success" | "error"; message: string | null }>) {
  if (!message) return null;
  return (
    <p
      className={`text-sm ${tone === "success" ? "text-success" : "text-danger"}`}
    >
      {message}
    </p>
  );
}

function Toggle({
  checked,
  onChange,
}: Readonly<{ checked: boolean; onChange: (v: boolean) => void }>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
        checked ? "bg-primary" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block size-5 rounded-full bg-white shadow-soft transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: Readonly<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}>) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ─── Organization Tab ────────────────────────────────────────────────────────

type OrgForm = {
  name: string;
  type: string;
  regulatoryId: string;
  description: string;
  email: string;
  phone: string;
  website: string;
};

function OrganizationTab({ orgId }: { orgId: string }) {
  const { data, loading } = useQuery(MY_CONSULTANT_ORGANIZATIONS_QUERY, {
    fetchPolicy: "network-only",
  });

  const org = data?.myConsultantOrganizations?.find(
    (o: { id: string }) => o.id === orgId,
  );

  const [form, setForm] = useState<OrgForm>({
    name: "",
    type: "",
    regulatoryId: "",
    description: "",
    email: "",
    phone: "",
    website: "",
  });

  const [initialized, setInitialized] = useState(false);

  if (org && !initialized) {
    setInitialized(true);
    setForm({
      name: org.name ?? "",
      type: org.type ?? "",
      regulatoryId: org.regulatoryId ?? "",
      description: (org as { description?: string }).description ?? "",
      email: (org as { email?: string }).email ?? "",
      phone: (org as { phone?: string }).phone ?? "",
      website: (org as { website?: string }).website ?? "",
    });
  }

  const [updateOrg, { loading: saving }] = useMutation(UPDATE_ORGANIZATION_MUTATION);
  const [status, setStatus] = useState<{ tone: "success" | "error"; msg: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      await updateOrg({
        variables: {
          organizationId: orgId,
          data: {
            name: form.name,
            type: form.type,
            regulatoryId: form.regulatoryId || null,
            description: form.description || null,
            email: form.email || null,
            phone: form.phone || null,
            website: form.website || null,
          },
        },
      });
      setStatus({ tone: "success", msg: "Organization settings saved." });
    } catch {
      setStatus({ tone: "error", msg: "Failed to save organization settings." });
    }
  }

  function field(key: keyof OrgForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-border/40" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization Name</Label>
          <Input id="org-name" value={form.name} onChange={field("name")} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-type">Type</Label>
          <Input id="org-type" value={form.type} onChange={field("type")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-reg">Regulatory / License ID</Label>
          <Input id="org-reg" value={form.regulatoryId} onChange={field("regulatoryId")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-email">Contact Email</Label>
          <Input id="org-email" type="email" value={form.email} onChange={field("email")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-phone">Contact Phone</Label>
          <Input id="org-phone" value={form.phone} onChange={field("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-website">Website</Label>
          <Input id="org-website" value={form.website} onChange={field("website")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="org-description">Description</Label>
          <Input id="org-description" value={form.description} onChange={field("description")} />
        </div>
      </div>
      <InlineAlert tone={status?.tone ?? "success"} message={status?.msg ?? null} />
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save Organization"}
      </Button>
    </form>
  );
}

// ─── Appointment Policy Tab ──────────────────────────────────────────────────

type PolicyForm = {
  defaultDurationMinutes: number;
  bufferMinutes: number;
  advanceBookingDays: number;
  cancellationWindowHours: number;
  autoConfirm: boolean;
  requiresDeposit: boolean;
  depositPercentage: number;
};

function AppointmentPolicyTab({ orgId }: { orgId: string }) {
  const { data, loading } = useQuery(CONSULTANT_APPOINTMENT_POLICY_QUERY, {
    variables: { organizationId: orgId },
    fetchPolicy: "network-only",
  });

  const [form, setForm] = useState<PolicyForm>({
    defaultDurationMinutes: 30,
    bufferMinutes: 5,
    advanceBookingDays: 30,
    cancellationWindowHours: 24,
    autoConfirm: false,
    requiresDeposit: false,
    depositPercentage: 0,
  });

  const [initialized, setInitialized] = useState(false);
  const policy = data?.appointmentPolicy;

  if (policy && !initialized) {
    setInitialized(true);
    setForm({
      defaultDurationMinutes: policy.defaultDurationMinutes ?? 30,
      bufferMinutes: policy.bufferMinutes ?? 5,
      advanceBookingDays: policy.advanceBookingDays ?? 30,
      cancellationWindowHours: policy.cancellationWindowHours ?? 24,
      autoConfirm: policy.autoConfirm ?? false,
      requiresDeposit: policy.requiresDeposit ?? false,
      depositPercentage: policy.depositPercentage ?? 0,
    });
  }

  const [updatePolicy, { loading: saving }] = useMutation(
    CONSULTANT_UPDATE_APPOINTMENT_POLICY_MUTATION,
  );
  const [status, setStatus] = useState<{ tone: "success" | "error"; msg: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      await updatePolicy({
        variables: {
          organizationId: orgId,
          data: {
            defaultDurationMinutes: form.defaultDurationMinutes,
            bufferMinutes: form.bufferMinutes,
            advanceBookingDays: form.advanceBookingDays,
            cancellationWindowHours: form.cancellationWindowHours,
            autoConfirm: form.autoConfirm,
            requiresDeposit: form.requiresDeposit,
            depositPercentage: form.requiresDeposit ? form.depositPercentage : 0,
          },
        },
      });
      setStatus({ tone: "success", msg: "Appointment policy saved." });
    } catch {
      setStatus({ tone: "error", msg: "Failed to save appointment policy." });
    }
  }

  function numField(key: keyof PolicyForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: parseInt(e.target.value, 10) || 0 }));
  }

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-border/40" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ap-duration">Default Duration (minutes)</Label>
          <Input
            id="ap-duration"
            type="number"
            min={5}
            value={form.defaultDurationMinutes}
            onChange={numField("defaultDurationMinutes")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ap-buffer">Buffer Between Slots (minutes)</Label>
          <Input
            id="ap-buffer"
            type="number"
            min={0}
            value={form.bufferMinutes}
            onChange={numField("bufferMinutes")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ap-advance">Advance Booking Window (days)</Label>
          <Input
            id="ap-advance"
            type="number"
            min={1}
            value={form.advanceBookingDays}
            onChange={numField("advanceBookingDays")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ap-cancel">Cancellation Window (hours)</Label>
          <Input
            id="ap-cancel"
            type="number"
            min={0}
            value={form.cancellationWindowHours}
            onChange={numField("cancellationWindowHours")}
          />
        </div>
      </div>

      <div className="space-y-3">
        <ToggleRow
          label="Auto-confirm appointments"
          description="New bookings are automatically confirmed without manual review."
          checked={form.autoConfirm}
          onChange={(v) => setForm((f) => ({ ...f, autoConfirm: v }))}
        />
        <ToggleRow
          label="Require deposit"
          description="Patients must pay a deposit percentage to complete booking."
          checked={form.requiresDeposit}
          onChange={(v) => setForm((f) => ({ ...f, requiresDeposit: v }))}
        />
        {form.requiresDeposit ? (
          <div className="space-y-2 pl-1">
            <Label htmlFor="ap-deposit">Deposit Percentage</Label>
            <Input
              id="ap-deposit"
              type="number"
              min={1}
              max={100}
              value={form.depositPercentage}
              onChange={numField("depositPercentage")}
              className="max-w-[160px]"
            />
          </div>
        ) : null}
      </div>

      <InlineAlert tone={status?.tone ?? "success"} message={status?.msg ?? null} />
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save Policy"}
      </Button>
    </form>
  );
}

// ─── Departments Tab ─────────────────────────────────────────────────────────

type DepartmentItem = {
  id: string;
  name: string;
  status: string;
  headProviderId: string | null;
  createdAt: string;
};

function DepartmentsTab({ orgId }: { orgId: string }) {
  const { data, loading, refetch } = useQuery<{
    organizationDepartments: DepartmentItem[];
  }>(CONSULTANT_ORG_DEPARTMENTS_QUERY, {
    variables: { organizationId: orgId },
    fetchPolicy: "network-only",
  });

  const departments = data?.organizationDepartments ?? [];

  const [upsert, { loading: saving }] = useMutation(CONSULTANT_UPSERT_DEPARTMENT_MUTATION);
  const [newName, setNewName] = useState("");
  const [status, setStatus] = useState<{ tone: "success" | "error"; msg: string } | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setStatus(null);
    try {
      await upsert({
        variables: {
          organizationId: orgId,
          data: { name: newName.trim(), status: "ACTIVE" },
        },
      });
      setNewName("");
      setStatus({ tone: "success", msg: "Department added." });
      await refetch();
    } catch {
      setStatus({ tone: "error", msg: "Failed to add department." });
    }
  }

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-border/40" />;
  }

  return (
    <div className="space-y-6">
      <div className="divide-y divide-border rounded-xl border border-border">
        {departments.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted">No departments yet.</p>
        ) : (
          departments.map((dept) => (
            <div key={dept.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-text">{dept.name}</p>
                <p className="text-xs text-muted capitalize">{dept.status.toLowerCase()}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAdd} className="flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="dept-name">Add Department</Label>
          <Input
            id="dept-name"
            placeholder="Department name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={saving || !newName.trim()}>
          {saving ? "Adding…" : "Add"}
        </Button>
      </form>

      <InlineAlert tone={status?.tone ?? "success"} message={status?.msg ?? null} />
    </div>
  );
}

// ─── Locations Tab ───────────────────────────────────────────────────────────

type LocationItem = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  isPrimary: boolean;
  isActive: boolean;
};

function LocationsTab({ orgId }: { orgId: string }) {
  const { data, loading } = useQuery<{ organizationLocations: LocationItem[] }>(
    CONSULTANT_ORG_LOCATIONS_QUERY,
    { variables: { organizationId: orgId }, fetchPolicy: "network-only" },
  );

  const locations = data?.organizationLocations ?? [];

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-border/40" />;
  }

  if (locations.length === 0) {
    return (
      <div className="rounded-xl border border-border px-4 py-8 text-center text-sm text-muted">
        No locations have been configured for this organization.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border">
      {locations.map((loc) => (
        <div key={loc.id} className="flex items-start justify-between gap-4 px-4 py-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-text">
              {loc.name}
              {loc.isPrimary ? (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Primary
                </span>
              ) : null}
            </p>
            {(loc.address ?? loc.city) ? (
              <p className="text-xs text-muted">
                {[loc.address, loc.city, loc.country].filter(Boolean).join(", ")}
              </p>
            ) : null}
          </div>
          <span
            className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              loc.isActive
                ? "bg-success/10 text-success"
                : "bg-border text-muted"
            }`}
          >
            {loc.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Notifications Tab ───────────────────────────────────────────────────────

type NotifPrefs = {
  emailEnabled: boolean;
  smsEnabled: boolean;
  appointmentReminders: boolean;
  labResultsReady: boolean;
  prescriptionReady: boolean;
  patientMessages: boolean;
  systemAlerts: boolean;
};

function NotificationsTab({ orgId }: { orgId: string }) {
  const { data, loading } = useQuery(CONSULTANT_NOTIFICATION_PREFERENCES_QUERY, {
    variables: { organizationId: orgId },
    fetchPolicy: "network-only",
  });

  const [prefs, setPrefs] = useState<NotifPrefs>({
    emailEnabled: true,
    smsEnabled: false,
    appointmentReminders: true,
    labResultsReady: true,
    prescriptionReady: true,
    patientMessages: true,
    systemAlerts: true,
  });

  const [initialized, setInitialized] = useState(false);
  const raw = data?.notificationPreferences;

  if (raw && !initialized) {
    setInitialized(true);
    setPrefs({
      emailEnabled: raw.emailEnabled ?? true,
      smsEnabled: raw.smsEnabled ?? false,
      appointmentReminders: raw.appointmentReminders ?? true,
      labResultsReady: raw.labResultsReady ?? true,
      prescriptionReady: raw.prescriptionReady ?? true,
      patientMessages: raw.patientMessages ?? true,
      systemAlerts: raw.systemAlerts ?? true,
    });
  }

  const [updatePrefs, { loading: saving }] = useMutation(
    CONSULTANT_UPDATE_NOTIFICATION_PREFERENCES_MUTATION,
  );
  const [status, setStatus] = useState<{ tone: "success" | "error"; msg: string } | null>(null);

  async function handleSave() {
    setStatus(null);
    try {
      await updatePrefs({
        variables: { organizationId: orgId, data: prefs },
      });
      setStatus({ tone: "success", msg: "Notification preferences saved." });
    } catch {
      setStatus({ tone: "error", msg: "Failed to save notification preferences." });
    }
  }

  function toggle(key: keyof NotifPrefs) {
    return (v: boolean) => setPrefs((p) => ({ ...p, [key]: v }));
  }

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-border/40" />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Channels</p>
        <div className="space-y-3">
          <ToggleRow
            label="Email notifications"
            description="Receive platform and clinical event alerts by email."
            checked={prefs.emailEnabled}
            onChange={toggle("emailEnabled")}
          />
          <ToggleRow
            label="SMS notifications"
            description="Receive urgent reminders and alerts by SMS."
            checked={prefs.smsEnabled}
            onChange={toggle("smsEnabled")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Events</p>
        <div className="space-y-3">
          <ToggleRow
            label="Appointment reminders"
            description="Reminders before upcoming patient appointments."
            checked={prefs.appointmentReminders}
            onChange={toggle("appointmentReminders")}
          />
          <ToggleRow
            label="Lab results ready"
            description="Alert when patient lab results are available."
            checked={prefs.labResultsReady}
            onChange={toggle("labResultsReady")}
          />
          <ToggleRow
            label="Prescription ready"
            description="Notify when a prescription is issued or dispensed."
            checked={prefs.prescriptionReady}
            onChange={toggle("prescriptionReady")}
          />
          <ToggleRow
            label="Patient messages"
            description="In-app message notifications from patients."
            checked={prefs.patientMessages}
            onChange={toggle("patientMessages")}
          />
          <ToggleRow
            label="System alerts"
            description="Platform maintenance, policy updates, and admin alerts."
            checked={prefs.systemAlerts}
            onChange={toggle("systemAlerts")}
          />
        </div>
      </div>

      <InlineAlert tone={status?.tone ?? "success"} message={status?.msg ?? null} />
      <Button type="button" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save Preferences"}
      </Button>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function ConsultantSettingsPageView() {
  const [tab, setTab] = useState<Tab>("organization");

  const { data: orgData, loading: orgLoading } = useQuery(MY_CONSULTANT_ORGANIZATIONS_QUERY, {
    fetchPolicy: "network-only",
  });

  const orgId: string | null = orgData?.myConsultantOrganizations?.[0]?.id ?? null;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Settings</p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Organization Settings</h1>
      </header>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === id
                ? "bg-primary text-white shadow-soft"
                : "text-muted hover:bg-background hover:text-text"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{TABS.find((t) => t.id === tab)?.label}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {orgLoading ? (
            <div className="h-48 animate-pulse rounded-xl bg-border/40" />
          ) : !orgId ? (
            <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-6 text-sm text-warning">
              No organization found. Settings are only available to organization admins.
            </div>
          ) : (
            <>
              {tab === "organization" && <OrganizationTab orgId={orgId} />}
              {tab === "appointment-policy" && <AppointmentPolicyTab orgId={orgId} />}
              {tab === "departments" && <DepartmentsTab orgId={orgId} />}
              {tab === "locations" && <LocationsTab orgId={orgId} />}
              {tab === "notifications" && <NotificationsTab orgId={orgId} />}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
