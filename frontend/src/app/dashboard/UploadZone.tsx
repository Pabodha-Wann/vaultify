"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { axiosInstance } from "../../../lib/api";
import type { VaultFile } from "../../../lib/api";

export interface UploadZoneHandle {
  openFilePicker: () => void;
}

interface UploadZoneProps {
  currentFolderId: number | null;
  onUploadComplete: (file: VaultFile) => void;
}

const UploadZone = forwardRef<UploadZoneHandle, UploadZoneProps>(function UploadZone(
  { currentFolderId, onUploadComplete },
  ref
) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentFileName, setCurrentFileName] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useImperativeHandle(ref, () => ({
    openFilePicker: () => {
      inputRef.current?.click();
    },
  }));

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setCurrentFileName(file.name);
      setProgress(0);
      setError(null);

      const form = new FormData();
      form.append("file", file);
      if (currentFolderId != null) {
        form.append("folder_id", String(currentFolderId));
      }

      try {
        const res = await axiosInstance.post<VaultFile>("/files", form, {
          timeout: 0,
          onUploadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
          },
        });
        onUploadComplete(res.data);
      } catch (err: unknown) {
        let msg = "Upload failed. Check your connection and try again.";
        if (typeof err === "object" && err !== null && "response" in err) {
          const res = (err as { response?: { data?: unknown } }).response;
          if (typeof res?.data === "string") {
            msg = res.data;
          } else if (typeof res?.data === "object" && res?.data !== null && "message" in res.data) {
            msg = String((res.data as { message: unknown }).message);
          }
        }
        setError(msg);
      } finally {
        setUploading(false);
        setProgress(0);
        setCurrentFileName("");
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [currentFolderId, onUploadComplete]
  );

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadFile(files[0]);
  };

  // Window-wide drag and drop listeners
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
        setDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragging(false);
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [uploadFile]);

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        tabIndex={-1}
        aria-hidden
      />

      {/* Full-area drag overlay */}
      {dragging && (
        <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-xs border-2 border-dashed border-brass flex flex-col items-center justify-center p-6 text-center pointer-events-none select-none">
          <div className="w-16 h-16 rounded-sm bg-brass/15 border border-brass/40 flex items-center justify-center text-brass mb-3 animate-pulse">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="text-base font-semibold text-paper">Drop files here to upload</p>
          <p className="text-xs text-slate/80 mt-1">Upload directly into your vault</p>
        </div>
      )}

      {/* Floating Upload Progress Box */}
      {uploading && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1A1E24] border border-slate/25 shadow-2xl rounded-sm p-3.5 w-72 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-paper font-medium truncate">{currentFileName}</span>
            <span className="text-brass font-mono font-bold shrink-0">{progress}%</span>
          </div>
          <div className="h-1 bg-slate/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-brass transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate/70">Uploading to encrypted vault…</p>
        </div>
      )}

      {/* Floating Error Notification */}
      {error && (
        <div
          role="alert"
          className="fixed bottom-5 right-5 z-50 bg-red-950 border border-red-800 text-red-200 text-xs px-4 py-2.5 rounded-sm shadow-xl flex items-center gap-3"
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-200 ml-auto font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
});

export default UploadZone;
