"use client";

import type { VaultFolder } from "../../../lib/api";
import FolderTreeItem from "./FolderTreeItem";

export type NavView = "files" | "shared";

interface SidebarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  rootFolders: VaultFolder[];
  activeFolderId: number | null;
  onSelectFolder: (folder: VaultFolder) => void;
  onSignOut: () => void;
}

export default function Sidebar({
  activeView,
  onSelectView,
  rootFolders,
  activeFolderId,
  onSelectFolder,
  onSignOut,
}: SidebarProps) {
  return (
    <aside className="w-68 shrink-0 bg-[#0C0E12] border-r border-slate/15 flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate/15 shrink-0">
        <div className="w-8 h-8 rounded-sm bg-brass/15 border border-brass/40 flex items-center justify-center text-brass shadow-xs">
          {/* Vault Keyhole Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <span className="font-serif text-2xl tracking-tight text-paper font-semibold">
          Vaultify
        </span>
      </div>

      {/* Main Nav Items */}
      <div className="px-3 pt-4 pb-2 space-y-1.5 shrink-0">
        {/* My Files */}
        <button
          onClick={() => onSelectView("files")}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-sm font-medium transition-colors cursor-pointer
            ${
              activeView === "files" && activeFolderId === null
                ? "bg-brass/15 text-brass border-l-2 border-brass font-semibold"
                : "text-paper/70 hover:text-paper hover:bg-slate/10"
            }`}
        >
          {/* Files / Folder Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span>My Files</span>
        </button>

        {/* Shared by me */}
        <button
          onClick={() => onSelectView("shared")}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-sm font-medium transition-colors cursor-pointer
            ${
              activeView === "shared"
                ? "bg-brass/15 text-brass border-l-2 border-brass font-semibold"
                : "text-paper/70 hover:text-paper hover:bg-slate/10"
            }`}
        >
          {/* Share Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>Shared by me</span>
        </button>
      </div>

      {/* Folders Section Heading */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider uppercase text-slate/80">
          Folders
        </span>
      </div>

      {/* Folder Tree (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-2.5 space-y-0.5 custom-scrollbar">
        {rootFolders.length === 0 ? (
          <p className="text-xs text-slate/50 px-3 py-2 italic">
            No folders created yet
          </p>
        ) : (
          rootFolders.map((folder) => (
            <FolderTreeItem
              key={folder.ID}
              folder={folder}
              activeFolderId={activeView === "files" ? activeFolderId : null}
              onSelectFolder={(f) => {
                onSelectView("files");
                onSelectFolder(f);
              }}
              depth={0}
            />
          ))
        )}
      </div>

      {/* User Identity & Logout (Bottom) */}
      <div className="p-3.5 border-t border-slate/15 bg-[#090B0E] shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-sm bg-slate/20 border border-slate/30 flex items-center justify-center text-paper font-mono text-sm font-bold shrink-0">
            V
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-paper truncate leading-tight">Vault Owner</p>
            <p className="text-xs text-slate/70 truncate">Personal Vault</p>
          </div>
        </div>

        <button
          onClick={onSignOut}
          title="Sign out"
          className="text-slate hover:text-red-400 p-2 rounded-sm hover:bg-slate/10 transition-colors focus-visible:outline-brass shrink-0 cursor-pointer"
          aria-label="Sign out"
        >
          {/* Logout icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
