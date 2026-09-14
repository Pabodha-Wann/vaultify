package repository

import (
	"github.com/Pabodha-Wann/vaultify/internal/models"
	"gorm.io/gorm"
)

type FileRepository struct {
	db *gorm.DB
}

func NewFileRepository(db *gorm.DB) *FileRepository {
	// We create a new struct, assign the argument 'db' to the field 'db'
	return &FileRepository{db: db}
}

// Create inserts a new file metadata row.
func (r *FileRepository) Create(file *models.File) error {
	return r.db.Create(file).Error
}

// Get one file by id - also checking the owner id
func (r *FileRepository) FindById(id uint, ownerID uint) (models.File, error) {
	var file models.File
	err := r.db.Where("id=? AND owner_id=?", id, ownerID).First(&file).Error
	return file, err

}

// ListByOwner returns all files belonging to a user.
func (r *FileRepository) ListByOwner(ownerID uint, folderID *uint) ([]models.File, error) {
	var files []models.File
	query := r.db.Where("owner_id=?", ownerID)

	if folderID == nil {
		query = query.Where("folder_id IS NULL")
	} else {
		query = query.Where("folder_id = ?", *folderID)
	}
	err := query.Find(&files).Error
	return files, err
}

// removes a file's metadata row, scoped to its owner.
func (r *FileRepository) Delete(id uint, ownerId uint) error {
	return r.db.Where("id = ? AND owner_id = ?", id, ownerId).Delete(&models.File{}).Error
}

func (r *FileRepository) Rename(id uint, ownerID uint, newName string) error {
	return r.db.Model(&models.File{}).
		Where("id = ? AND owner_id = ?", id, ownerID).
		Update("name", newName).Error
}

func (r *FileRepository) SetShareToken(id uint, ownerID uint, token string) error {
	return r.db.Model(&models.File{}).
		Where("id = ? AND owner_id = ?", id, ownerID).
		Update("share_token", token).Error
}

// looks up a file by its public share token
func (r *FileRepository) FindByShareToken(token string) (models.File, error) {
	var file models.File
	err := r.db.Where("share_token = ?", token).First(&file).Error
	return file, err
}
