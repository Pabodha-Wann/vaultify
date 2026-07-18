package database

import (
	"github.com/Pabodha-Wann/vaultify/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// opens a cnnection to databse
func Connect(databaseURL string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	//Auomigrate by looking at sruct definitions
	if err := db.AutoMigrate(&models.User{}); err != nil {
		return nil, err
	}
	return db, nil
}
