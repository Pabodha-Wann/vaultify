package services

import (
	"context"
	"fmt"
	"io"

	"github.com/Pabodha-Wann/vaultify/internal/models"
	"github.com/Pabodha-Wann/vaultify/internal/repository"
	"github.com/Pabodha-Wann/vaultify/internal/storage"
	"github.com/google/uuid"
)

type FileService struct {
	fileRepo *repository.FileRepository
	storage  *storage.S3Storage
}

func NewFileService(fileRepo *repository.FileRepository, storage *storage.S3Storage) *FileService {
	return &FileService{
		fileRepo: fileRepo,
		storage:  storage,
	}
}

// generate a unique storage key, upload the bytes to S3, then save the metadata row
func (s *FileService) UploadFile(ctx context.Context, ownerID uint, folderID *uint, filename string, contentType string, body io.Reader, size int64) (models.File, error) {
	storageKey := fmt.Sprintf("%d/%s-%s", ownerID, uuid.New().String(), filename)

	if contentType == "" {
		contentType = "application/octet-stream"
	}

	if err := s.storage.Upload(ctx, storageKey, body, size, contentType); err != nil {
		return models.File{}, fmt.Errorf("upload to storage failed: %w", err)
	}

	file := &models.File{
		OwnerID:     ownerID,
		FolderID:    folderID,
		Name:        filename,
		Size:        size,
		ContentType: contentType,
		StorageKey:  storageKey,
	}

	if err := s.fileRepo.Create(file); err != nil {
		return models.File{}, fmt.Errorf("failed to save file metadata: %w", err)
	}

	return *file, nil
}

// fetches the file's metadata (checking ownership), then streams the actual bytes from S3.
func (s *FileService) DownloadFile(ctx context.Context, fileID uint, ownerID uint) (models.File, io.ReadCloser, error) {
	file, err := s.fileRepo.FindById(fileID, ownerID)
	if err != nil {
		return models.File{}, nil, fmt.Errorf("file not found: %w", err)
	}

	stream, err := s.storage.Download(ctx, file.StorageKey)
	if err != nil {
		return models.File{}, nil, fmt.Errorf("download from storage failed: %w", err)
	}

	return file, stream, nil
}

func (s *FileService) ListFiles(ownerID uint, folderID *uint) ([]models.File, error) {
	return s.fileRepo.ListByOwner(ownerID, folderID)
}

func (s *FileService) DeleteFile(ctx context.Context, fileID uint, ownerID uint) error {
	file, err := s.fileRepo.FindById(fileID, ownerID)
	if err != nil {
		return fmt.Errorf("file not found: %w", err)
	}

	if err := s.storage.Delete(ctx, file.StorageKey); err != nil {
		return fmt.Errorf("delete from storage failed: %w", err)
	}

	return s.fileRepo.Delete(fileID, ownerID)
}

func (s *FileService) RenameFile(fileID uint, ownerID uint, newName string) error {
	return s.fileRepo.Rename(fileID, ownerID, newName)
}

func (s *FileService) CreateShareLink(fileID uint, ownerID uint) (string, error) {
	token := uuid.New().String()
	if err := s.fileRepo.SetShareToken(fileID, ownerID, token); err != nil {
		return "", err
	}
	return token, nil
}

func (s *FileService) DownloadByShareToken(ctx context.Context, token string) (models.File, io.ReadCloser, error) {
	file, err := s.fileRepo.FindByShareToken(token)
	if err != nil {
		return models.File{}, nil, fmt.Errorf("invalid share link: %w", err)
	}

	stream, err := s.storage.Download(ctx, file.StorageKey)
	if err != nil {
		return models.File{}, nil, fmt.Errorf("download from storage failed: %w", err)
	}

	return file, stream, nil
}
