"use client";

import { useRef, useState } from "react";
import type { VaultFolder } from "../../../lib/api";
import { FolderNotEmptyError } from "../../../lib/api";
import ConfirmDialog from "./ConfirmDialog";

interface FolderRowProps {
  folder: VaultFolder;
  onOpen: (folder: VaultFolder) => void;
  onRename: (id: number, newName: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function FolderRow({ folder, onOpen, onRename, onDelete }: FolderRowProps) {
  const [renaming, setRenaming] = useState(false);
  const [nameValue, setNameValue] = useState(folder.Name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submittingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    submittingRef.current = false;
    setNameValue(folder.Name);
    setRenaming(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const submitRename = async () => {
    if (submittingRef.current) return;
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === folder.Name) {
      submittingRef.current = true;
      setRenaming(false);
      setNameValue(folder.Name);
      return;
    }
    submittingRef.current = true;
    setBusy(true);
    try {
      await onRename(folder.ID, trimmed);
      setRenaming(false);
    } catch {
      submittingRef.current = false;
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteError(null);
    setBusy(true);
    try {
      await onDelete(folder.ID);
      setConfirmDelete(false);
    } catch (err) {
      setConfirmDelete(false);
      if (err instanceof FolderNotEmptyError) {
        setDeleteError(err.message);
      } else {
        setDeleteError("Could not delete the folder. Try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        className="group flex items-center gap-4 px-5 py-3.5 border-b border-slate/15
          hover:bg-[#151921] transition-colors cursor-pointer bg-[#0E1116]"
        onClick={() => !renaming && onOpen(folder)}
        role="row"
      >
        {/* Folder icon */}
        <div className="w-9 h-9 rounded-sm bg-brass/10 border border-brass/30 flex items-center justify-center text-brass shrink-0">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </div>

        {/* Name — inline edit or plain text */}
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
                setNameValue(folder.Name);
              }
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            disabled={busy}
            className="flex-1 text-sm font-semibold border border-brass bg-transparent rounded-sm px-2.5 py-1
              text-paper focus:outline-none disabled:opacity-50"
            aria-label="Rename folder"
          />
        ) : (
          <span className="flex-1 text-sm font-semibold text-paper truncate">{folder.Name}</span>
        )}

        {/* Type indicator column */}
        <span className="text-xs text-slate/70 w-24 hidden md:block">Folder</span>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {/* Action buttons — visible on hover/focus-within */}
          <div
            className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100
              transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={startRename}
              className="text-xs font-medium text-slate hover:text-paper px-2.5 py-1.5 rounded-sm
                transition-colors focus-visible:outline-brass hover:bg-slate/15 cursor-pointer"
              aria-label={`Rename ${folder.Name}`}
            >
              Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteError(null);
                setConfirmDelete(true);
              }}
              className="text-xs font-medium text-slate hover:text-red-400 px-2.5 py-1.5 rounded-sm
                transition-colors focus-visible:outline-brass hover:bg-red-500/10 cursor-pointer"
              aria-label={`Delete ${folder.Name}`}
            >
              Delete
            </button>
          </div>

          {/* Enter chevron */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden
            className="text-slate/40 group-hover:text-slate transition-colors"
          >
            <path
              d="M5 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Delete error message (folder not empty etc.) */}
      {deleteError && (
        <div
          role="alert"
          className="px-4 py-2 bg-red-950/80 border-b border-red-800 flex items-center justify-between gap-4"
        >
          <p className="text-xs text-red-200">{deleteError}</p>
          <button
            onClick={() => setDeleteError(null)}
            className="text-xs text-red-400 hover:text-red-200 shrink-0 focus-visible:outline-brass"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${folder.Name}"?`}
          message="This will permanently delete the folder. The folder must be empty before it can be deleted."
          confirmLabel="Delete folder"
          destructive
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
