package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AsgardeoClientID     string
	AsgardeoClientSecret string
	AsgardeoOrgName      string
	RedirectURL          string
}

func Load() Config {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, reading from OS environment")
	}

	return Config{
		AsgardeoClientID:     os.Getenv("ASGARDEO_CLIENT_ID"),
		AsgardeoClientSecret: os.Getenv("ASGARDEO_CLIENT_SECRET"),
		AsgardeoOrgName:      os.Getenv("ASGARDEO_ORG_NAME"),
		RedirectURL:          os.Getenv("REDIRECT_URL"),
	}
}
