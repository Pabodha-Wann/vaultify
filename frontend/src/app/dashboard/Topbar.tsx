"use client";

import NewFolderButton from "./NewFolderButton";

interface TopbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onCreateFolder: (name: string) => Promise<void>;
  onUploadClick: () => void;
}

export default function Topbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onCreateFolder,
  onUploadClick,
}: TopbarProps) {
  return (
    <header className="h-16 flex items-center justify-between px-5 sm:px-8 border-b border-slate/15 bg-[#08090C] gap-4 shrink-0">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm sm:max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate/60">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search files & folders…"
          className="w-full pl-10 pr-4 py-2 text-sm bg-[#12141A] border border-slate/25 rounded-sm
            text-paper placeholder:text-slate/60 focus:outline-none focus:border-brass transition-colors"
          aria-label="Filter current folder"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate/60 hover:text-paper text-sm"
            aria-label="Clear filter"
          >
            ✕
          </button>
        )}
      </div>

      {/* Right Controls: View Toggle + Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Grid / List Toggle */}
        <div className="flex items-center border border-slate/25 bg-[#12141A] rounded-sm p-0.5">
          <button
            onClick={() => onViewModeChange("grid")}
            title="Grid view"
            className={`p-2 rounded-xs transition-colors cursor-pointer ${
              viewMode === "grid"
                ? "bg-slate/20 text-brass shadow-xs"
                : "text-slate hover:text-paper"
            }`}
            aria-label="Grid view"
          >
            {/* Grid icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>

          <button
            onClick={() => onViewModeChange("list")}
            title="List view"
            className={`p-2 rounded-xs transition-colors cursor-pointer ${
              viewMode === "list"
                ? "bg-slate/20 text-brass shadow-xs"
                : "text-slate hover:text-paper"
            }`}
            aria-label="List view"
          >
            {/* List icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>

        <div className="h-5 w-px bg-slate/20 hidden sm:block" />

        {/* New Folder Button */}
        <NewFolderButton onCreateFolder={onCreateFolder} />

        {/* Primary Upload Button */}
        <button
          onClick={onUploadClick}
          className="flex items-center gap-2 text-sm font-semibold bg-brass text-ink hover:bg-brass/90
            rounded-sm px-4 py-2 transition-all focus-visible:outline-brass shadow-sm cursor-pointer shrink-0"
        >
          {/* Upload arrow */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>Upload</span>
        </button>
      </div>
    </header>
  );
}
