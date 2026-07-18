package middleware

import (
	"context"
	"net/http"

	"github.com/Pabodha-Wann/vaultify/internal/auth"
)

type contextKey string

const userClaimsKey contextKey = "userClaims"

// wraps the handler to block any request doesnt have availid session cookie
func RequireAuth(sessionsecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(
			func(w http.ResponseWriter, r *http.Request) {

				//extract and decode the JWT from the cookie using the secret
				claims, err := auth.ParseSession(r, sessionsecret)
				if err != nil {
					http.Error(w, "unauthorized", http.StatusUnauthorized)
					return
				}

				ctx := context.WithValue(r.Context(), userClaimsKey, claims)
				next.ServeHTTP(w, r.WithContext(ctx))
			})
	}
}

func ClaimsFromContext(r *http.Request) (*auth.SessionClaims, bool) {
	claims, ok := r.Context().Value(userClaimsKey).(*auth.SessionClaims)
	return claims, ok
}
