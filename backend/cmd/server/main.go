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

	mymiddleware "github.com/Pabodha-Wann/vaultify/internal/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	r := chi.NewRouter()
	cfg := config.Load()
	log.Println("Loaded config for org:", cfg.AsgardeoOrgName)

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("failed to connect to database:", err)
	}
	log.Println("Database connected and migrated")

	userRepo := repository.NewUserRepository(db)
	userService := services.NewUserService(userRepo)

	authHandler, err := handlers.NewAuthhandler(context.Background(), cfg, userService)

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health", handlers.HealthHandler)
	r.Get("/login", authHandler.Login)
	r.Get("/auth/callback", authHandler.Callback)

	r.Group(func(protected chi.Router) {
		protected.Use(mymiddleware.RequireAuth(cfg.SessionSecret))
		protected.Get("/dashboard", handlers.Dashboard)

	})

	log.Println("Starting server on :8080")

	err = http.ListenAndServe(":8080", r)
	if err != nil {
		log.Fatal(err)
	}
}
