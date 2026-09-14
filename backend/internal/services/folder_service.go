package services

import (
	"fmt"

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

func (s *FolderService) RenameFolder(folderID uint, ownerID uint, newName string) error {
	return s.folderRepo.Rename(folderID, ownerID, newName)
}

func (s *FolderService) DeleteFolder(folderID uint, ownerID uint) error {
	hasContents, err := s.folderRepo.HasContents(folderID)
	if err != nil {
		return err
	}
	if hasContents {
		return fmt.Errorf("folder is not empty")
	}
	return s.folderRepo.Delete(folderID, ownerID)
}
