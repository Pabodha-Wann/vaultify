"use client";

import { useRef, useState } from "react";
import type { VaultFile } from "../../../lib/api";
import ConfirmDialog from "./ConfirmDialog";
import ShareModal from "./ShareModal";

interface FileRowProps {
  file: VaultFile;
  downloadUrl: string;
  onRename: (id: number, newName: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onShare: (id: number) => Promise<{ share_url: string }>;
}

/** Returns an SVG path character or badge representing a file type glyph */
function fileIcon(contentType: string, name: string): React.ReactNode {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const isImage = contentType.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext);
  const isPdf = contentType === "application/pdf" || ext === "pdf";
  const isVideo = contentType.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm", "wmv", "flv", "m4v"].includes(ext);
  const isAudio = contentType.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "m4a", "aac", "wma"].includes(ext);
  const isDoc =
    ["doc", "docx", "odt", "rtf", "txt"].includes(ext) ||
    contentType.includes("word") ||
    contentType.includes("officedocument.wordprocessingml") ||
    contentType === "text/plain";
  const isSheet =
    ["xls", "xlsx", "csv", "ods"].includes(ext) ||
    contentType.includes("sheet") ||
    contentType.includes("excel") ||
    contentType === "text/csv";
  const isPresentation =
    ["ppt", "pptx", "odp"].includes(ext) ||
    contentType.includes("presentation") ||
    contentType.includes("powerpoint");
  const isCode =
    ["js", "ts", "tsx", "jsx", "py", "go", "rs", "html", "css", "json", "yaml", "yml", "sql", "sh", "md"].includes(ext);
  const isArchive = ["zip", "tar", "gz", "rar", "7z", "bz2"].includes(ext);

  let label = ext ? ext.toUpperCase().slice(0, 4) : "FILE";
  let color = "text-slate";

  if (isPdf) { label = "PDF"; color = "text-red-500"; }
  else if (isDoc) { label = "DOC"; color = "text-blue-600"; }
  else if (isSheet) { label = "XLS"; color = "text-emerald-600"; }
  else if (isPresentation) { label = "PPT"; color = "text-orange-600"; }
  else if (isVideo) { label = "VID"; color = "text-purple-500"; }
  else if (isAudio) { label = "AUD"; color = "text-pink-500"; }
  else if (isImage) { label = "IMG"; color = "text-cyan-600"; }
  else if (isCode) { label = ext.toUpperCase().slice(0, 3); color = "text-amber-500"; }
  else if (isArchive) { label = "ZIP"; color = "text-slate"; }

  return (
    <span
      className={`text-[10px] font-bold font-mono leading-none ${color} shrink-0 w-8 text-center`}
      aria-hidden
    >
      {label}
    </span>
  );
}

