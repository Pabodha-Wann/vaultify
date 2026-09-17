"use client";

import { useState } from "react";
import type { VaultFolder } from "../../../lib/api";
import { api } from "../../../lib/api";

interface FolderTreeItemProps {
  folder: VaultFolder;
  activeFolderId: number | null;
  onSelectFolder: (folder: VaultFolder) => void;
  depth?: number;
}

export default function FolderTreeItem({
  folder,
  activeFolderId,
  onSelectFolder,
  depth = 0,
}: FolderTreeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<VaultFolder[]>([]);
  const [loaded, setLoaded] = useState(false);

  const isActive = activeFolderId === folder.ID;

  const toggleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!expanded && !loaded) {
      setLoading(true);
      try {
        const subFolders = await api.listFolders(folder.ID);
        setChildren(subFolders ?? []);
        setLoaded(true);
      } catch {
        // If fetch fails, keep empty
      } finally {
        setLoading(false);
      }
    }
    setExpanded(!expanded);
  };

  return (
    <div className="select-none">
      <div
        onClick={() => onSelectFolder(folder)}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        className={`group flex items-center gap-2 py-2 pr-2.5 rounded-sm cursor-pointer transition-colors text-sm
          ${
            isActive
              ? "bg-brass/15 text-brass font-semibold"
              : "text-paper/70 hover:text-paper hover:bg-slate/10"
          }`}
      >
        {/* Expand / Collapse Chevron */}
        <button
          onClick={toggleExpand}
          className="p-1 text-slate hover:text-paper rounded-xs transition-colors shrink-0 cursor-pointer"
          aria-label={expanded ? "Collapse folder" : "Expand folder"}
        >
          {loading ? (
            <svg
              className="animate-spin w-3.5 h-3.5 text-slate"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 12 12"
              fill="none"
              className={`transition-transform duration-150 ${expanded ? "rotate-90 text-paper/80" : "text-slate/60"}`}
            >
              <path
                d="M4.5 2.5L8 6l-3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Folder Icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 ${isActive ? "text-brass" : "text-slate group-hover:text-paper/80"}`}
        >
          <path
            d="M1.5 4.5A1.5 1.5 0 013 3h3l1.5 2h5.5A1.5 1.5 0 0114.5 6.5v6a1.5 1.5 0 01-1.5 1.5H3a1.5 1.5 0 01-1.5-1.5v-8z"
            fill="currentColor"
            fillOpacity={isActive ? "0.3" : "0.15"}
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>

        {/* Folder Name */}
        <span className="truncate flex-1 font-medium">{folder.Name}</span>
      </div>

      {/* Children */}
      {expanded && (
        <div className="space-y-0.5">
          {children.length === 0 && loaded ? (
            <div
              style={{ paddingLeft: `${(depth + 1) * 14 + 20}px` }}
              className="py-1 text-xs text-slate/50 italic"
            >
              Empty folder
            </div>
          ) : (
            children.map((child) => (
              <FolderTreeItem
                key={child.ID}
                folder={child}
                activeFolderId={activeFolderId}
                onSelectFolder={onSelectFolder}
                depth={depth + 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
