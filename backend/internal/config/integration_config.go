package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// IntegrationConfig holds configuration for third-party integrations
type IntegrationConfig struct {
	QuickBooks      QuickBooksIntegrationConfig      `json:"quickbooks"`
	ShipmentTracking ShipmentTrackingIntegrationConfig `json:"shipment_tracking"`
	Environment     string                           `json:"environment"` // "development", "sandbox", "production"
}

// QuickBooksIntegrationConfig contains QuickBooks integration settings
type QuickBooksIntegrationConfig struct {
	Enabled       bool   `json:"enabled"`
	BaseURL       string `json:"base_url"`
	ClientID      string `json:"client_id"`
	ClientSecret  string `json:"client_secret"`
	RedirectURI   string `json:"redirect_uri"`
	Sandbox       bool   `json:"sandbox"`
	CompanyID     string `json:"company_id"`
	AccessToken   string `json:"access_token,omitempty"`
	RefreshToken  string `json:"refresh_token,omitempty"`
	TokenExpiry   int    `json:"token_expiry,omitempty"`
}

// ShipmentTrackingIntegrationConfig contains shipment tracking integration settings
type ShipmentTrackingIntegrationConfig struct {
	Enabled     bool                              `json:"enabled"`
	DefaultProvider string                        `json:"default_provider"`
	Providers   map[string]TrackingProviderConfig `json:"providers"`
}

// TrackingProviderConfig contains configuration for a specific tracking provider
type TrackingProviderConfig struct {
	Enabled     bool   `json:"enabled"`
	BaseURL     string `json:"base_url"`
	APIKey      string `json:"api_key"`
	UserID      string `json:"user_id,omitempty"`
	Password    string `json:"password,omitempty"`
	Sandbox     bool   `json:"sandbox"`
	RateLimit   int    `json:"rate_limit,omitempty"` // requests per minute
	Timeout     int    `json:"timeout,omitempty"`    // seconds
}

// LoadIntegrationConfig loads integration configuration from environment variables
func LoadIntegrationConfig() (*IntegrationConfig, error) {
	config := &IntegrationConfig{
		Environment: getEnvOrDefault("APP_ENV", "development"),
	}

	// Load QuickBooks configuration
	config.QuickBooks = QuickBooksIntegrationConfig{
		Enabled:      getBoolEnv("QUICKBOOKS_ENABLED", false),
		BaseURL:      getEnvOrDefault("QUICKBOOKS_BASE_URL", "https://sandbox-quickbooks.api.intuit.com"),
		ClientID:     os.Getenv("QUICKBOOKS_CLIENT_ID"),
		ClientSecret: os.Getenv("QUICKBOOKS_CLIENT_SECRET"),
		RedirectURI:  getEnvOrDefault("QUICKBOOKS_REDIRECT_URI", "http://localhost:8080/auth/quickbooks/callback"),
		Sandbox:      getBoolEnv("QUICKBOOKS_SANDBOX", true),
		CompanyID:    os.Getenv("QUICKBOOKS_COMPANY_ID"),
		AccessToken:  os.Getenv("QUICKBOOKS_ACCESS_TOKEN"),
		RefreshToken: os.Getenv("QUICKBOOKS_REFRESH_TOKEN"),
		TokenExpiry:  getIntEnv("QUICKBOOKS_TOKEN_EXPIRY", 3600),
	}

	// Load Shipment Tracking configuration
	config.ShipmentTracking = ShipmentTrackingIntegrationConfig{
		Enabled:         getBoolEnv("SHIPMENT_TRACKING_ENABLED", false),
		DefaultProvider: getEnvOrDefault("SHIPMENT_TRACKING_DEFAULT_PROVIDER", "dhl"),
		Providers:       make(map[string]TrackingProviderConfig),
	}

	// Load provider configurations
	providers := []string{"dhl", "fedex", "ups", "usps"}
	for _, provider := range providers {
		providerUpper := strings.ToUpper(provider)
		config.ShipmentTracking.Providers[provider] = TrackingProviderConfig{
			Enabled:   getBoolEnv(fmt.Sprintf("%s_ENABLED", providerUpper), false),
			BaseURL:   getEnvOrDefault(fmt.Sprintf("%s_BASE_URL", providerUpper), ""),
			APIKey:    os.Getenv(fmt.Sprintf("%s_API_KEY", providerUpper)),
			UserID:    os.Getenv(fmt.Sprintf("%s_USER_ID", providerUpper)),
			Password:  os.Getenv(fmt.Sprintf("%s_PASSWORD", providerUpper)),
			Sandbox:   getBoolEnv(fmt.Sprintf("%s_SANDBOX", providerUpper), true),
			RateLimit: getIntEnv(fmt.Sprintf("%s_RATE_LIMIT", providerUpper), 60),
			Timeout:   getIntEnv(fmt.Sprintf("%s_TIMEOUT", providerUpper), 30),
		}
	}

	return config, nil
}

// TODO: Factory methods moved to avoid circular import
// CreateQuickBooksService and CreateShipmentTrackingService 
// will be refactored to a separate factory package

// IsSandboxMode returns true if running in sandbox/development mode
func (c *IntegrationConfig) IsSandboxMode() bool {
	return c.Environment != "production"
}

// GetEnabledTrackingProviders returns list of enabled tracking providers
func (c *IntegrationConfig) GetEnabledTrackingProviders() []string {
	var enabled []string
	for provider, config := range c.ShipmentTracking.Providers {
		if config.Enabled {
			enabled = append(enabled, provider)
		}
	}
	return enabled
}

// Validate validates the integration configuration
func (c *IntegrationConfig) Validate() error {
	var errors []string

	// Validate QuickBooks config
	if c.QuickBooks.Enabled {
		if c.QuickBooks.ClientID == "" {
			errors = append(errors, "QuickBooks client ID is required")
		}
		if c.QuickBooks.ClientSecret == "" {
			errors = append(errors, "QuickBooks client secret is required")
		}
		if c.QuickBooks.BaseURL == "" {
			errors = append(errors, "QuickBooks base URL is required")
		}
	}

	// Validate Shipment Tracking config
	if c.ShipmentTracking.Enabled {
		if c.ShipmentTracking.DefaultProvider == "" {
			errors = append(errors, "default shipment tracking provider is required")
		}

		enabledProviders := c.GetEnabledTrackingProviders()
		if len(enabledProviders) == 0 {
			errors = append(errors, "at least one shipment tracking provider must be enabled")
		}

		// Check if default provider is enabled
		defaultConfig, exists := c.ShipmentTracking.Providers[c.ShipmentTracking.DefaultProvider]
		if exists && !defaultConfig.Enabled {
			errors = append(errors, "default shipment tracking provider is not enabled")
		}
	}

	if len(errors) > 0 {
		return fmt.Errorf("configuration validation failed: %s", strings.Join(errors, ", "))
	}

	return nil
}

// Helper functions for environment variable parsing

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getBoolEnv(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseBool(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}

func getIntEnv(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}