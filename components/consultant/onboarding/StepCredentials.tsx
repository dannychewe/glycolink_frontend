"use client";

import { useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { CheckCircle2, Loader2, Upload, X } from "lucide-react";
import {
  PROVIDER_LICENSE_TYPE_OPTIONS,
  UPLOAD_PROVIDER_LICENSE_MUTATION,
} from "@/lib/consultant/provider-lifecycle-graphql";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type UploadedLicense = {
  id: string;
  type: string;
  fileUrl: string;
  expiryDate: string | null;
  issuedAt: string | null;
};

type StepCredentialsProps = {
  uploads: UploadedLicense[];
  onUploaded: (license: UploadedLicense) => void;
  onRemove: (id: string) => void;
};

export function StepCredentials({ uploads, onUploaded, onRemove }: StepCredentialsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [licenseType, setLicenseType] = useState<string>(PROVIDER_LICENSE_TYPE_OPTIONS[0].value);
  const [issuedAt, setIssuedAt] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [uploadLicense, { loading: uploading }] = useMutation(UPLOAD_PROVIDER_LICENSE_MUTATION);

  async function handleUpload() {
    if (!selectedFile) return;
    setUploadError(null);
    try {
      const { data } = await uploadLicense({
        variables: {
          file: selectedFile,
          licenseType,
          issuedAt: issuedAt || undefined,
          expiryDate: expiryDate || undefined,
        },
      });
      const license = data?.uploadProviderLicense?.license;
      if (license) {
        onUploaded(license);
        setSelectedFile(null);
        setIssuedAt("");
        setExpiryDate("");
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Upload your practicing certificate, HPCZ license, or telemedicine approval.
        You can upload multiple documents. This step is optional — you can add more later from your profile.
      </p>

      {/* Uploaded licenses */}
      {uploads.length > 0 ? (
        <div className="space-y-2">
          {uploads.map((lic) => (
            <div
              key={lic.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-success/5 px-4 py-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="size-4 shrink-0 text-success" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text capitalize">
                    {lic.type.replace(/_/g, " ")}
                  </p>
                  {lic.expiryDate ? (
                    <p className="text-xs text-muted">Expires {lic.expiryDate}</p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(lic.id)}
                className="shrink-0 rounded-lg p-1 text-muted hover:text-danger transition"
                aria-label="Remove"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {/* Upload form */}
      <div className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="licenseType">Document Type</Label>
            <select
              id="licenseType"
              value={licenseType}
              onChange={(e) => setLicenseType(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {PROVIDER_LICENSE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="credFile">Document File</Label>
            <input
              id="credFile"
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="flex h-11 w-full cursor-pointer rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuedAt">Issue Date</Label>
            <Input
              id="issuedAt"
              type="date"
              value={issuedAt}
              onChange={(e) => setIssuedAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
        </div>

        {uploadError ? (
          <p className="text-sm text-danger">{uploadError}</p>
        ) : null}

        <Button
          type="button"
          variant="secondary"
          disabled={!selectedFile || uploading}
          onClick={() => void handleUpload()}
          className="gap-2"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {uploading ? "Uploading…" : "Upload Document"}
        </Button>
      </div>
    </div>
  );
}
