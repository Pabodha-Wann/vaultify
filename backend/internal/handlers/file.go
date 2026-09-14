package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/Pabodha-Wann/vaultify/internal/middleware"
	"github.com/Pabodha-Wann/vaultify/internal/services"
	"github.com/go-chi/chi/v5"
)

type FileHandler struct {
	fileService *services.FileService
	userService *services.UserService
}

func NewFileHandler(fileService *services.FileService, userService *services.UserService) *FileHandler {
	return &FileHandler{fileService: fileService, userService: userService}
}

// converts the session's claims (Asgardeo's sub/username) into the real numeric User.ID stored in database.
func (h *FileHandler) getOwnerID(r *http.Request) (uint, error) {
	claims, ok := middleware.ClaimsFromContext(r)

	if !ok {
		return 0, fmt.Errorf("unauthorized")
	}

	user, err := h.userService.LoginOrRegister(claims.Sub, claims.Username)
	if err != nil {
		return 0, err
	}
	return user.ID, nil

}

// POST /files
func (h *FileHandler) Upload(w http.ResponseWriter, r *http.Request) {
	ownerID, err := h.getOwnerID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	//the max amount ParseMultipartForm will buffer in memory before spilling to temp files.
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		http.Error(w, "failed to parse form", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "missing file field", http.StatusBadRequest)
		return
	}
	defer file.Close()

	var folderID *uint
	if raw := r.FormValue("folder_id"); raw != "" {
		id, err := strconv.ParseUint(raw, 10, 64)
		if err != nil {
			http.Error(w, "invalid folder_id", http.StatusBadRequest)
			return
		}
		val := uint(id)
		folderID = &val
	}

	uploaded, err := h.fileService.UploadFile(
		r.Context(), ownerID, folderID, header.Filename, header.Header.Get("Content-Type"), file, header.Size,
	)
	if err != nil {
		http.Error(w, fmt.Sprintf("upload failed: %v", err), http.StatusInternalServerError)
		return
	}

	//responding with the new file metadata
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(uploaded)
}

// GET /files/{id}/download
func (h *FileHandler) Download(w http.ResponseWriter, r *http.Request) {
	ownerID, err := h.getOwnerID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	idParam := chi.URLParam(r, "id")
	fileID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		http.Error(w, "invalid file id", http.StatusBadRequest)
		return
	}

	file, stream, err := h.fileService.DownloadFile(r.Context(), uint(fileID), ownerID)
	if err != nil {
		http.Error(w, fmt.Sprintf("download failed:%v", err), http.StatusNotFound)
		return
	}

	defer stream.Close()

	w.Header().Set("Content-Type", file.ContentType)
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, file.Name))
	io.Copy(w, stream)

}

// List handles GET /files
func (h *FileHandler) List(w http.ResponseWriter, r *http.Request) {
	ownerID, err := h.getOwnerID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	files, err := h.fileService.ListFiles(ownerID)
	if err != nil {
		http.Error(w, "list files failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(files)
}

// DELETE /files/{id}
func (h *FileHandler) Delete(w http.ResponseWriter, r *http.Request) {
	ownerID, err := h.getOwnerID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	idParam := chi.URLParam(r, "id")
	fileID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		http.Error(w, "invalid file id", http.StatusBadRequest)
		return
	}

	if err := h.fileService.DeleteFile(r.Context(), uint(fileID), ownerID); err != nil {
		http.Error(w, fmt.Sprintf("delete failed: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
