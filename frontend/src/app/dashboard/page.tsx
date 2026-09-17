"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../lib/api";
import type { VaultFile, VaultFolder } from "../../../lib/api";

import Sidebar, { NavView } from "./Sidebar";
import Topbar from "./Topbar";
import Breadcrumb from "./Breadcrumb";
import type { BreadcrumbSegment } from "./Breadcrumb";
import Skeleton from "./Skeleton";
import FolderCard from "./FolderCard";
import FileCard from "./FileCard";
import FolderRow from "./FolderRow";
import FileRow from "./FileRow";
import UploadZone, { UploadZoneHandle } from "./UploadZone";

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState<NavView>("files");
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbSegment[]>([
    { id: null, name: "My Files" },
  ]);

  const [rootFolders, setRootFolders] = useState<VaultFolder[]>([]);
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const uploadZoneRef = useRef<UploadZoneHandle>(null);

  // ── Data Fetching ────────────────────────────────────────────────────────
  const loadContents = useCallback(async (folderId: number | null) => {
    setLoading(true);
    setFetchError(null);
    try {
      const [fetchedFolders, fetchedFiles] = await Promise.all([
        api.listFolders(folderId),
        api.listFiles(folderId),
      ]);
      setFolders(fetchedFolders ?? []);
      setFiles(fetchedFiles ?? []);

      // If at root level, also keep rootFolders updated for the sidebar tree
      if (folderId === null) {
        setRootFolders(fetchedFolders ?? []);
      }
    } catch {
      setFetchError("Couldn't load contents from your vault. Check connection and refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch initial or on folder change (when in "files" view)
  useEffect(() => {
    if (activeNav === "files") {
      loadContents(currentFolderId);
    }
  }, [currentFolderId, activeNav, loadContents]);

  // Initial fetch for rootFolders if starting with a deep link or switching views
  useEffect(() => {
    if (rootFolders.length === 0 && currentFolderId !== null) {
      api.listFolders(null).then((rf) => setRootFolders(rf ?? []));
    }
  }, [currentFolderId, rootFolders.length]);

  // ── Navigation ───────────────────────────────────────────────────────────
  const openFolder = (folder: VaultFolder) => {
    setActiveNav("files");
    setCurrentFolderId(folder.ID);
    setBreadcrumb((prev) => [...prev, { id: folder.ID, name: folder.Name }]);
    setSearchQuery("");
  };

  const navigateTo = (id: number | null) => {
    setActiveNav("files");
    const idx = breadcrumb.findIndex((s) => s.id === id);
    if (idx === -1) {
      // Direct jump from sidebar
      if (id === null) {
        setBreadcrumb([{ id: null, name: "My Files" }]);
      }
    } else {
      setBreadcrumb((prev) => prev.slice(0, idx + 1));
    }
    setCurrentFolderId(id);
    setSearchQuery("");
  };

  const handleSelectNav = (view: NavView) => {
    setActiveNav(view);
    setSearchQuery("");
    if (view === "shared") {
      setBreadcrumb([{ id: null, name: "Shared by me" }]);
    } else {
      setCurrentFolderId(null);
      setBreadcrumb([{ id: null, name: "My Files" }]);
    }
  };

  const handleSelectFolderFromTree = (folder: VaultFolder) => {
    setActiveNav("files");
    setCurrentFolderId(folder.ID);
    // Build single segment or reconstruct breadcrumb
    setBreadcrumb([
      { id: null, name: "My Files" },
      { id: folder.ID, name: folder.Name },
    ]);
    setSearchQuery("");
  };

  // ── Folder mutations ─────────────────────────────────────────────────────
  const handleCreateFolder = async (name: string) => {
    const newFolder = await api.createFolder(name, currentFolderId);
    setFolders((prev) => [...prev, newFolder]);
    if (currentFolderId === null) {
      setRootFolders((prev) => [...prev, newFolder]);
    }
  };

  const handleRenameFolder = async (id: number, newName: string) => {
    await api.renameFolder(id, newName);
    setFolders((prev) =>
      prev.map((f) => (f.ID === id ? { ...f, Name: newName } : f))
    );
    setRootFolders((prev) =>
      prev.map((f) => (f.ID === id ? { ...f, Name: newName } : f))
    );
  };

  const handleDeleteFolder = async (id: number) => {
    await api.deleteFolder(id);
    setFolders((prev) => prev.filter((f) => f.ID !== id));
    setRootFolders((prev) => prev.filter((f) => f.ID !== id));
  };

  // ── File mutations ───────────────────────────────────────────────────────
  const handleUploadComplete = (file: VaultFile) => {
    setFiles((prev) => [file, ...prev]);
  };

  const handleRenameFile = async (id: number, newName: string) => {
    await api.renameFile(id, newName);
    setFiles((prev) =>
      prev.map((f) => (f.ID === id ? { ...f, Name: newName } : f))
    );
  };

  const handleDeleteFile = async (id: number) => {
    await api.deleteFile(id);
    setFiles((prev) => prev.filter((f) => f.ID !== id));
  };

  const handleShareFile = async (id: number) => {
    const res = await api.shareFile(id);
    // Update local ShareToken to keep "Shared by me" view in sync
    setFiles((prev) =>
      prev.map((f) => (f.ID === id ? { ...f, ShareToken: "active" } : f))
    );
    return res;
  };

  // ── Auth ─────────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    window.location.replace("/");
  };

  // ── Derived Data & Search Filtering ──────────────────────────────────────
  const displayedFolders = useMemo(() => {
    if (activeNav === "shared") return []; // Shared by me only shows files
    if (!searchQuery.trim()) return folders;
    const q = searchQuery.toLowerCase();
    return folders.filter((f) => f.Name.toLowerCase().includes(q));
  }, [activeNav, folders, searchQuery]);

  const displayedFiles = useMemo(() => {
    let list = files;
    if (activeNav === "shared") {
      list = list.filter((f) => f.ShareToken !== null && f.ShareToken !== "");
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((f) => f.Name.toLowerCase().includes(q));
  }, [activeNav, files, searchQuery]);

  const isEmpty =
    !loading && displayedFolders.length === 0 && displayedFiles.length === 0;

  return (
    <div className="h-screen w-screen flex bg-ink text-paper overflow-hidden select-none">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeView={activeNav}
        onSelectView={handleSelectNav}
        rootFolders={rootFolders}
        activeFolderId={currentFolderId}
        onSelectFolder={handleSelectFolderFromTree}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Topbar: Search, View Mode, New Folder, Upload */}
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCreateFolder={handleCreateFolder}
          onUploadClick={() => uploadZoneRef.current?.openFilePicker()}
        />

        {/* Global Drag & Drop Upload Overlay & Toast */}
        <UploadZone
          ref={uploadZoneRef}
          currentFolderId={activeNav === "shared" ? null : currentFolderId}
          onUploadComplete={handleUploadComplete}
        />

        {/* Secondary Subheader: Breadcrumb & Stats */}
        <div className="h-12 px-5 sm:px-8 border-b border-slate/15 flex items-center justify-between bg-[#0A0C10] shrink-0">
          <Breadcrumb path={breadcrumb} onNavigate={navigateTo} />

          <div className="text-xs text-slate/80 font-medium hidden sm:block">
            {activeNav === "shared"
              ? `${displayedFiles.length} shared ${displayedFiles.length === 1 ? "file" : "files"}`
              : `${displayedFolders.length} ${displayedFolders.length === 1 ? "folder" : "folders"}, ${displayedFiles.length} ${displayedFiles.length === 1 ? "file" : "files"}`}
          </div>
        </div>

        {/* Main Content Body */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar bg-[#07080A]">
          {/* Fetch Error Notification */}
          {fetchError && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 bg-red-950 border border-red-800 rounded-sm text-sm text-red-200 shadow-md"
            >
              {fetchError}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <Skeleton viewMode={viewMode} />
          ) : isEmpty ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-28 text-center gap-3.5">
              <div className="w-16 h-16 rounded-sm bg-slate/10 border border-slate/20 flex items-center justify-center text-slate/40">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <p className="text-base font-semibold text-paper">
                {searchQuery
                  ? `No matching items found for "${searchQuery}"`
                  : activeNav === "shared"
                  ? "No shared files yet"
                  : "This vault folder is empty"}
              </p>
              <p className="text-sm text-slate/80 max-w-sm leading-relaxed">
                {searchQuery
                  ? "Try searching for a different keyword or clear the filter."
                  : activeNav === "shared"
                  ? "Generate a share link from any file's options menu to share it."
                  : "Drag and drop any files here or click Upload above to get started."}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            /* ── GRID VIEW ───────────────────────────────────────────────── */
            <div className="space-y-7">
              {/* Folders Section */}
              {displayedFolders.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate/80 mb-3">
                    Folders
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                    {displayedFolders.map((folder) => (
                      <FolderCard
                        key={folder.ID}
                        folder={folder}
                        onOpen={openFolder}
                        onRename={handleRenameFolder}
                        onDelete={handleDeleteFolder}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Files Section */}
              {displayedFiles.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate/80 mb-3">
                    Files
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                    {displayedFiles.map((file) => (
                      <FileCard
                        key={file.ID}
                        file={file}
                        downloadUrl={api.downloadUrl(file.ID)}
                        onRename={handleRenameFile}
                        onDelete={handleDeleteFile}
                        onShare={handleShareFile}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── LIST VIEW ───────────────────────────────────────────────── */
            <div
              className="border border-slate/15 rounded-sm overflow-hidden bg-[#0E1116] shadow-xs"
              role="table"
              aria-label="Vault contents"
            >
              {/* Table Header */}
              <div className="flex items-center gap-4 px-5 py-3 border-b border-slate/15 bg-[#0A0C10] text-xs font-bold uppercase tracking-wider text-slate/75">
                <span className="w-8 shrink-0 text-center">Type</span>
                <span className="flex-1">Name</span>
                <span className="text-right w-24 hidden sm:block">Size</span>
                <span className="text-right w-28 hidden md:block">Modified</span>
                <span className="w-16 shrink-0 text-right">Actions</span>
              </div>

              {/* Folders first */}
              {displayedFolders.map((folder) => (
                <FolderRow
                  key={`folder-${folder.ID}`}
                  folder={folder}
                  onOpen={openFolder}
                  onRename={handleRenameFolder}
                  onDelete={handleDeleteFolder}
                />
              ))}

              {/* Files */}
              {displayedFiles.map((file) => (
                <FileRow
                  key={`file-${file.ID}`}
                  file={file}
                  downloadUrl={api.downloadUrl(file.ID)}
                  onRename={handleRenameFile}
                  onDelete={handleDeleteFile}
                  onShare={handleShareFile}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}