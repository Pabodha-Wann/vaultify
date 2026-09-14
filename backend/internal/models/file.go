package models

import "time"

//File represents metadata about an uploaded file. The actual file content lives in Cloudflare R2, not in this database
type File struct {
	ID          uint   `gorm:"primaryKey"`
	OwnerID     uint   `gorm:"not null;index"`
	FolderID    *uint  `gorm:"index"`
	Name        string `gorm:"not null"`
	Size        int64  `gorm:"not null"`
	ContentType string
	StorageKey  string  `gorm:"not null;uniqueIndex"`
	ShareToken  *string `gorm:"uniqueIndex"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type Folder struct {
	ID        uint   `gorm:"primaryKey"`
	OwnerID   uint   `gorm:"not null;index"`
	ParentID  *uint  `gorm:"index"` // pointer -- nil means it's a top-level folder
	Name      string `gorm:"not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}
