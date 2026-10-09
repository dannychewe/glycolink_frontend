"use client";

import { useSyncExternalStore } from "react";

const changeEvent = "workspace-url-state-change";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(changeEvent, onChange);
  };
}

function snapshot() {
  return window.location.href;
}

function serverSnapshot() {
  return "";
}

export function readUrlState(
  href: string,
  key: string,
  fallback: string,
  allowed?: readonly string[],
) {
  const value = href ? new URL(href).searchParams.get(key) : null;
  return value !== null && (!allowed || allowed.includes(value))
    ? value
    : fallback;
}

export function useUrlState(
  key: string,
  fallback: string,
  allowed?: readonly string[],
) {
  const href = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const value = readUrlState(href, key, fallback, allowed);

  function setValue(next: string) {
    if (allowed && !allowed.includes(next)) return;
    // Read the current URL so consecutive updates preserve each other's parameters.
    const url = new URL(window.location.href);
    if (next === fallback) url.searchParams.delete(key);
    else url.searchParams.set(key, next);
    if (url.href === window.location.href) return;
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new Event(changeEvent));
  }

  return [value, setValue] as const;
}
