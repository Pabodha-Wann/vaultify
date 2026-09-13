package repository

import (
	"gorm.io/gorm"

	"github.com/Pabodha-Wann/vaultify/internal/models"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// *UserRepository: This tells Go that this method belongs to the UserRepository type
func (repo *UserRepository) FindOrCreateBySub(sub string, username string) (models.User, error) {
	user := models.User{Sub: sub, Username: username}
	err := repo.db.Where("sub = ?", sub).FirstOrCreate(&user).Error
	return user, err
}
