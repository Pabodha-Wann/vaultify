"use client";

import { useRef, useState } from "react";

interface NewFolderButtonProps {
  onCreateFolder: (name: string) => Promise<void>;
}

export default function NewFolderButton({ onCreateFolder }: NewFolderButtonProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openInput = () => {
    submittingRef.current = false;
    setName("");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const submittingRef = useRef(false);

  const submit = async () => {
    if (submittingRef.current) return;
    const trimmed = name.trim();
    if (!trimmed) {
      submittingRef.current = true;
      setEditing(false);
      return;
    }
    submittingRef.current = true;
    setBusy(true);
    try {
      await onCreateFolder(trimmed);
      setEditing(false);
      setName("");
    } catch {
      submittingRef.current = false;
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      submittingRef.current = true;
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={submit}
          disabled={busy}
          placeholder="Folder name"
          className="text-sm border border-brass bg-[#12141A] rounded-sm px-3 py-2
            text-paper placeholder:text-slate/50 focus:outline-none disabled:opacity-50 w-52"
          aria-label="New folder name"
        />
        <span className="text-xs text-slate/70 hidden lg:inline">Enter to save · Esc to cancel</span>
      </div>
    );
  }

  return (
    <button
      onClick={openInput}
      className="flex items-center gap-2 text-sm font-medium text-paper/85 hover:text-paper bg-[#181B22]
        hover:bg-[#20252F] border border-slate/25 rounded-sm px-4 py-2 transition-colors
        focus-visible:outline-brass cursor-pointer"
    >
      {/* Plus icon */}
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M7 1v12M1 7h12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span>New folder</span>
    </button>
  );
}
