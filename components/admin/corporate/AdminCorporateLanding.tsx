"use client";

import { BriefcaseBusiness, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AdminCorporateLanding() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Admin Workspace
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Corporate</h1>
        <p className="max-w-3xl text-sm text-muted">
          Manage corporate accounts, enroll covered members, and configure benefit plans.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-4 py-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <BriefcaseBusiness className="size-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-text">New Corporate Account</p>
              <p className="text-sm text-muted">
                Register a new corporate account tied to an organisation.
              </p>
            </div>
            <Button href="/admin/corporate/new" className="w-fit">
              <Plus className="size-4" />
              Create Account
            </Button>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-2">
          <CardContent className="flex flex-col gap-4 py-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <BriefcaseBusiness className="size-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-text">Corporate Account Workspace</p>
              <p className="text-sm text-muted">
                Select an organisation in the create flow to open or register its corporate account.
                Existing accounts should be opened from account links returned after creation.
              </p>
            </div>
            <Button href="/admin/corporate/new" variant="secondary" className="w-fit">
              <Plus className="size-4" />
              Open Account Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
