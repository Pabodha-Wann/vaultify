package main

import (
	"context"
	"log"
	"net/http"

	"github.com/Pabodha-Wann/vaultify/internal/config"
	"github.com/Pabodha-Wann/vaultify/internal/handlers"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	r := chi.NewRouter()
	cfg := config.Load()
	log.Println("Loaded config for org:", cfg.AsgardeoOrgName)

	authHandler, err := handlers.NewAuthhandler(context.Background(), cfg)
	if err != nil {
		log.Fatal("failed to create auth handler:", err)
	}

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health", handlers.HealthHandler)
	r.Get("/login", authHandler.Login)
	r.Get("/auth/callback", authHandler.Callback)

	log.Println("Starting server on :8080")

	err = http.ListenAndServe(":8080", r)
	if err != nil {
		log.Fatal(err)
	}
}
