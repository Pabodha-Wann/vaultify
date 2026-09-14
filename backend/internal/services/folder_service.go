package services

import (
	"github.com/Pabodha-Wann/vaultify/internal/models"
	"github.com/Pabodha-Wann/vaultify/internal/repository"
)

type FolderService struct {
	folderRepo *repository.FolderRepository
}

func NewFolderService(folderRepo *repository.FolderRepository) *FolderService {
	return &FolderService{folderRepo: folderRepo}
}

func (s *FolderService) CreateFolder(ownerID uint, name string, parentID *uint) (models.Folder, error) {
	folder := &models.Folder{
		OwnerID:  ownerID,
		Name:     name,
		ParentID: parentID,
	}
	err := s.folderRepo.Create(folder)
	return *folder, err
}

// ListFolders returns folders for a user
func (s *FolderService) ListFolders(ownerID uint, parentID *uint) ([]models.Folder, error) {
	return s.folderRepo.ListByOwner(ownerID, parentID)
}

// GetFolderByID retrieves a single folder by ID for the given owner
func (s *FolderService) GetFolderByID(id uint, ownerID uint) (models.Folder, error) {
	return s.folderRepo.FindByID(id, ownerID)
}
