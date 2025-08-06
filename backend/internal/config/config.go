package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Database  DatabaseConfig
	Redis     RedisConfig
	JWT       JWTConfig
	MinIO     MinIOConfig
	App       AppConfig
	Scheduler SchedulerConfig
	Email     EmailConfig
	OCR       OCRConfig
}

type DatabaseConfig struct {
	Host     string
	Port     string
	Name     string
	User     string
	Password string
	SSLMode  string
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
}

type JWTConfig struct {
	Secret     string
	Expiration time.Duration
}

type MinIOConfig struct {
	Endpoint  string
	AccessKey string
	SecretKey string
}

type AppConfig struct {
	Environment string
	Port        string
	Debug       bool
}

type SchedulerConfig struct {
	InventoryCheckInterval time.Duration
	Enabled               bool
}

type EmailConfig struct {
	SMTPHost     string
	SMTPPort     string
	SMTPUsername string
	SMTPPassword string
	FromEmail    string
	FromName     string
}

type OCRConfig struct {
	Provider           string
	GoogleCredentials  string
	GoogleProjectID    string
	AWSAccessKey       string
	AWSSecretKey       string
	AWSRegion         string
	AzureEndpoint     string
	AzureSubscriptionKey string
}

func Load() (*Config, error) {
	// Load .env file if exists
	if err := godotenv.Load(); err != nil {
		// Not an error if .env file doesn't exist
	}

	debug, _ := strconv.ParseBool(getEnvWithDefault("APP_DEBUG", "false"))
	schedulerEnabled, _ := strconv.ParseBool(getEnvWithDefault("SCHEDULER_ENABLED", "true"))
	inventoryCheckInterval, _ := time.ParseDuration(getEnvWithDefault("INVENTORY_CHECK_INTERVAL", "1h"))

	return &Config{
		Database: DatabaseConfig{
			Host:     getEnvWithDefault("DB_HOST", "localhost"),
			Port:     getEnvWithDefault("DB_PORT", "5432"),
			Name:     getEnvWithDefault("DB_NAME", "nexus_erp"),
			User:     getEnvWithDefault("DB_USER", "nexus"),
			Password: getEnvWithDefault("DB_PASSWORD", "securepassword"),
			SSLMode:  getEnvWithDefault("DB_SSLMODE", "disable"),
		},
		Redis: RedisConfig{
			Host:     getEnvWithDefault("REDIS_HOST", "localhost"),
			Port:     getEnvWithDefault("REDIS_PORT", "6379"),
			Password: getEnvWithDefault("REDIS_PASSWORD", ""),
		},
		JWT: JWTConfig{
			Secret:     getEnvWithDefault("JWT_SECRET", "your-jwt-secret-key-here-make-it-long-and-secure"),
			Expiration: time.Hour * 24, // 24 hours
		},
		MinIO: MinIOConfig{
			Endpoint:  getEnvWithDefault("MINIO_ENDPOINT", "localhost:9000"),
			AccessKey: getEnvWithDefault("MINIO_ACCESS_KEY", "nexus"),
			SecretKey: getEnvWithDefault("MINIO_SECRET_KEY", "miniopassword"),
		},
		App: AppConfig{
			Environment: getEnvWithDefault("APP_ENV", "development"),
			Port:        getEnvWithDefault("APP_PORT", "8080"),
			Debug:       debug,
		},
		Scheduler: SchedulerConfig{
			InventoryCheckInterval: inventoryCheckInterval,
			Enabled:               schedulerEnabled,
		},
		Email: EmailConfig{
			SMTPHost:     getEnvWithDefault("SMTP_HOST", ""),
			SMTPPort:     getEnvWithDefault("SMTP_PORT", "587"),
			SMTPUsername: getEnvWithDefault("SMTP_USERNAME", ""),
			SMTPPassword: getEnvWithDefault("SMTP_PASSWORD", ""),
			FromEmail:    getEnvWithDefault("FROM_EMAIL", "noreply@example.com"),
			FromName:     getEnvWithDefault("FROM_NAME", "NexusERP"),
		},
		OCR: OCRConfig{
			Provider:           getEnvWithDefault("OCR_PROVIDER", "google"),
			GoogleCredentials:  getEnvWithDefault("GOOGLE_APPLICATION_CREDENTIALS", ""),
			GoogleProjectID:    getEnvWithDefault("GOOGLE_PROJECT_ID", ""),
			AWSAccessKey:       getEnvWithDefault("AWS_ACCESS_KEY_ID", ""),
			AWSSecretKey:       getEnvWithDefault("AWS_SECRET_ACCESS_KEY", ""),
			AWSRegion:         getEnvWithDefault("AWS_REGION", "us-east-1"),
			AzureEndpoint:     getEnvWithDefault("AZURE_OCR_ENDPOINT", ""),
			AzureSubscriptionKey: getEnvWithDefault("AZURE_OCR_SUBSCRIPTION_KEY", ""),
		},
	}, nil
}

func getEnvWithDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}