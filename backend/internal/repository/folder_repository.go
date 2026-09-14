package repository

import (
	"github.com/Pabodha-Wann/vaultify/internal/models"
	"gorm.io/gorm"
)

type FolderRepository struct {
	db *gorm.DB
}

func NewFolderRepository(db *gorm.DB) *FolderRepository {
	return &FolderRepository{db: db}
}

func (r *FolderRepository) Create(folder *models.Folder) error {
	return r.db.Create(folder).Error
}

// ListByOwner returns folders belonging to a user
func (r *FolderRepository) ListByOwner(ownerID uint, parentID *uint) ([]models.Folder, error) {
	var folders []models.Folder
	query := r.db.Where("owner_id = ?", ownerID)
	if parentID == nil {
		query = query.Where("parent_id IS NULL")
	} else {
		query = query.Where("parent_id = ?", *parentID)
	}
	err := query.Find(&folders).Error
	return folders, err
}

func (r *FolderRepository) FindByID(id uint, ownerID uint) (models.Folder, error) {
	var folder models.Folder
	err := r.db.Where("id = ? AND owner_id = ?", id, ownerID).First(&folder).Error
	return folder, err
}

func (r *FolderRepository) Rename(id uint, ownerID uint, newName string) error {
	return r.db.Model(&models.Folder{}).
		Where("id = ? AND owner_id = ?", id, ownerID).
		Update("name", newName).Error
}

func (r *FolderRepository) Delete(id uint, ownerID uint) error {
	return r.db.Where("id = ? AND owner_id = ?", id, ownerID).Delete(&models.Folder{}).Error
}

// HasContents checks if a folder contains any files or subfolders -- used to block deletion of non-empty folders.
func (r *FolderRepository) HasContents(folderID uint) (bool, error) {
	var fileCount, folderCount int64
	if err := r.db.Model(&models.File{}).Where("folder_id = ?", folderID).Count(&fileCount).Error; err != nil {
		return false, err
	}
	if err := r.db.Model(&models.Folder{}).Where("parent_id = ?", folderID).Count(&folderCount).Error; err != nil {
		return false, err
	}
	return fileCount > 0 || folderCount > 0, nil
}
