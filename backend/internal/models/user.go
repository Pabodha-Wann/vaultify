package models

import "time"

// User represents a row in the "users" table. GORM uses struct tags
type User struct {
	ID        uint   `gorm:"primaryKey"`
	Sub       string `gorm:"uniqueIndex;not null"` // Asgardeo's unique user ID
	Username  string `gorm:"not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}