/** Converts bytes to a human-readable string */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileRow({ file, downloadUrl, onRename, onDelete, onShare }: FileRowProps) {
  const [renaming, setRenaming] = useState(false);
  const [nameValue, setNameValue] = useState(file.Name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submittingRef = useRef(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startRename = () => {
    submittingRef.current = false;
    setNameValue(file.Name);
    setRenaming(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const submitRename = async () => {
    if (submittingRef.current) return;
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === file.Name) {
      submittingRef.current = true;
      setRenaming(false);
      setNameValue(file.Name);
      return;
    }
    submittingRef.current = true;
    setBusy(true);
    try {
      await onRename(file.ID, trimmed);
      setRenaming(false);
    } catch {
      submittingRef.current = false;
      setActionError("Rename failed. Try again.");
      setNameValue(file.Name);
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    setBusy(true);
    setActionError(null);
    try {
      const result = await onShare(file.ID);
      setShareUrl(result.share_url);
    } catch {
      setActionError("Could not generate a share link. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setBusy(true);
    try {
      await onDelete(file.ID);
      setConfirmDelete(false);
    } catch {
      setConfirmDelete(false);
      setActionError("Could not delete the file. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <>
      <div
        className={`group flex items-center gap-4 px-5 py-3.5 border-b border-slate/15
          hover:bg-[#151921] transition-colors bg-[#0E1116]
          ${busy ? "opacity-60 pointer-events-none" : ""}`}
        role="row"
      >
        {/* File type badge */}
        {fileIcon(file.ContentType, file.Name)}

        {/* Name — clicking opens in browser in new tab */}
        {renaming ? (
          <input
            ref={inputRef}
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") {
                submittingRef.current = true;
                setRenaming(false);
                setNameValue(file.Name);
              }
            }}
            disabled={busy}
            className="flex-1 text-sm font-semibold border border-brass bg-transparent rounded-sm px-2.5 py-1
              text-paper focus:outline-none disabled:opacity-50"
            aria-label="Rename file"
          />
        ) : (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-sm font-semibold text-paper hover:text-brass hover:underline truncate transition-colors text-left"
            title={`Open ${file.Name} in browser`}
          >
            {file.Name}
          </a>
        )}

        {/* Size */}
        <span className="text-xs text-slate/75 shrink-0 w-24 text-right hidden sm:block font-mono">
          {formatSize(file.Size)}
        </span>

        {/* Modified Date */}
        <span className="text-xs text-slate/70 shrink-0 w-28 text-right hidden md:block">
          {formatDate(file.UpdatedAt || file.CreatedAt)}
        </span>

        {/* Actions — revealed on hover */}
        <div
          className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100
            transition-opacity shrink-0"
        >
          {/* Open in browser */}
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-slate hover:text-paper px-2.5 py-1.5 rounded-sm
              transition-colors focus-visible:outline-brass hover:bg-slate/15 cursor-pointer"
            aria-label={`Open ${file.Name} in new tab`}
          >
            Open
          </a>

          {/* Download — explicit attachment */}
          <a
            href={`${downloadUrl}?download=true`}
            download={file.Name}
            className="text-xs font-medium text-slate hover:text-paper px-2.5 py-1.5 rounded-sm
              transition-colors focus-visible:outline-brass hover:bg-slate/15 cursor-pointer"
            aria-label={`Download ${file.Name}`}
          >
            Download
          </a>
          <button
            onClick={startRename}
            className="text-xs font-medium text-slate hover:text-paper px-2.5 py-1.5 rounded-sm
              transition-colors focus-visible:outline-brass hover:bg-slate/15 cursor-pointer"
            aria-label={`Rename ${file.Name}`}
          >
            Rename
          </button>
          <button
            onClick={handleShare}
            className="text-xs font-medium text-slate hover:text-paper px-2.5 py-1.5 rounded-sm
              transition-colors focus-visible:outline-brass hover:bg-slate/15 cursor-pointer"
            aria-label={`Share ${file.Name}`}
          >
            Share
          </button>
          <button
            onClick={() => { setActionError(null); setConfirmDelete(true); }}
            className="text-xs font-medium text-slate hover:text-red-400 px-2.5 py-1.5 rounded-sm
              transition-colors focus-visible:outline-brass hover:bg-red-500/10 cursor-pointer"
            aria-label={`Delete ${file.Name}`}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Inline action error */}
      {actionError && (
        <div
          role="alert"
          className="px-4 py-2 bg-red-950/80 border-b border-red-800 flex items-center justify-between gap-4"
        >
          <p className="text-xs text-red-200">{actionError}</p>
          <button
            onClick={() => setActionError(null)}
            className="text-xs text-red-400 hover:text-red-200 shrink-0 focus-visible:outline-brass"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Share modal */}
      {shareUrl && (
        <ShareModal shareUrl={shareUrl} onClose={() => setShareUrl(null)} />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${file.Name}"?`}
          message="This file will be permanently removed and cannot be recovered."
          confirmLabel="Delete file"
          destructive
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
