import axios, { AxiosError } from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // session cookie sent cross-origin
});

// On 401: session expired / not logged in → send back to landing page
axiosInstance.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      window.location.replace("/");
    }
    return Promise.reject(err);
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VaultFile {
  ID: number;
  OwnerID: number;
  FolderID: number | null;
  Name: string;
  Size: number;
  ContentType: string;
  StorageKey: string;
  ShareToken: string | null;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface VaultFolder {
  ID: number;
  OwnerID: number;
  ParentID: number | null;
  Name: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export class FolderNotEmptyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FolderNotEmptyError";
  }
}

// ─── API methods ──────────────────────────────────────────────────────────────

export const api = {
  listFiles: (folderId?: number | null): Promise<VaultFile[]> =>
    axiosInstance
      .get<VaultFile[]>(`/files${folderId != null ? `?folder_id=${folderId}` : ""}`)
      .then((r) => r.data),

  listFolders: (parentId?: number | null): Promise<VaultFolder[]> =>
    axiosInstance
      .get<VaultFolder[]>(
        `/folders${parentId != null ? `?parent_id=${parentId}` : ""}`
      )
      .then((r) => r.data),

  createFolder: (name: string, parentId: number | null): Promise<VaultFolder> =>
    axiosInstance
      .post<VaultFolder>("/folders", { name, parent_id: parentId })
      .then((r) => r.data),

  uploadFile: (
    file: File,
    folderId: number | null,
    onProgress?: (pct: number) => void
  ): Promise<VaultFile> => {
    const form = new FormData();
    form.append("file", file);
    if (folderId != null) form.append("folder_id", String(folderId));
    return axiosInstance
      .post<VaultFile>("/files", form, {
        timeout: 0,
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      })
      .then((r) => r.data);
  },

  renameFile: (id: number, name: string): Promise<void> =>
    axiosInstance.patch(`/files/${id}`, { name }).then(() => {}),

  renameFolder: (id: number, name: string): Promise<void> =>
    axiosInstance.patch(`/folders/${id}`, { name }).then(() => {}),

  deleteFile: (id: number): Promise<void> =>
    axiosInstance.delete(`/files/${id}`).then(() => {}),

  deleteFolder: async (id: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/folders/${id}`);
    } catch (err) {
      const axErr = err as AxiosError;
      if (axErr.response?.status === 409) {
        const msg =
          typeof axErr.response.data === "string"
            ? axErr.response.data
            : "This folder isn't empty. Remove everything inside before deleting it.";
        throw new FolderNotEmptyError(msg);
      }
      throw err;
    }
  },

  shareFile: (id: number): Promise<{ share_url: string }> =>
    axiosInstance
      .post<{ share_url: string }>(`/files/${id}/share`)
      .then((r) => r.data),

  downloadUrl: (id: number): string => `${API_URL}/files/${id}/download`,
};