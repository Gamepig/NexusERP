// Stocktaking API Module
class StocktakingAPI {
    constructor() {
        this.baseURL = '/api/stocktaking';
    }

    // Stocktaking Orders
    async getOrders(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const response = await axios.get(`${this.baseURL}?${queryParams}`);
        return response.data;
    }

    async getOrder(id) {
        const response = await axios.get(`${this.baseURL}/${id}`);
        return response.data;
    }

    async createOrder(data) {
        const response = await axios.post(this.baseURL, data);
        return response.data;
    }

    async updateOrder(id, data) {
        const response = await axios.put(`${this.baseURL}/${id}`, data);
        return response.data;
    }

    async deleteOrder(id) {
        const response = await axios.delete(`${this.baseURL}/${id}`);
        return response.data;
    }

    async startOrder(id, data = {}) {
        const response = await axios.post(`${this.baseURL}/${id}/start`, data);
        return response.data;
    }

    async processOrder(id, data) {
        const response = await axios.post(`${this.baseURL}/${id}/process`, data);
        return response.data;
    }

    async finalizeOrder(id, data = {}) {
        const response = await axios.post(`${this.baseURL}/${id}/finalize`, data);
        return response.data;
    }

    async approveOrder(id, data = {}) {
        const response = await axios.post(`${this.baseURL}/${id}/approve`, data);
        return response.data;
    }

    // Stocktaking Items
    async getOrderItems(orderId) {
        const response = await axios.get(`${this.baseURL}/${orderId}/items`);
        return response.data;
    }

    async countItem(orderId, productId, data) {
        const response = await axios.post(`${this.baseURL}/${orderId}/items/${productId}/count`, data);
        return response.data;
    }

    // Inventory Alerts
    async getInventoryAlerts(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const response = await axios.get(`/api/inventory/alerts?${queryParams}`);
        return response.data;
    }

    async getInventoryAlert(id) {
        const response = await axios.get(`/api/inventory/alerts/${id}`);
        return response.data;
    }

    async resolveAlert(id, data = {}) {
        const response = await axios.post(`/api/inventory/alerts/${id}/resolve`, data);
        return response.data;
    }

    async dismissAlert(id, data = {}) {
        const response = await axios.post(`/api/inventory/alerts/${id}/dismiss`, data);
        return response.data;
    }

    // Reports
    async getStocktakingReport(data) {
        const response = await axios.post(`${this.baseURL}/reports`, data);
        return response.data;
    }

    async getInventoryAlertReport(data) {
        const response = await axios.post('/api/inventory/alerts/reports', data);
        return response.data;
    }
}

// Stocktaking State Management
class StocktakingState {
    constructor() {
        this.api = new StocktakingAPI();
        this.state = {
            orders: [],
            currentOrder: null,
            orderItems: [],
            inventoryAlerts: [],
            loading: false,
            error: null
        };
        this.listeners = [];
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notify();
    }

    // Actions
    async loadOrders(params = {}) {
        this.setState({ loading: true, error: null });
        try {
            const data = await this.api.getOrders(params);
            this.setState({ orders: data.data || data, loading: false });
        } catch (error) {
            this.setState({ error: error.response?.data?.error || error.message, loading: false });
        }
    }

    async loadOrder(id) {
        this.setState({ loading: true, error: null });
        try {
            const data = await this.api.getOrder(id);
            this.setState({ currentOrder: data, loading: false });
        } catch (error) {
            this.setState({ error: error.response?.data?.error || error.message, loading: false });
        }
    }

    async createOrder(orderData) {
        this.setState({ loading: true, error: null });
        try {
            const data = await this.api.createOrder(orderData);
            this.setState({ 
                orders: [data, ...this.state.orders],
                loading: false 
            });
            return data;
        } catch (error) {
            this.setState({ error: error.response?.data?.error || error.message, loading: false });
            throw error;
        }
    }

    async updateOrder(id, orderData) {
        this.setState({ loading: true, error: null });
        try {
            const data = await this.api.updateOrder(id, orderData);
            this.setState({
                orders: this.state.orders.map(order => order.id === id ? data : order),
                currentOrder: this.state.currentOrder?.id === id ? data : this.state.currentOrder,
                loading: false
            });
            return data;
        } catch (error) {
            this.setState({ error: error.response?.data?.error || error.message, loading: false });
            throw error;
        }
    }

    async loadOrderItems(orderId) {
        this.setState({ loading: true, error: null });
        try {
            const data = await this.api.getOrderItems(orderId);
            this.setState({ orderItems: data, loading: false });
        } catch (error) {
            this.setState({ error: error.response?.data?.error || error.message, loading: false });
        }
    }

    async countItem(orderId, productId, countData) {
        this.setState({ loading: true, error: null });
        try {
            const data = await this.api.countItem(orderId, productId, countData);
            this.setState({
                orderItems: this.state.orderItems.map(item => 
                    item.product_id === productId ? data : item
                ),
                loading: false
            });
            return data;
        } catch (error) {
            this.setState({ error: error.response?.data?.error || error.message, loading: false });
            throw error;
        }
    }

    async loadInventoryAlerts(params = {}) {
        this.setState({ loading: true, error: null });
        try {
            const data = await this.api.getInventoryAlerts(params);
            this.setState({ inventoryAlerts: data.data || data, loading: false });
        } catch (error) {
            this.setState({ error: error.response?.data?.error || error.message, loading: false });
        }
    }

    async resolveAlert(id, notes = '') {
        this.setState({ loading: true, error: null });
        try {
            const data = await this.api.resolveAlert(id, { notes });
            this.setState({
                inventoryAlerts: this.state.inventoryAlerts.map(alert =>
                    alert.id === id ? data : alert
                ),
                loading: false
            });
            return data;
        } catch (error) {
            this.setState({ error: error.response?.data?.error || error.message, loading: false });
            throw error;
        }
    }
}

// Export global instance
window.stocktakingState = new StocktakingState();
window.StocktakingAPI = StocktakingAPI;
window.StocktakingState = StocktakingState;