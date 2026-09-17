"use client";

import { useEffect, useRef, useState } from "react";
import type { VaultFile } from "../../../lib/api";
import ConfirmDialog from "./ConfirmDialog";
import ShareModal from "./ShareModal";

interface FileCardProps {
  file: VaultFile;
  downloadUrl: string;
  onRename: (id: number, newName: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onShare: (id: number) => Promise<{ share_url: string }>;
}

/** Formats file sizes into human-readable strings */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Formats ISO date into short localized format */
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

/** Returns file type badge */
function fileBadge(contentType: string, name: string) {
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
  let color = "text-slate bg-slate/10 border-slate/25";

  if (isPdf) { label = "PDF"; color = "text-red-400 bg-red-500/10 border-red-500/30"; }
  else if (isDoc) { label = "DOC"; color = "text-blue-400 bg-blue-500/10 border-blue-500/30"; }
  else if (isSheet) { label = "XLS"; color = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"; }
  else if (isPresentation) { label = "PPT"; color = "text-orange-400 bg-orange-500/10 border-orange-500/30"; }
  else if (isVideo) { label = "VID"; color = "text-purple-400 bg-purple-500/10 border-purple-500/30"; }
  else if (isAudio) { label = "AUD"; color = "text-pink-400 bg-pink-500/10 border-pink-500/30"; }
  else if (isImage) { label = "IMG"; color = "text-cyan-400 bg-cyan-500/10 border-cyan-500/30"; }
  else if (isCode) { label = ext.toUpperCase().slice(0, 3); color = "text-amber-400 bg-amber-500/10 border-amber-500/30"; }
  else if (isArchive) { label = "ZIP"; color = "text-slate-300 bg-slate-500/10 border-slate-500/30"; }

  return (
    <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-xs border leading-none ${color}`}>
      {label}
    </span>
  );
}

export default function FileCard({
  file,
  downloadUrl,
  onRename,
  onDelete,
  onShare,
}: FileCardProps) {
  const [renaming, setRenaming] = useState(false);
  const [nameValue, setNameValue] = useState(file.Name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const submittingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const startRename = () => {
    setMenuOpen(false);
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
    setMenuOpen(false);
    setBusy(true);
    setActionError(null);
    try {
      const result = await onShare(file.ID);
      setShareUrl(result.share_url);
    } catch {
      setActionError("Could not generate share link.");
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
      setActionError("Could not delete file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        className="group relative bg-[#101319] hover:bg-[#161B23] border border-slate/20
          hover:border-slate/40 rounded-sm p-4 sm:p-5 flex flex-col justify-between transition-all shadow-xs"
      >
        <div className="flex items-start justify-between gap-3">
          {/* File Type Badge */}
          {fileBadge(file.ContentType, file.Name)}

          {/* Three-Dot Menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-sm text-slate hover:text-paper hover:bg-slate/15 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
              aria-label="File options"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1.2" />
                <circle cx="12" cy="5" r="1.2" />
                <circle cx="12" cy="19" r="1.2" />
              </svg>
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-8 w-44 bg-[#181C24] border border-slate/25 rounded-sm shadow-xl py-1.5 z-20"
              >
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-left px-4 py-2 text-xs font-medium text-paper/85 hover:text-paper hover:bg-slate/15 transition-colors"
                >
                  Open in browser
                </a>
                <a
                  href={`${downloadUrl}?download=true`}
                  download={file.Name}
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-left px-4 py-2 text-xs font-medium text-paper/85 hover:text-paper hover:bg-slate/15 transition-colors"
                >
                  Download
                </a>
                <button
                  onClick={handleShare}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-paper/85 hover:text-paper hover:bg-slate/15 transition-colors cursor-pointer"
                >
                  Share link
                </button>
                <button
                  onClick={startRename}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-paper/85 hover:text-paper hover:bg-slate/15 transition-colors cursor-pointer"
                >
                  Rename
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmDelete(true);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* File Name */}
        <div className="mt-4">
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
                e.stopPropagation();
              }}
              disabled={busy}
              className="w-full text-sm font-semibold border border-brass bg-transparent rounded-xs px-2 py-1
                text-paper focus:outline-none disabled:opacity-50"
            />
          ) : (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-paper hover:text-brass hover:underline truncate block transition-colors leading-snug"
              title={`Open ${file.Name} in browser`}
            >
              {file.Name}
            </a>
          )}

          {/* Meta: Size + Date */}
          <div className="flex items-center justify-between text-xs text-slate/75 mt-1.5 font-mono">
            <span>{formatSize(file.Size)}</span>
            <span className="font-sans">{formatDate(file.UpdatedAt || file.CreatedAt)}</span>
          </div>

          {/* Shared Pill indicator if file is shared */}
          {file.ShareToken && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-brass font-medium">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>Shared link active</span>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {shareUrl && (
        <ShareModal shareUrl={shareUrl} onClose={() => setShareUrl(null)} />
      )}

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${file.Name}"?`}
          message="This file will be permanently removed from your vault and cannot be recovered."
          confirmLabel="Delete file"
          destructive
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
