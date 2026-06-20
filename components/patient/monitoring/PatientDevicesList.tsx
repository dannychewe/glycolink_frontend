"use client";

import { useQuery } from "@apollo/client";
import { Wifi, WifiOff, MonitorSmartphone } from "lucide-react";
import { MY_DEVICE_CONNECTIONS_QUERY } from "@/lib/monitoring/graphql";
import { Badge } from "@/components/ui/badge";

type DeviceConnection = {
  id: string;
  vendor: string;
  status: string;
  connectedAt: string;
  revokedAt: string | null;
};

type DevicesData = {
  myDeviceConnections: DeviceConnection[];
};

function formatDate(value: string) {
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

function statusVariant(status: string): "success" | "secondary" | "danger" {
  const s = status.toUpperCase();
  if (s === "CONNECTED" || s === "ACTIVE") return "success";
  if (s === "REVOKED" || s === "DISCONNECTED") return "danger";
  return "secondary";
}

export function PatientDevicesList() {
  const { data, loading, error } = useQuery<DevicesData>(MY_DEVICE_CONNECTIONS_QUERY, {
    fetchPolicy: "network-only",
  });

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-border/40" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
        Unable to load device connections right now.
      </div>
    );
  }

  const devices = data?.myDeviceConnections ?? [];

  if (devices.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
        <MonitorSmartphone className="mx-auto size-8 text-muted/40" />
        <p className="mt-3 text-base font-medium text-text">No connected devices</p>
        <p className="mt-1 text-sm text-muted">
          Devices linked to your account will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {devices.map((device) => {
        const isActive =
          device.status.toUpperCase() === "CONNECTED" ||
          device.status.toUpperCase() === "ACTIVE";

        return (
          <div
            key={device.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              {isActive ? (
                <Wifi className="size-5 shrink-0 text-success" />
              ) : (
                <WifiOff className="size-5 shrink-0 text-muted" />
              )}
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-text">{device.vendor}</p>
                <p className="text-xs text-muted">
                  Connected {formatDate(device.connectedAt)}
                </p>
                {device.revokedAt ? (
                  <p className="text-xs text-muted">
                    Revoked {formatDate(device.revokedAt)}
                  </p>
                ) : null}
              </div>
            </div>

            <Badge variant={statusVariant(device.status)} className="shrink-0 self-start sm:self-auto">
              {device.status}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
