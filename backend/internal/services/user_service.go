package services

import (
	"github.com/Pabodha-Wann/vaultify/internal/models"
	"github.com/Pabodha-Wann/vaultify/internal/repository"
)

//UserService holds business logic related to users.

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) LoginOrRegister(sub string, username string) (models.User, error) {
	return s.repo.FindOrCreateBySub(sub, username)
}
