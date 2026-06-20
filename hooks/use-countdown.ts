"use client";

import { useEffect, useState } from "react";

export type CountdownState = {
  /** Milliseconds remaining until the target time (never negative). */
  remainingMs: number;
  /** Formatted as `m:ss`, or `h:mm:ss` when over an hour. */
  label: string;
  /** True once the target time has passed. */
  isExpired: boolean;
  /** True while remaining time is at/under the warning threshold (but not expired). */
  isWarning: boolean;
  /** True while remaining time is at/under the critical threshold (but not expired). */
  isCritical: boolean;
};

type CountdownOptions = {
  /** Seconds remaining at which the warning state turns on. Defaults to 300 (5 min). */
  warnSeconds?: number;
  /** Seconds remaining at which the critical state turns on. Defaults to 60 (1 min). */
  criticalSeconds?: number;
  /** Fired once when the countdown reaches zero. */
  onExpire?: () => void;
};

function formatRemaining(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

/**
 * Live countdown to an ISO timestamp. Recomputes every second and exposes
 * warning/critical/expired flags so the UI can escalate as time runs out.
 */
export function useCountdown(
  target: string | null | undefined,
  { warnSeconds = 300, criticalSeconds = 60, onExpire }: CountdownOptions = {},
): CountdownState | null {
  const targetMs = target ? new Date(target).getTime() : Number.NaN;
  const hasTarget = Number.isFinite(targetMs);

  const [now, setNow] = useState(() => Date.now());
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    if (!hasTarget) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [hasTarget, targetMs]);

  useEffect(() => {
    if (!hasTarget) return;
    if (!hasExpired && now >= targetMs) {
      setHasExpired(true);
      onExpire?.();
    }
  }, [hasExpired, hasTarget, now, onExpire, targetMs]);

  if (!hasTarget) return null;

  const remainingMs = Math.max(0, targetMs - now);
  const remainingSeconds = Math.floor(remainingMs / 1000);
  const isExpired = remainingMs <= 0;

  return {
    remainingMs,
    label: formatRemaining(remainingMs),
    isExpired,
    isWarning: !isExpired && remainingSeconds <= warnSeconds,
    isCritical: !isExpired && remainingSeconds <= criticalSeconds,
  };
}
