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

// QuickBooksService provides integration with QuickBooks accounting software
type QuickBooksService struct {
	config         QuickBooksConfig
	httpClient     *http.Client
	accessToken    string
	refreshToken   string
	tokenExpiresAt time.Time
}

// QuickBooksConfig contains QuickBooks API configuration
type QuickBooksConfig struct {
	BaseURL      string
	ClientID     string
	ClientSecret string
	RedirectURI  string
	Sandbox      bool
	CompanyID    string
}

// QuickBooksOAuthTokens represents OAuth token response
type QuickBooksOAuthTokens struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

// QuickBooks API Models
type QBCustomer struct {
	ID                  string `json:"Id,omitempty"`
	Name                string `json:"Name"`
	CompanyName         string `json:"CompanyName,omitempty"`
	PrintOnCheckName    string `json:"PrintOnCheckName,omitempty"`
	Active              bool   `json:"Active"`
	PrimaryPhone        string `json:"PrimaryPhone,omitempty"`
	PrimaryEmailAddr    string `json:"PrimaryEmailAddr,omitempty"`
	BillAddr            QBAddress `json:"BillAddr,omitempty"`
	ShipAddr            QBAddress `json:"ShipAddr,omitempty"`
	Notes               string `json:"Notes,omitempty"`
	CreditLimit         float64 `json:"CreditLimit,omitempty"`
	PaymentMethodRef    QBRef  `json:"PaymentMethodRef,omitempty"`
	CurrencyRef         QBRef  `json:"CurrencyRef,omitempty"`
	MetaData            QBMetaData `json:"MetaData,omitempty"`
}

type QBInvoice struct {
	ID                  string          `json:"Id,omitempty"`
	DocNumber           string          `json:"DocNumber,omitempty"`
	TxnDate             string          `json:"TxnDate"`
	DueDate             string          `json:"DueDate"`
	CustomerRef         QBRef           `json:"CustomerRef"`
	CurrencyRef         QBRef           `json:"CurrencyRef,omitempty"`
	Line                []QBInvoiceLine `json:"Line"`
	TotalAmt            float64         `json:"TotalAmt,omitempty"`
	Balance             float64         `json:"Balance,omitempty"`
	PrivateNote         string          `json:"PrivateNote,omitempty"`
	CustomerMemo        string          `json:"CustomerMemo,omitempty"`
	BillAddr            QBAddress       `json:"BillAddr,omitempty"`
	ShipAddr            QBAddress       `json:"ShipAddr,omitempty"`
	EmailStatus         string          `json:"EmailStatus,omitempty"`
	MetaData            QBMetaData      `json:"MetaData,omitempty"`
}

type QBPayment struct {
	ID              string             `json:"Id,omitempty"`
	TxnDate         string             `json:"TxnDate"`
	TotalAmt        float64            `json:"TotalAmt"`
	CustomerRef     QBRef              `json:"CustomerRef"`
	CurrencyRef     QBRef              `json:"CurrencyRef,omitempty"`
	PaymentMethodRef QBRef             `json:"PaymentMethodRef,omitempty"`
	Line            []QBPaymentLine    `json:"Line"`
	PrivateNote     string             `json:"PrivateNote,omitempty"`
	MetaData        QBMetaData         `json:"MetaData,omitempty"`
}

type QBInvoiceLine struct {
	ID               string  `json:"Id,omitempty"`
	LineNum          int     `json:"LineNum,omitempty"`
	Description      string  `json:"Description,omitempty"`
	Amount           float64 `json:"Amount"`
	DetailType       string  `json:"DetailType"`
	SalesItemLineDetail QBSalesItemLineDetail `json:"SalesItemLineDetail,omitempty"`
}

type QBPaymentLine struct {
	Amount         float64           `json:"Amount"`
	LinkedTxn      []QBLinkedTxn     `json:"LinkedTxn,omitempty"`
}

type QBSalesItemLineDetail struct {
	ItemRef      QBRef    `json:"ItemRef,omitempty"`
	UnitPrice    float64  `json:"UnitPrice,omitempty"`
	Qty          float64  `json:"Qty,omitempty"`
	TaxCodeRef   QBRef    `json:"TaxCodeRef,omitempty"`
}

type QBLinkedTxn struct {
	TxnId   string `json:"TxnId"`
	TxnType string `json:"TxnType"`
}

type QBRef struct {
	Value string `json:"value"`
	Name  string `json:"name,omitempty"`
}

type QBAddress struct {
	Line1                 string `json:"Line1,omitempty"`
	Line2                 string `json:"Line2,omitempty"`
	City                  string `json:"City,omitempty"`
	Country               string `json:"Country,omitempty"`
	CountrySubDivisionCode string `json:"CountrySubDivisionCode,omitempty"`
	PostalCode            string `json:"PostalCode,omitempty"`
}

type QBMetaData struct {
	CreateTime      string `json:"CreateTime,omitempty"`
	LastUpdatedTime string `json:"LastUpdatedTime,omitempty"`
}

// QuickBooks API Response wrapper
type QBResponse struct {
	QueryResponse QBQueryResponse `json:"QueryResponse,omitempty"`
	Time          string          `json:"time,omitempty"`
	ErrorResponse QBErrorResponse `json:"ErrorResponse,omitempty"`
}

