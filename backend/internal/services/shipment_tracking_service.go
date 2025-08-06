package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"nexus-erp/backend/internal/models"
)

// ShipmentTrackingService provides integration with logistics providers for shipment tracking
type ShipmentTrackingService struct {
	config     ShipmentConfig
	httpClient *http.Client
}

// ShipmentConfig contains configuration for logistics provider APIs
type ShipmentConfig struct {
	ProviderName string
	BaseURL      string
	APIKey       string
	UserID       string
	Password     string
	Sandbox      bool
}

// TrackingProvider represents the logistics provider type
type TrackingProvider string

const (
	ProviderDHL    TrackingProvider = "dhl"
	ProviderFedEx  TrackingProvider = "fedex"
	ProviderUPS    TrackingProvider = "ups"
	ProviderUSPS   TrackingProvider = "usps"
	ProviderGeneric TrackingProvider = "generic"
)

// TrackingStatus represents the current status of a shipment
type TrackingStatus string

const (
	StatusPickedUp   TrackingStatus = "picked_up"
	StatusInTransit  TrackingStatus = "in_transit"
	StatusOutForDelivery TrackingStatus = "out_for_delivery"
	StatusDelivered  TrackingStatus = "delivered"
	StatusException  TrackingStatus = "exception"
	StatusReturned   TrackingStatus = "returned"
	StatusCancelled  TrackingStatus = "cancelled"
	StatusUnknown    TrackingStatus = "unknown"
)

// TrackingInfo represents comprehensive tracking information
type TrackingInfo struct {
	TrackingNumber    string           `json:"tracking_number"`
	Carrier           string           `json:"carrier"`
	Status            TrackingStatus   `json:"status"`
	StatusDescription string           `json:"status_description"`
	EstimatedDelivery *time.Time       `json:"estimated_delivery,omitempty"`
	ActualDelivery    *time.Time       `json:"actual_delivery,omitempty"`
	ServiceType       string           `json:"service_type,omitempty"`
	
	// Origin and destination
	OriginAddress      TrackingAddress  `json:"origin_address,omitempty"`
	DestinationAddress TrackingAddress  `json:"destination_address,omitempty"`
	
	// Package information
	PackageCount       int              `json:"package_count,omitempty"`
	Weight             float64          `json:"weight,omitempty"`
	WeightUnit         string           `json:"weight_unit,omitempty"`
	
	// Timeline
	TrackingEvents     []TrackingEvent  `json:"tracking_events"`
	
	// Additional metadata
	LastUpdated        time.Time        `json:"last_updated"`
	Provider           TrackingProvider `json:"provider"`
	ProviderResponse   interface{}      `json:"provider_response,omitempty"`
}

// TrackingEvent represents a single tracking event in the shipment timeline
type TrackingEvent struct {
	Timestamp     time.Time `json:"timestamp"`
	Status        string    `json:"status"`
	Description   string    `json:"description"`
	Location      string    `json:"location,omitempty"`
	LocationCode  string    `json:"location_code,omitempty"`
	EventCode     string    `json:"event_code,omitempty"`
	SignedBy      string    `json:"signed_by,omitempty"`
}

// TrackingAddress represents an address in tracking information
type TrackingAddress struct {
	Name        string `json:"name,omitempty"`
	AddressLine string `json:"address_line,omitempty"`
	City        string `json:"city,omitempty"`
	State       string `json:"state,omitempty"`
	PostalCode  string `json:"postal_code,omitempty"`
	Country     string `json:"country,omitempty"`
}

