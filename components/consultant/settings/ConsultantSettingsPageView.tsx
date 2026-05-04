"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ConsultantSettings } from "@/types";

type ConsultantSettingsPageViewProps = Readonly<{
  initialSettings: ConsultantSettings;
}>;

const consultantSettingsStorageKey = "glycolink.consultant.settings";

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const initialPasswordFormState: PasswordFormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function InlineMessage({
  tone,
  message,
}: Readonly<{
  tone: "success" | "danger";
  message: string | null;
}>) {
  if (!message) {
    return null;
  }

  return (
    <p className={tone === "success" ? "text-sm text-success" : "text-sm text-danger"}>
      {message}
    </p>
  );
}

type ToggleRowProps = Readonly<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}>;

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="text-sm text-muted">{description}</p>
      </div>

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
    </div>
  );
}

export function ConsultantSettingsPageView({
  initialSettings,
}: ConsultantSettingsPageViewProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [passwordForm, setPasswordForm] = useState(initialPasswordFormState);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);

  useEffect(() => {
    const rawSettings = window.localStorage.getItem(consultantSettingsStorageKey);

    if (!rawSettings) {
      return;
    }

    try {
      const parsedSettings = JSON.parse(rawSettings) as ConsultantSettings;

      if (
        typeof parsedSettings.emailNotifications === "boolean" &&
        typeof parsedSettings.smsNotifications === "boolean"
      ) {
        setSettings(parsedSettings);
      }
    } catch {
      window.localStorage.removeItem(consultantSettingsStorageKey);
    }
  }, []);

  function persistSettings(nextSettings: ConsultantSettings) {
    setSettings(nextSettings);
    window.localStorage.setItem(
      consultantSettingsStorageKey,
      JSON.stringify(nextSettings),
    );
    setSettingsMessage("Notification preferences updated.");
  }

  function handlePasswordUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError("Complete all password fields before submitting.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setPasswordForm(initialPasswordFormState);
    setPasswordMessage("Password updated successfully.");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Consultant Settings
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Settings</h1>
      </header>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Account Security</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handlePasswordUpdate}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <InlineMessage tone="danger" message={passwordError} />
            <InlineMessage tone="success" message={passwordMessage} />

            <Button type="submit">Update Password</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            label="Email notifications"
            description="Receive appointment, lab, and platform notifications by email."
            checked={settings.emailNotifications}
            onChange={(checked) =>
              persistSettings({
                ...settings,
                emailNotifications: checked,
              })
            }
          />

          <ToggleRow
            label="SMS notifications"
            description="Receive important clinical reminders and urgent alerts by SMS."
            checked={settings.smsNotifications}
            onChange={(checked) =>
              persistSettings({
                ...settings,
                smsNotifications: checked,
              })
            }
          />

          <InlineMessage tone="success" message={settingsMessage} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button href="/" variant="secondary" fullWidth className="sm:w-auto">
            Logout
          </Button>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            className="border border-danger/20 bg-danger/5 text-danger hover:bg-danger/10 sm:w-auto"
            onClick={() =>
              setAccountMessage("Account deactivation request recorded in this demo.")
            }
          >
            Deactivate Account
          </Button>
          <InlineMessage tone="danger" message={accountMessage} />
        </CardContent>
      </Card>
    </div>
  );
}
