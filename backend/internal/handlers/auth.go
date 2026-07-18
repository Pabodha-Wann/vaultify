package handlers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"

	"golang.org/x/oauth2"

	"github.com/Pabodha-Wann/vaultify/internal/auth"
	"github.com/Pabodha-Wann/vaultify/internal/config"
	"github.com/Pabodha-Wann/vaultify/internal/services"
	"github.com/coreos/go-oidc/v3/oidc"
)

type AuthHandler struct {
	oauthConfig   oauth2.Config
	verifier      *oidc.IDTokenVerifier
	sessionSecret string
	userService   *services.UserService
}

type UserClaims struct {
	Sub      string `json:"sub"`
	Email    string `json:"email"`
	Username string `json:"username"`
}

func NewAuthhandler(ctx context.Context, cfg config.Config, userService *services.UserService) (*AuthHandler, error) {
	issuerURL := fmt.Sprintf("https://api.asgardeo.io/t/%s/oauth2/token", cfg.AsgardeoOrgName)

	//Dynamically discover Asgardeo's public signing keys and OIDC configurations
	provider, err := oidc.NewProvider(ctx, issuerURL)

	if err != nil {
		return nil, fmt.Errorf("Failed to create oidc provider:%w ", err)
	}

	verifier := provider.Verifier(&oidc.Config{ClientID: cfg.AsgardeoClientID})

	oauthConfig := oauth2.Config{
		ClientID:     cfg.AsgardeoClientID,
		ClientSecret: cfg.AsgardeoClientSecret,
		RedirectURL:  cfg.RedirectURL,
		Scopes:       []string{"openid", "profile", "email"},
		Endpoint:     provider.Endpoint(),
	}

	return &AuthHandler{
		oauthConfig:   oauthConfig,
		verifier:      verifier,
		sessionSecret: cfg.SessionSecret,
		userService:   userService,
	}, nil

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
	ctx := r.Context()

	// 1. Get the code send back by asgardeo
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "missing code", http.StatusBadRequest)
		return
	}

	// 2. Perform the server-to-server exchange to trade the code for tokens
	token, err := h.oauthConfig.Exchange(ctx, code)
	if err != nil {
		log.Println("token exchange failed:", err)
		http.Error(w, "token exchange failed", http.StatusInternalServerError)
		return
	}

	// 3. Extract the raw string of the ID Token (JWT)
	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok {
		http.Error(w, "no id_token in response", http.StatusInternalServerError)
		return
	}

	//4. Verify the cryptographic signature, issuer, expiration, and audience claims
	idToken, err := h.verifier.Verify(ctx, rawIDToken)
	if err != nil {
		log.Println("id_token verification failed:", err)
		http.Error(w, "invalid id token", http.StatusUnauthorized)
		return
	}

	//safely unpack the verified token into claims
	var claims UserClaims
	if err := idToken.Claims(&claims); err != nil {
		log.Println("failed to parse claims:", err)
		http.Error(w, "failed to parse claims", http.StatusInternalServerError)
		return
	}

	log.Printf("Verified login:sub=%s email=%s username=%s", claims.Sub, claims.Email, claims.Username)

	//saving / finding the user
	user, err := h.userService.LoginOrRegister(claims.Sub, claims.Username)
	if err != nil {
		log.Println("failed to find/create user:", err)
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}

	// w.Header().Set("Content-Type", "application/json")
	// json.NewEncoder(w).Encode(claims)

	if err := auth.Createsession(w, h.sessionSecret, user.Sub, user.Username); err != nil {
		log.Println("failed to create session:", err)
		http.Error(w, "failed to create session", http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, "/dashboard", http.StatusFound)
}