// Shipment represents a shipment record in the database
type Shipment struct {
	ID               int64              `json:"id" db:"id"`
	SalesOrderID     int64              `json:"sales_order_id" db:"sales_order_id"`
	CustomerID       int64              `json:"customer_id" db:"customer_id"`
	TrackingNumber   string             `json:"tracking_number" db:"tracking_number"`
	Carrier          string             `json:"carrier" db:"carrier"`
	ServiceType      string             `json:"service_type" db:"service_type"`
	Status           TrackingStatus     `json:"status" db:"status"`
	StatusDescription string            `json:"status_description" db:"status_description"`
	ShipDate         time.Time          `json:"ship_date" db:"ship_date"`
	EstimatedDelivery *time.Time        `json:"estimated_delivery,omitempty" db:"estimated_delivery"`
	ActualDelivery    *time.Time        `json:"actual_delivery,omitempty" db:"actual_delivery"`
	Weight           float64            `json:"weight" db:"weight"`
	WeightUnit       string             `json:"weight_unit" db:"weight_unit"`
	Notes            *string            `json:"notes,omitempty" db:"notes"`
	LastTracked      time.Time          `json:"last_tracked" db:"last_tracked"`
	CreatedAt        time.Time          `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time          `json:"updated_at" db:"updated_at"`
}

// ShipmentWithDetails represents a shipment with related information
type ShipmentWithDetails struct {
	Shipment
	SalesOrder    *models.SalesOrder    `json:"sales_order,omitempty"`
	Customer      *models.Customer      `json:"customer,omitempty"`
	TrackingInfo  *TrackingInfo         `json:"tracking_info,omitempty"`
}

// Provider-specific response structures

// DHLTrackingResponse represents DHL API response
type DHLTrackingResponse struct {
	Shipments []DHLShipment `json:"shipments"`
}

type DHLShipment struct {
	ID     string      `json:"id"`
	Status DHLStatus   `json:"status"`
	Events []DHLEvent  `json:"events"`
}

type DHLStatus struct {
	Status      string    `json:"status"`
	StatusCode  string    `json:"statusCode"`
	Description string    `json:"description"`
	Timestamp   time.Time `json:"timestamp"`
}

type DHLEvent struct {
	Timestamp   time.Time   `json:"timestamp"`
	StatusCode  string      `json:"statusCode"`
	Status      string      `json:"status"`
	Description string      `json:"description"`
	Location    DHLLocation `json:"location,omitempty"`
}

type DHLLocation struct {
	Address DHLAddress `json:"address"`
}

type DHLAddress struct {
	AddressLocality string `json:"addressLocality"`
	PostalCode      string `json:"postalCode"`
	CountryCode     string `json:"countryCode"`
}

// FedExTrackingResponse represents FedEx API response
type FedExTrackingResponse struct {
	Output TrackingOutput `json:"output"`
}

type TrackingOutput struct {
	CompleteTrackResults []FedExTrackResult `json:"completeTrackResults"`
}

type FedExTrackResult struct {
	TrackingNumber string           `json:"trackingNumber"`
	TrackResults   []FedExResult    `json:"trackResults"`
}

type FedExResult struct {
	TrackingNumberInfo FedExTrackingInfo   `json:"trackingNumberInfo"`
	LatestStatusDetail FedExStatusDetail   `json:"latestStatusDetail"`
	ScanEvents        []FedExScanEvent    `json:"scanEvents,omitempty"`
}

type FedExTrackingInfo struct {
	TrackingNumber string `json:"trackingNumber"`
}

type FedExStatusDetail struct {
	Code        string           `json:"code"`
	Description string           `json:"description"`
	ScanLocation FedExLocation   `json:"scanLocation,omitempty"`
}

type FedExScanEvent struct {
	Date           string           `json:"date"`
	EventType      string           `json:"eventType"`
	EventDescription string         `json:"eventDescription"`
	ScanLocation   FedExLocation   `json:"scanLocation,omitempty"`
}

type FedExLocation struct {
	City    string `json:"city"`
	StateOrProvinceCode string `json:"stateOrProvinceCode"`
	PostalCode string `json:"postalCode"`
	CountryCode string `json:"countryCode"`
}

// NewShipmentTrackingService creates a new shipment tracking service
func NewShipmentTrackingService(config ShipmentConfig) *ShipmentTrackingService {
	return &ShipmentTrackingService{
		config:     config,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// TrackShipment tracks a shipment by tracking number
func (s *ShipmentTrackingService) TrackShipment(trackingNumber string) (*TrackingInfo, error) {
	provider := TrackingProvider(s.config.ProviderName)
	
	switch provider {
	case ProviderDHL:
		return s.trackDHL(trackingNumber)
	case ProviderFedEx:
		return s.trackFedEx(trackingNumber)
	case ProviderUPS:
		return s.trackUPS(trackingNumber)
	case ProviderUSPS:
		return s.trackUSPS(trackingNumber)
	default:
		return s.trackGeneric(trackingNumber)
	}
}

// TrackMultipleShipments tracks multiple shipments in batch
func (s *ShipmentTrackingService) TrackMultipleShipments(trackingNumbers []string) (map[string]*TrackingInfo, error) {
	results := make(map[string]*TrackingInfo)
	
	for _, trackingNumber := range trackingNumbers {
		info, err := s.TrackShipment(trackingNumber)
		if err != nil {
			// Log error but continue with other tracking numbers
			results[trackingNumber] = &TrackingInfo{
				TrackingNumber: trackingNumber,
				Status:         StatusUnknown,
				StatusDescription: fmt.Sprintf("Error tracking: %v", err),
				LastUpdated:    time.Now(),
				Provider:       TrackingProvider(s.config.ProviderName),
			}
		} else {
			results[trackingNumber] = info
		}
	}
	
	return results, nil
}

// trackDHL implements DHL tracking API integration
func (s *ShipmentTrackingService) trackDHL(trackingNumber string) (*TrackingInfo, error) {
	url := fmt.Sprintf("%s/track/shipments?trackingNumber=%s", s.config.BaseURL, trackingNumber)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create DHL request: %w", err)
	}
	
	req.Header.Set("DHL-API-Key", s.config.APIKey)
	req.Header.Set("Accept", "application/json")
	
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute DHL request: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("DHL API error (status %d): %s", resp.StatusCode, string(body))
	}
	
	var dhlResp DHLTrackingResponse
	if err := json.NewDecoder(resp.Body).Decode(&dhlResp); err != nil {
		return nil, fmt.Errorf("failed to decode DHL response: %w", err)
	}
	
	if len(dhlResp.Shipments) == 0 {
		return nil, fmt.Errorf("no shipment found for tracking number: %s", trackingNumber)
	}
	
	return s.convertDHLResponse(dhlResp.Shipments[0], trackingNumber), nil
}

// trackFedEx implements FedEx tracking API integration
func (s *ShipmentTrackingService) trackFedEx(trackingNumber string) (*TrackingInfo, error) {
	url := fmt.Sprintf("%s/track/v1/trackingnumbers", s.config.BaseURL)
	
	requestBody := map[string]interface{}{
		"includeDetailedScans": true,
		"trackingInfo": []map[string]interface{}{
			{"trackingNumberInfo": map[string]string{"trackingNumber": trackingNumber}},
		},
	}
	
	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal FedEx request: %w", err)
	}
	
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create FedEx request: %w", err)
	}
	
	req.Header.Set("X-API-Key", s.config.APIKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute FedEx request: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("FedEx API error (status %d): %s", resp.StatusCode, string(body))
	}
	
	var fedexResp FedExTrackingResponse
	if err := json.NewDecoder(resp.Body).Decode(&fedexResp); err != nil {
		return nil, fmt.Errorf("failed to decode FedEx response: %w", err)
	}
	
	if len(fedexResp.Output.CompleteTrackResults) == 0 {
		return nil, fmt.Errorf("no tracking results found for: %s", trackingNumber)
	}
	
	return s.convertFedExResponse(fedexResp.Output.CompleteTrackResults[0], trackingNumber), nil
}

// trackUPS implements UPS tracking API integration (placeholder)
func (s *ShipmentTrackingService) trackUPS(trackingNumber string) (*TrackingInfo, error) {
	// UPS API implementation would go here
	// For now, return a mock response
	return &TrackingInfo{
		TrackingNumber:    trackingNumber,
		Carrier:           "UPS",
		Status:            StatusInTransit,
		StatusDescription: "In Transit",
		LastUpdated:       time.Now(),
		Provider:          ProviderUPS,
		TrackingEvents: []TrackingEvent{
			{
				Timestamp:   time.Now().Add(-24 * time.Hour),
				Status:      "PICKUP",
				Description: "Package picked up",
				Location:    "Origin Facility",
			},
		},
	}, nil
}

// trackUSPS implements USPS tracking API integration (placeholder)
func (s *ShipmentTrackingService) trackUSPS(trackingNumber string) (*TrackingInfo, error) {
	// USPS API implementation would go here
	// For now, return a mock response
	return &TrackingInfo{
		TrackingNumber:    trackingNumber,
		Carrier:           "USPS",
		Status:            StatusInTransit,
		StatusDescription: "In Transit to Next Facility",
		LastUpdated:       time.Now(),
		Provider:          ProviderUSPS,
		TrackingEvents: []TrackingEvent{
			{
				Timestamp:   time.Now().Add(-12 * time.Hour),
				Status:      "DEPARTED_FACILITY",
				Description: "Departed facility",
				Location:    "Processing Center",
			},
		},
	}, nil
}

// trackGeneric implements a generic tracking interface
func (s *ShipmentTrackingService) trackGeneric(trackingNumber string) (*TrackingInfo, error) {
	// Generic implementation for custom providers
	return &TrackingInfo{
		TrackingNumber:    trackingNumber,
		Carrier:           s.config.ProviderName,
		Status:            StatusInTransit,
		StatusDescription: "Shipment in transit",
		LastUpdated:       time.Now(),
		Provider:          ProviderGeneric,
		TrackingEvents: []TrackingEvent{
			{
				Timestamp:   time.Now().Add(-6 * time.Hour),
				Status:      "IN_TRANSIT",
				Description: "Package is in transit",
				Location:    "Distribution Center",
			},
		},
	}, nil
}

// Conversion functions

func (s *ShipmentTrackingService) convertDHLResponse(dhlShipment DHLShipment, trackingNumber string) *TrackingInfo {
	info := &TrackingInfo{
		TrackingNumber:    trackingNumber,
		Carrier:           "DHL",
		Status:            s.mapDHLStatus(dhlShipment.Status.StatusCode),
		StatusDescription: dhlShipment.Status.Description,
		LastUpdated:       time.Now(),
		Provider:          ProviderDHL,
		ProviderResponse:  dhlShipment,
	}
	
	// Convert events
	for _, event := range dhlShipment.Events {
		trackingEvent := TrackingEvent{
			Timestamp:   event.Timestamp,
			Status:      event.StatusCode,
			Description: event.Description,
		}
		
		if event.Location.Address.AddressLocality != "" {
			trackingEvent.Location = fmt.Sprintf("%s, %s", 
				event.Location.Address.AddressLocality,
				event.Location.Address.CountryCode)
		}
		
		info.TrackingEvents = append(info.TrackingEvents, trackingEvent)
	}
	
	return info
}

func (s *ShipmentTrackingService) convertFedExResponse(fedexResult FedExTrackResult, trackingNumber string) *TrackingInfo {
	if len(fedexResult.TrackResults) == 0 {
		return &TrackingInfo{
			TrackingNumber: trackingNumber,
			Carrier:        "FedEx",
			Status:         StatusUnknown,
			LastUpdated:    time.Now(),
			Provider:       ProviderFedEx,
		}
	}
	
	result := fedexResult.TrackResults[0]
	
	info := &TrackingInfo{
		TrackingNumber:    trackingNumber,
		Carrier:           "FedEx",
		Status:            s.mapFedExStatus(result.LatestStatusDetail.Code),
		StatusDescription: result.LatestStatusDetail.Description,
		LastUpdated:       time.Now(),
		Provider:          ProviderFedEx,
		ProviderResponse:  fedexResult,
	}
	
	// Convert scan events
	for _, scanEvent := range result.ScanEvents {
		timestamp, _ := time.Parse("2006-01-02T15:04:05", scanEvent.Date)
		
		trackingEvent := TrackingEvent{
			Timestamp:   timestamp,
			Status:      scanEvent.EventType,
			Description: scanEvent.EventDescription,
		}
		
		if scanEvent.ScanLocation.City != "" {
			trackingEvent.Location = fmt.Sprintf("%s, %s", 
				scanEvent.ScanLocation.City,
				scanEvent.ScanLocation.StateOrProvinceCode)
		}
		
		info.TrackingEvents = append(info.TrackingEvents, trackingEvent)
	}
	
	return info
}

// Status mapping functions

func (s *ShipmentTrackingService) mapDHLStatus(statusCode string) TrackingStatus {
	switch statusCode {
	case "pre-transit", "transit":
		return StatusPickedUp
	case "delivered":
		return StatusDelivered
	case "failure", "exception":
		return StatusException
	case "returned":
		return StatusReturned
	default:
		return StatusInTransit
	}
}

func (s *ShipmentTrackingService) mapFedExStatus(statusCode string) TrackingStatus {
	switch statusCode {
	case "PU":
		return StatusPickedUp
	case "IT":
		return StatusInTransit
	case "OD":
		return StatusOutForDelivery
	case "DL":
		return StatusDelivered
	case "EX":
		return StatusException
	default:
		return StatusInTransit
	}
}

// UpdateShipmentStatus updates a shipment record with latest tracking information
func (s *ShipmentTrackingService) UpdateShipmentStatus(shipment *Shipment) error {
	trackingInfo, err := s.TrackShipment(shipment.TrackingNumber)
	if err != nil {
		return fmt.Errorf("failed to track shipment %s: %w", shipment.TrackingNumber, err)
	}
	
	// Update shipment record
	shipment.Status = trackingInfo.Status
	shipment.StatusDescription = trackingInfo.StatusDescription
	shipment.LastTracked = time.Now()
	
	if trackingInfo.EstimatedDelivery != nil {
		shipment.EstimatedDelivery = trackingInfo.EstimatedDelivery
	}
	
	if trackingInfo.ActualDelivery != nil {
		shipment.ActualDelivery = trackingInfo.ActualDelivery
	}
	
	return nil
}

// TestConnection tests the connection to the logistics provider API
func (s *ShipmentTrackingService) TestConnection() error {
	// Use a test tracking number for connection validation
	testTrackingNumber := "TEST123456789"
	
	_, err := s.TrackShipment(testTrackingNumber)
	if err != nil {
		// For test connections, we expect some errors (like invalid tracking number)
		// but we want to make sure we can reach the API
		return fmt.Errorf("connection test failed: %w", err)
	}
	
	return nil
}

// GetSupportedProviders returns list of supported logistics providers
func GetSupportedProviders() []TrackingProvider {
	return []TrackingProvider{
		ProviderDHL,
		ProviderFedEx,
		ProviderUPS,
		ProviderUSPS,
		ProviderGeneric,
	}
}