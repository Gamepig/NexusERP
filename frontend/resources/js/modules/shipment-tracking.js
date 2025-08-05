/**
 * shipment-tracking.js
 * 
 * Main module for shipment tracking functionality
 * Handles initialization and integration with the main application
 */

// Import components
import ShipmentTracking from '../components/shipment/ShipmentTracking.js';
import ShipmentTrackingCard from '../components/shipment/ShipmentTrackingCard.js';
import ShipmentTrackingDashboard from '../components/shipment/ShipmentTrackingDashboard.js';

// Global object for shipment tracking functionality
window.ShipmentTrackingModule = {
    components: {
        ShipmentTracking,
        ShipmentTrackingCard,
        ShipmentTrackingDashboard
    },

    // Initialize tracking for a specific element
    initTracking: (elementId, config = {}) => {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element with ID ${elementId} not found`);
            return;
        }

        const {
            trackingNumber = null,
            salesOrderId = null,
            customerId = null,
            type = 'full' // 'full', 'card', 'dashboard'
        } = config;

        // Choose component based on type
        let ComponentToRender;
        let props = {};

        switch (type) {
            case 'card':
                ComponentToRender = ShipmentTrackingCard;
                props = {
                    shipment: {
                        tracking_number: trackingNumber,
                        sales_order_id: salesOrderId,
                        customer_id: customerId
                    }
                };
                break;
            case 'dashboard':
                ComponentToRender = ShipmentTrackingDashboard;
                props = { salesOrderId, customerId };
                break;
            case 'full':
            default:
                ComponentToRender = ShipmentTracking;
                props = { trackingNumber, salesOrderId };
                break;
        }

        // Render component using React
        if (window.React && window.ReactDOM) {
            const reactElement = React.createElement(ComponentToRender, props);
            ReactDOM.render(reactElement, element);
        } else {
            console.error('React or ReactDOM not found. Please ensure React is loaded.');
        }
    },

    // API helpers for tracking
    api: {
        // Track single shipment
        trackShipment: async (trackingNumber) => {
            try {
                const response = await fetch(`/api/shipments/track/${trackingNumber}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error('Error tracking shipment:', error);
                throw error;
            }
        },

        // Track multiple shipments
        trackMultipleShipments: async (trackingNumbers) => {
            try {
                const response = await fetch('/api/shipments/track/batch', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    body: JSON.stringify({ tracking_numbers: trackingNumbers })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error('Error tracking multiple shipments:', error);
                throw error;
            }
        },

        // Get shipments for customer or order
        getShipments: async (params = {}) => {
            const queryParams = new URLSearchParams(params);
            try {
                const response = await fetch(`/api/shipments?${queryParams.toString()}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error('Error fetching shipments:', error);
                throw error;
            }
        }
    },

    // Utility functions
    utils: {
        // Get status display color
        getStatusColor: (status) => {
            const colors = {
                'picked_up': 'text-blue-600 bg-blue-100',
                'in_transit': 'text-yellow-600 bg-yellow-100',
                'out_for_delivery': 'text-purple-600 bg-purple-100',
                'delivered': 'text-green-600 bg-green-100',
                'exception': 'text-red-600 bg-red-100',
                'returned': 'text-gray-600 bg-gray-100',
                'cancelled': 'text-red-600 bg-red-100',
                'unknown': 'text-gray-600 bg-gray-100'
            };
            return colors[status] || 'text-gray-600 bg-gray-100';
        },

        // Get status display text
        getStatusText: (status) => {
            const texts = {
                'picked_up': '已取件',
                'in_transit': '運送中',
                'out_for_delivery': '配送中',
                'delivered': '已送達',
                'exception': '異常',
                'returned': '退回',
                'cancelled': '已取消',
                'unknown': '未知狀態'
            };
            return texts[status] || '未知狀態';
        },

        // Format date for display
        formatDate: (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
};

// Auto-initialize tracking components on page load
document.addEventListener('DOMContentLoaded', () => {
    // Look for elements with data-shipment-tracking attribute
    const trackingElements = document.querySelectorAll('[data-shipment-tracking]');
    
    trackingElements.forEach(element => {
        const config = {
            trackingNumber: element.dataset.trackingNumber,
            salesOrderId: element.dataset.salesOrderId,
            customerId: element.dataset.customerId,
            type: element.dataset.trackingType || 'full'
        };

        ShipmentTrackingModule.initTracking(element.id, config);
    });
});

// Export for ES6 modules
export default ShipmentTrackingModule;