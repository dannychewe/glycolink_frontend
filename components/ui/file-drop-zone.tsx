"use client";

import { useRef, useState, DragEvent } from "react";
import { UploadCloud, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type FileDropZoneProps = {
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  hint?: string;
  loading?: boolean;
  id?: string;
};

export function FileDropZone({ value, onChange, accept, hint, loading = false, id }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onChange(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
    e.target.value = "";
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
      />

      {value ? (
        // ── Selected file preview ──────────────────────────
        <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="size-4 text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text">{value.name}</p>
            <p className="text-xs text-muted">{formatBytes(value.size)}</p>
          </div>
          {loading ? (
            <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <button
              type="button"
              onClick={handleRemove}
              className="shrink-0 rounded-lg p-1 text-muted transition hover:bg-danger/10 hover:text-danger"
              title="Remove file"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      ) : (
        // ── Drop zone ──────────────────────────────────────
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition",
            dragging
              ? "border-primary bg-primary/5"
              : "border-border bg-surface hover:border-primary/50 hover:bg-primary/3",
          )}
        >
          <span className={cn(
            "flex size-11 items-center justify-center rounded-2xl transition",
            dragging ? "bg-primary/15" : "bg-primary/8",
          )}>
            <UploadCloud className={cn("size-5", dragging ? "text-primary" : "text-primary/70")} />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-text">
              {dragging ? "Drop file here" : "Drop file here or click to browse"}
            </p>
            {hint ? (
              <p className="text-xs text-muted">{hint}</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