type QBQueryResponse struct {
	Customer []QBCustomer `json:"Customer,omitempty"`
	Invoice  []QBInvoice  `json:"Invoice,omitempty"`
	Payment  []QBPayment  `json:"Payment,omitempty"`
	MaxResults int        `json:"maxResults,omitempty"`
	StartPosition int     `json:"startPosition,omitempty"`
}

type QBErrorResponse struct {
	Fault QBFault `json:"Fault"`
}

type QBFault struct {
	Error []QBError `json:"Error"`
	Type  string    `json:"type"`
}

type QBError struct {
	Code   string `json:"code"`
	Detail string `json:"Detail"`
}

// NewQuickBooksService creates a new QuickBooks service instance
func NewQuickBooksService(config QuickBooksConfig) *QuickBooksService {
	return &QuickBooksService{
		config:     config,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// SetTokens sets the OAuth tokens for API access
func (q *QuickBooksService) SetTokens(accessToken, refreshToken string, expiresIn int) {
	q.accessToken = accessToken
	q.refreshToken = refreshToken
	q.tokenExpiresAt = time.Now().Add(time.Duration(expiresIn) * time.Second)
}

// RefreshAccessToken refreshes the OAuth access token
func (q *QuickBooksService) RefreshAccessToken() error {
	url := q.config.BaseURL + "/oauth2/v1/tokens/bearer"
	
	data := map[string]string{
		"grant_type":    "refresh_token",
		"refresh_token": q.refreshToken,
	}
	
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal refresh token request: %w", err)
	}
	
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create refresh token request: %w", err)
	}
	
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.SetBasicAuth(q.config.ClientID, q.config.ClientSecret)
	
	resp, err := q.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute refresh token request: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("refresh token request failed with status: %d", resp.StatusCode)
	}
	
	var tokens QuickBooksOAuthTokens
	if err := json.NewDecoder(resp.Body).Decode(&tokens); err != nil {
		return fmt.Errorf("failed to decode refresh token response: %w", err)
	}
	
	q.SetTokens(tokens.AccessToken, tokens.RefreshToken, tokens.ExpiresIn)
	return nil
}

// makeAPIRequest makes a request to QuickBooks API with proper authentication
func (q *QuickBooksService) makeAPIRequest(method, endpoint string, body interface{}) (*http.Response, error) {
	// Check if token needs refresh
	if time.Now().After(q.tokenExpiresAt.Add(-5 * time.Minute)) {
		if err := q.RefreshAccessToken(); err != nil {
			return nil, fmt.Errorf("failed to refresh access token: %w", err)
		}
	}
	
	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}
	
	url := fmt.Sprintf("%s/v3/company/%s/%s", q.config.BaseURL, q.config.CompanyID, endpoint)
	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create API request: %w", err)
	}
	
	req.Header.Set("Authorization", "Bearer "+q.accessToken)
	req.Header.Set("Accept", "application/json")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	
	resp, err := q.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute API request: %w", err)
	}
	
	return resp, nil
}

// SyncCustomer syncs a customer from NexusERP to QuickBooks
func (q *QuickBooksService) SyncCustomer(customer *models.Customer) (*QBCustomer, error) {
	qbCustomer := q.convertToQBCustomer(customer)
	
	resp, err := q.makeAPIRequest("POST", "customer", qbCustomer)
	if err != nil {
		return nil, fmt.Errorf("failed to sync customer: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("QuickBooks API error: %s", string(body))
	}
	
	var result QBResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode customer response: %w", err)
	}
	
	if len(result.QueryResponse.Customer) > 0 {
		return &result.QueryResponse.Customer[0], nil
	}
	
	return nil, fmt.Errorf("no customer returned in response")
}

// SyncInvoice syncs an invoice from NexusERP to QuickBooks
func (q *QuickBooksService) SyncInvoice(invoice *models.InvoiceWithDetails) (*QBInvoice, error) {
	qbInvoice := q.convertToQBInvoice(invoice)
	
	resp, err := q.makeAPIRequest("POST", "invoice", qbInvoice)
	if err != nil {
		return nil, fmt.Errorf("failed to sync invoice: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("QuickBooks API error: %s", string(body))
	}
	
	var result QBResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode invoice response: %w", err)
	}
	
	if len(result.QueryResponse.Invoice) > 0 {
		return &result.QueryResponse.Invoice[0], nil
	}
	
	return nil, fmt.Errorf("no invoice returned in response")
}

// SyncPayment syncs a payment from NexusERP to QuickBooks
func (q *QuickBooksService) SyncPayment(payment *models.CustomerPaymentWithDetails) (*QBPayment, error) {
	qbPayment := q.convertToQBPayment(payment)
	
	resp, err := q.makeAPIRequest("POST", "payment", qbPayment)
	if err != nil {
		return nil, fmt.Errorf("failed to sync payment: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("QuickBooks API error: %s", string(body))
	}
	
	var result QBResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode payment response: %w", err)
	}
	
	if len(result.QueryResponse.Payment) > 0 {
		return &result.QueryResponse.Payment[0], nil
	}
	
	return nil, fmt.Errorf("no payment returned in response")
}

