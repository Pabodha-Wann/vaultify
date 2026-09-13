package main

import (
	"context"
	"log"
	"net/http"

	"github.com/Pabodha-Wann/vaultify/internal/config"
	"github.com/Pabodha-Wann/vaultify/internal/database"
	"github.com/Pabodha-Wann/vaultify/internal/handlers"
	"github.com/Pabodha-Wann/vaultify/internal/repository"
	"github.com/Pabodha-Wann/vaultify/internal/services"
	"github.com/Pabodha-Wann/vaultify/internal/storage"

	mymiddleware "github.com/Pabodha-Wann/vaultify/internal/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	r := chi.NewRouter()
	cfg := config.Load()
	log.Println("Loaded config for org:", cfg.AsgardeoOrgName)

	// 1.Database connection
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("failed to connect to database:", err)
	}
	log.Println("Database connected and migrated")

	// 2. S3 storage
	s3Storage, err := storage.NewS3Storage(
		context.Background(),
		cfg.AWSAccessKeyID,
		cfg.AWSSecretAccessKey,
		cfg.AWSRegion,
		cfg.AWSBucketName,
	)
	if err != nil {
		log.Fatal("failed to connect to S3:", err)
	}
	log.Println("S3 storage connected", s3Storage)

	// 3. Repositories
	userRepo := repository.NewUserRepository(db)
	fileRepo := repository.NewFileRepository(db)

	// 4. Services
	userService := services.NewUserService(userRepo)
	fileService := services.NewFileService(fileRepo, s3Storage)

	// 5. Handlers
	authHandler, err := handlers.NewAuthhandler(context.Background(), cfg, userService)
	fileHandler := handlers.NewFileHandler(fileService, userService)

	// 6. Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// 7. Routes
	r.Get("/health", handlers.HealthHandler)
	r.Get("/login", authHandler.Login)
	r.Get("/auth/callback", authHandler.Callback)

	r.Group(func(protected chi.Router) {
		protected.Use(mymiddleware.RequireAuth(cfg.SessionSecret))
		protected.Get("/dashboard", handlers.Dashboard)
		protected.Post("/files", fileHandler.Upload)
		protected.Get("/files", fileHandler.List)
		protected.Get("/files/{id}/download", fileHandler.Download)
		protected.Get("/upload-page", handlers.UploadPage)
		protected.Delete("/files/{id}", fileHandler.Delete)

	})

	log.Println("Starting server on :8080")

	err = http.ListenAndServe(":8080", r)
	if err != nil {
		log.Fatal(err)
	}
}
