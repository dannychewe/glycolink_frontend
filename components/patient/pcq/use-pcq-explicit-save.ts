"use client";

import { useCallback, useRef, useState } from "react";

/** A field's on-demand saver: persists its current value via savePcqAnswer. */
export type FieldSaver = () => Promise<void>;

export type PcqExplicitSave = {
  /** Fields call this on mount to register their saver; returns an unregister fn. */
  register: (questionId: string, saver: FieldSaver) => () => void;
  /**
   * Explicitly flush every registered field through savePcqAnswer. Resolves to
   * true when every field saved, false when any saver threw. Callers that gate
   * a follow-up action (e.g. submit) on a clean save should check the result.
   */
  saveAll: () => Promise<boolean>;
  saving: boolean;
  savedAt: string | null;
  error: boolean;
};

/**
 * Coordinates the explicit "Save answers" action for a PCQ form. Autosave
 * (savePcqDraft) still happens per-field on blur; this drives the manual save
 * with savePcqAnswer so a patient can deliberately persist everything at once.
 */
export function usePcqExplicitSave(): PcqExplicitSave {
  const saversRef = useRef(new Map<string, FieldSaver>());
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const register = useCallback((questionId: string, saver: FieldSaver) => {
    saversRef.current.set(questionId, saver);
    return () => {
      saversRef.current.delete(questionId);
    };
  }, []);

  const saveAll = useCallback(async () => {
    setSaving(true);
    setError(false);
    try {
      await Promise.all(Array.from(saversRef.current.values(), (save) => save()));
      setSavedAt(new Date().toISOString());
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { register, saveAll, saving, savedAt, error };
}