// GetCustomerByName retrieves a customer from QuickBooks by name
func (q *QuickBooksService) GetCustomerByName(name string) (*QBCustomer, error) {
	query := fmt.Sprintf("SELECT * FROM Customer WHERE Name = '%s'", name)
	endpoint := fmt.Sprintf("query?query=%s", query)
	
	resp, err := q.makeAPIRequest("GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get customer: %w", err)
	}
	defer resp.Body.Close()
	
	var result QBResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode customer response: %w", err)
	}
	
	if len(result.QueryResponse.Customer) > 0 {
		return &result.QueryResponse.Customer[0], nil
	}
	
	return nil, nil
}

// Conversion functions
func (q *QuickBooksService) convertToQBCustomer(customer *models.Customer) *QBCustomer {
	qbCustomer := &QBCustomer{
		Name:             customer.Name,
		Active:           customer.Status == models.CustomerStatusActive,
		Notes:            stringValue(customer.Notes),
		CreditLimit:      customer.CreditLimit,
	}
	
	if customer.CompanyName != nil {
		qbCustomer.CompanyName = *customer.CompanyName
		qbCustomer.PrintOnCheckName = *customer.CompanyName
	}
	
	if customer.PrimaryEmail != nil {
		qbCustomer.PrimaryEmailAddr = *customer.PrimaryEmail
	}
	
	if customer.PrimaryPhone != nil {
		qbCustomer.PrimaryPhone = *customer.PrimaryPhone
	}
	
	// Set billing address
	if customer.AddressLine1 != nil {
		qbCustomer.BillAddr = QBAddress{
			Line1:      stringValue(customer.AddressLine1),
			Line2:      stringValue(customer.AddressLine2),
			City:       stringValue(customer.City),
			Country:    stringValue(customer.Country),
			PostalCode: stringValue(customer.PostalCode),
		}
		
		if customer.State != nil {
			qbCustomer.BillAddr.CountrySubDivisionCode = *customer.State
		}
	}
	
	return qbCustomer
}

func (q *QuickBooksService) convertToQBInvoice(invoice *models.InvoiceWithDetails) *QBInvoice {
	qbInvoice := &QBInvoice{
		DocNumber:       invoice.InvoiceNumber,
		TxnDate:        invoice.InvoiceDate.Format("2006-01-02"),
		DueDate:        invoice.DueDate.Format("2006-01-02"),
		TotalAmt:       invoice.TotalAmount,
		PrivateNote:    stringValue(invoice.Notes),
	}
	
	// Set customer reference
	if invoice.Customer != nil {
		qbInvoice.CustomerRef = QBRef{
			Value: fmt.Sprintf("%d", invoice.Customer.ID),
			Name:  invoice.Customer.Name,
		}
	}
	
	// Convert invoice items
	for i, item := range invoice.Items {
		qbLine := QBInvoiceLine{
			LineNum:     i + 1,
			Amount:      item.LineTotal,
			Description: item.Description,
			DetailType:  "SalesItemLineDetail",
			SalesItemLineDetail: QBSalesItemLineDetail{
				UnitPrice: item.UnitPrice,
				Qty:       item.Quantity,
			},
		}
		
		if item.Product != nil {
			qbLine.SalesItemLineDetail.ItemRef = QBRef{
				Value: fmt.Sprintf("%d", item.Product.ID),
				Name:  item.Product.Name,
			}
		}
		
		qbInvoice.Line = append(qbInvoice.Line, qbLine)
	}
	
	return qbInvoice
}

func (q *QuickBooksService) convertToQBPayment(payment *models.CustomerPaymentWithDetails) *QBPayment {
	qbPayment := &QBPayment{
		TxnDate:     payment.PaymentDate.Format("2006-01-02"),
		TotalAmt:    payment.Amount,
		PrivateNote: stringValue(payment.Notes),
	}
	
	// Set customer reference
	if payment.Customer != nil {
		qbPayment.CustomerRef = QBRef{
			Value: fmt.Sprintf("%d", payment.Customer.ID),
			Name:  payment.Customer.Name,
		}
	}
	
	// Convert payment allocations to lines
	for _, allocation := range payment.Allocations {
		if allocation.AccountsReceivable != nil {
			qbLine := QBPaymentLine{
				Amount: allocation.AllocatedAmount,
				LinkedTxn: []QBLinkedTxn{
					{
						TxnId:   fmt.Sprintf("%d", allocation.AccountsReceivable.InvoiceID),
						TxnType: "Invoice",
					},
				},
			}
			qbPayment.Line = append(qbPayment.Line, qbLine)
		}
	}
	
	return qbPayment
}

// Utility function to handle nil string pointers
func stringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// TestConnection tests the connection to QuickBooks API
func (q *QuickBooksService) TestConnection() error {
	resp, err := q.makeAPIRequest("GET", "companyinfo/1", nil)
	if err != nil {
		return fmt.Errorf("failed to test connection: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("connection test failed: %s", string(body))
	}
	
	return nil
}