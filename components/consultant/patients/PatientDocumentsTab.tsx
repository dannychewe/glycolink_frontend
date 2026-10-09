"use client";

import { FormEvent, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { FileText, Plus, Upload } from "lucide-react";
import {
  UPLOAD_PATIENT_DOCUMENT_MUTATION,
  type WorkspaceDocument,
} from "@/lib/consultant/patient-workspace-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

function formatDate(value: string | null | undefined) {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-ZM", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function titleCase(value: string | null | undefined) {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const DOC_TYPE_OPTIONS = [
  { value: "clinical_letter", label: "Clinical letter" },
  { value: "referral", label: "Referral" },
  { value: "imaging_report", label: "Imaging report" },
  { value: "lab_report", label: "Lab report" },
  { value: "other", label: "Other" },
] as const;

function UploadModal({
  patientId,
  onClose,
  onUploaded,
}: {
  patientId: string;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [docType, setDocType] = useState("clinical_letter");
  const [recordedDate, setRecordedDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [upload, { loading }] = useMutation(UPLOAD_PATIENT_DOCUMENT_MUTATION);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading || !file) return;
    setError(null);
    try {
      await upload({
        variables: {
          patientId,
          data: {
            docType,
            recordedDate: recordedDate || null,
            file,
          },
        },
      });
      onUploaded();
      onClose();
    } catch {
      setError("Unable to upload this document. Please try again.");
    }
  }

  return (
    <DetailModal
      title="Upload document"
      className="sm:max-w-md"
      onClose={() => {
        if (!loading) onClose();
      }}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="upload-document-form"
            size="sm"
            disabled={loading || !file}
          >
            <Upload className="size-4" />
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      }
    >
      <form
        id="upload-document-form"
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-4"
      >
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="doc-type">Document type</Label>
          <Select
            id="doc-type"
            value={docType}
            onChange={(event) => setDocType(event.target.value)}
            options={DOC_TYPE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doc-date">
            Recorded date <span className="text-muted">(optional)</span>
          </Label>
          <Input
            id="doc-date"
            type="date"
            value={recordedDate}
            onChange={(event) => setRecordedDate(event.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doc-file">
            File <span className="text-danger">*</span>
          </Label>
          <input
            ref={fileRef}
            id="doc-file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:py-2 file:text-sm file:font-medium file:text-text file:transition-colors hover:file:bg-primary/5"
            disabled={loading}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            required
          />
          {file ? (
            <p className="text-xs text-muted">{file.name}</p>
          ) : null}
        </div>
      </form>
    </DetailModal>
  );
}

export function PatientDocumentsTab({
  patientId,
  documents,
  onChanged,
}: Readonly<{
  patientId: string;
  documents: WorkspaceDocument[];
  onChanged: () => void;
}>) {
  const [uploading, setUploading] = useState(false);

  return (
    <div className="min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text">
          <FileText className="size-4 text-primary" />
          Documents
          <span className="text-xs font-medium tabular-nums text-muted">
            {documents.length}
          </span>
        </h2>
        <Button type="button" size="sm" onClick={() => setUploading(true)}>
          <Plus className="size-4" />
          Upload document
        </Button>
      </header>

      {documents.length === 0 ? (
        <p className="border-y border-border py-8 text-center text-sm text-muted">
          No documents shared.
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((d) => (
            <div
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-border px-4 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="break-words font-medium text-text">
                  {d.originalName || titleCase(d.docType) || "Document"}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {titleCase(d.docType)}
                  {d.recordedDate
                    ? ` · ${formatDate(d.recordedDate)}`
                    : ""}
                </p>
              </div>
              {d.fileUrl ? (
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs font-medium text-primary underline underline-offset-4"
                >
                  Open
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {uploading ? (
        <UploadModal
          patientId={patientId}
          onClose={() => setUploading(false)}
          onUploaded={onChanged}
        />
      ) : null}
    </div>
  );
}
