package handlers

import (
	"fmt"
	"net/http"

	"github.com/Pabodha-Wann/vaultify/internal/middleware"
)

func Dashboard(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r)
	if !ok {
		http.Error(w, "unathorized", http.StatusUnauthorized)
		return
	}

	fmt.Fprintf(w, "Welcome, %s (sub: %s) — your session is valid.", claims.Username, claims.Sub)
}
