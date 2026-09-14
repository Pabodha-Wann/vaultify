package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/Pabodha-Wann/vaultify/internal/middleware"
	"github.com/Pabodha-Wann/vaultify/internal/services"
	"github.com/go-chi/chi/v5"
)

type FolderHandler struct {
	folderService *services.FolderService
	userService   *services.UserService
}

func NewFolderHandler(folderService *services.FolderService, userService *services.UserService) *FolderHandler {
	return &FolderHandler{folderService: folderService, userService: userService}
}

func (h *FolderHandler) getOwnerID(r *http.Request) (uint, error) {
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

type createFolderRequest struct {
	Name     string `json:name`
	ParentID *uint  `json:"parent_id"`
}

// POST /folders
func (h *FolderHandler) Create(w http.ResponseWriter, r *http.Request) {
	ownerID, err := h.getOwnerID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req createFolderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	folder, err := h.folderService.CreateFolder(ownerID, req.Name, req.ParentID)
	if err != nil {
		http.Error(w, "failed to create folder", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(folder)
}

// GET /folders?parent_id=3
func (h *FolderHandler) List(w http.ResponseWriter, r *http.Request) {
	ownerID, err := h.getOwnerID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var parentID *uint
	if raw := r.URL.Query().Get("parent_id"); raw != "" {
		id, err := strconv.ParseUint(raw, 10, 64)
		if err != nil {
			http.Error(w, "invalid parent_id", http.StatusBadRequest)
			return
		}
		val := uint(id)
		parentID = &val
	}

	folders, err := h.folderService.ListFolders(ownerID, parentID)
	if err != nil {
		http.Error(w, "failed to list folders", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(folders)
}

// PATCH /folders/{id}
func (h *FolderHandler) Rename(w http.ResponseWriter, r *http.Request) {
	ownerID, err := h.getOwnerID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	idParam := chi.URLParam(r, "id")
	folderID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		http.Error(w, "invalid folder id", http.StatusBadRequest)
		return
	}

	var req createFolderRequest // reusing this struct just for its Name field
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	if err := h.folderService.RenameFolder(uint(folderID), ownerID, req.Name); err != nil {
		http.Error(w, "rename failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)

}

// DELETE /folders/{id}
func (h *FolderHandler) Delete(w http.ResponseWriter, r *http.Request) {
	ownerID, err := h.getOwnerID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	idParam := chi.URLParam(r, "id")
	folderID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		http.Error(w, "invalid folder id", http.StatusBadRequest)
		return
	}

	if err := h.folderService.DeleteFolder(uint(folderID), ownerID); err != nil {
		http.Error(w, err.Error(), http.StatusConflict) // 409 -- e.g. folder not empty
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
