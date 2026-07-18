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
	SessionSecret        string
	DatabaseURL          string
	AWSAccessKeyID       string
	AWSSecretAccessKey   string
	AWSRegion            string
	AWSBucketName        string
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
		SessionSecret:        os.Getenv("SESSION_SECRET"),
		DatabaseURL:          os.Getenv("DATABASE_URL"),
		AWSAccessKeyID:       os.Getenv("AWS_ACCESS_KEY_ID"),
		AWSSecretAccessKey:   os.Getenv("AWS_SECRET_ACCESS_KEY"),
		AWSRegion:            os.Getenv("AWS_REGION"),
		AWSBucketName:        os.Getenv("AWS_BUCKET_NAME"),
	}
}
