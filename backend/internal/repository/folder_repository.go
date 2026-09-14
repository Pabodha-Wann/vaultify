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
