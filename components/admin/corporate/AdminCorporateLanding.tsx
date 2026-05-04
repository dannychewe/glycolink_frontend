"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AdminCorporateLanding() {
  const router = useRouter();
  const [lookupId, setLookupId] = useState("");

  function handleLookup(event: FormEvent) {
    event.preventDefault();
    const id = lookupId.trim();
    if (id) router.push(`/admin/corporate/${id}`);
  }

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
            <div className="flex size-10 items-center justify-center rounded-xl bg-border/60">
              <Search className="size-5 text-muted" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-text">Look up an Account</p>
              <p className="text-sm text-muted">
                Enter a corporate account ID to view its members and benefit plans.
              </p>
            </div>
            <form onSubmit={handleLookup} className="flex gap-2">
              <Input
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="Corporate account UUID"
                className="max-w-sm"
              />
              <Button type="submit" variant="secondary" disabled={!lookupId.trim()}>
                View
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
