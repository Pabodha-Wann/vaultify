package handlers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"golang.org/x/oauth2"

	"github.com/Pabodha-Wann/vaultify/internal/config"
)

type AuthHandler struct {
	oauthConfig oauth2.Config
}

func NewAuthhandler(cfg config.Config) *AuthHandler {
	return &AuthHandler{
		oauthConfig: oauth2.Config{
			ClientID:     cfg.AsgardeoClientID,
			ClientSecret: cfg.AsgardeoClientSecret,
			RedirectURL:  cfg.RedirectURL,
			Scopes:       []string{"openid", "profile", "email"},
			Endpoint: oauth2.Endpoint{
				AuthURL:  fmt.Sprintf("https://api.asgardeo.io/t/%s/oauth2/authorize", cfg.AsgardeoOrgName),
				TokenURL: fmt.Sprintf("https://api.asgardeo.io/t/%s/oauth2/token", cfg.AsgardeoOrgName),
			},
		},
	}
}

// create a random string to protect against CSRF attacks
func generateState() string {
	b := make([]byte, 16)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

// redirect to Asgardeo hosted login page
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	state := generateState()
	authURL := h.oauthConfig.AuthCodeURL(state)
	http.Redirect(w, r, authURL, http.StatusFound)
}

func (h *AuthHandler) Callback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")

	if code == "" {
		http.Error(w, "missing code", http.StatusBadRequest)
		return
	}

	token, err := h.oauthConfig.Exchange(context.Background(), code)

	if err != nil {
		log.Println("token exchange failed:", err)
		http.Error(w, "token exchange failed", http.StatusInternalServerError)
		return
	}

	rawIDToken, ok := token.Extra("id_token").(string)

	if !ok {
		http.Error(w, "no id_token in response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"access_token": token.AccessToken,
		"id_token":     rawIDToken,
	})
}
