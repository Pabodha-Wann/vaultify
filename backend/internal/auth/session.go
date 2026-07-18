package auth

import (
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Sessioncliams - what we put inside our own JWT
type SessionClaims struct {
	Sub      string `json:"sub"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func Createsession(w http.ResponseWriter, secret string, sub string, username string) error {
	claims := SessionClaims{
		Sub:      sub,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			// session expires in 24 hours
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(secret))
	if err != nil {
		return err
	}

	//HttpOnly - js in the browser cant read cookies
	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    signedToken,
		Path:     "/",
		HttpOnly: true,
		MaxAge:   int((24 * time.Hour)),
		SameSite: http.SameSiteLaxMode,
	})

	return nil
}

// reads and verify the session cookie from the request
func ParseSession(r *http.Request, secret string) (*SessionClaims, error) {
	cookie, err := r.Cookie("session")
	if err != nil {
		return nil, err
	}

	claims := &SessionClaims{}
	token, err := jwt.ParseWithClaims(cookie.Value, claims, func(t *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return nil, err
	}

	return claims, nil
}
