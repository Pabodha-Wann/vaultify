"use client";

import { useEffect, useRef, useState } from "react";
import type { VaultFolder } from "../../../lib/api";
import { FolderNotEmptyError } from "../../../lib/api";
import ConfirmDialog from "./ConfirmDialog";

interface FolderCardProps {
  folder: VaultFolder;
  onOpen: (folder: VaultFolder) => void;
  onRename: (id: number, newName: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function FolderCard({
  folder,
  onOpen,
  onRename,
  onDelete,
}: FolderCardProps) {
  const [renaming, setRenaming] = useState(false);
  const [nameValue, setNameValue] = useState(folder.Name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
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
        setDeleteError("Could not delete folder. Try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        onClick={() => !renaming && onOpen(folder)}
        className="group relative bg-[#101319] hover:bg-[#161B23] border border-slate/20
          hover:border-slate/40 rounded-sm p-4 sm:p-5 flex flex-col justify-between transition-all
          cursor-pointer select-none shadow-xs"
      >
        <div className="flex items-start justify-between gap-3">
          {/* Folder Icon */}
          <div className="w-11 h-11 rounded-sm bg-brass/15 border border-brass/35 flex items-center justify-center text-brass shrink-0 shadow-xs">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.75">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>

          {/* Three-Dot Menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-sm text-slate hover:text-paper hover:bg-slate/15 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
              aria-label="Folder options"
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
                className="absolute right-0 top-8 w-36 bg-[#181C24] border border-slate/25 rounded-sm shadow-xl py-1.5 z-20"
              >
                <button
                  onClick={startRename}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-paper/80 hover:text-paper hover:bg-slate/15 transition-colors cursor-pointer"
                >
                  Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    setDeleteError(null);
                    setConfirmDelete(true);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Name / Inline Rename */}
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
                  setNameValue(folder.Name);
                }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              disabled={busy}
              className="w-full text-sm font-semibold border border-brass bg-transparent rounded-xs px-2 py-1
                text-paper focus:outline-none disabled:opacity-50"
            />
          ) : (
            <p className="text-sm font-semibold text-paper truncate leading-snug" title={folder.Name}>
              {folder.Name}
            </p>
          )}
          <span className="text-xs text-slate/70 mt-1 block">Folder</span>
        </div>
      </div>

      {/* Delete error notification */}
      {deleteError && (
        <div
          role="alert"
          className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-red-950 border border-red-800 rounded-sm text-xs text-red-200 shadow-xl flex items-center gap-3"
        >
          <span>{deleteError}</span>
          <button
            onClick={() => setDeleteError(null)}
            className="text-red-400 hover:text-red-200 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${folder.Name}"?`}
          message="This folder and its contents must be completely empty before it can be deleted."
          confirmLabel="Delete folder"
          destructive
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
