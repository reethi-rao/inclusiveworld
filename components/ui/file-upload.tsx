"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { UploadCloud, File as FileIcon, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Direct-to-Blob client uploader. Writes the resulting public URL into a hidden
 * input named `name` (so plain <form> submissions pick it up) and/or calls
 * `onUploaded`.
 */
export function FileUpload({
  name,
  accept = ".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,.txt",
  label = "Upload a file",
  defaultUrl,
  onUploaded,
}: {
  name?: string;
  accept?: string;
  label?: string;
  defaultUrl?: string | null;
  onUploaded?: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(defaultUrl ?? null);
  const [fileName, setFileName] = useState<string | null>(
    defaultUrl ? defaultUrl.split("/").pop() ?? "Attached file" : null
  );
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();

  async function onSelect(file: File) {
    setError(undefined);
    setUploading(true);
    setProgress(0);
    setFileName(file.name);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        onUploadProgress: (e) => setProgress(Math.round(e.percentage)),
      });
      setUrl(blob.url);
      onUploaded?.(blob.url);
    } catch (err) {
      setError((err as Error).message || "Upload failed.");
      setFileName(null);
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setUrl(null);
    setFileName(null);
    setProgress(0);
    onUploaded?.(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {name && <input type="hidden" name={name} value={url ?? ""} readOnly />}

      {!fileName ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed border-gray-200 px-4 py-6 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
        >
          <UploadCloud className="h-6 w-6 text-brand-500" />
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-xs text-gray-400">
            PDF, slides, docs, or images up to 25&nbsp;MB
          </span>
        </button>
      ) : (
        <div className="rounded-xl border border-gray-200 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FileIcon className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800">
                {fileName}
              </p>
              {uploading ? (
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : (
                <p className="text-xs text-green-600">Uploaded ✓</p>
              )}
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={clear}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-brand-700">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
      />
    </div>
  );
}
