/**
 * VIEW MODULE - API Service (Client-side)
 * ==========================================
 * Theo C&C View: Client → HTTPS/REST → API Gateway
 * 
 * Wrapper gọi REST APIs tới server.
 * Mọi request đều đi qua API Gateway trước khi tới GPS Tracking Service.
 */

const APIService = {
    baseURL: '',

    /**
     * Gọi API chung
     * @param {string} endpoint
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`[API Service] Lỗi gọi ${endpoint}:`, error.message);
            throw error;
        }
    },

    // ==================== GPS TRACKING SERVICE APIs ====================
    // Theo C&C View: Client → API Gateway → GPS Tracking Service

    /**
     * Lấy danh sách xe có GPS
     * GET /api/gps/vehicles
     */
    async getVehicles() {
        return this.request('/api/gps/vehicles');
    },

    /**
     * Lấy vị trí hiện tại của xe
     * GET /api/gps/vehicle/:id/location
     */
    async getVehicleLocation(vehicleId) {
        return this.request(`/api/gps/vehicle/${vehicleId}/location`);
    },

    /**
     * Lấy lịch sử di chuyển
     * GET /api/gps/vehicle/:id/history
     */
    async getVehicleHistory(vehicleId, startTime, endTime) {
        let url = `/api/gps/vehicle/${vehicleId}/history`;
        const params = new URLSearchParams();
        if (startTime) params.append('startTime', startTime);
        if (endTime) params.append('endTime', endTime);
        if (params.toString()) url += `?${params}`;
        
        return this.request(url);
    },

    /**
     * Gửi GPS location data (mô phỏng GPS Device → GPS Tracking Service)
     * POST /api/gps/location
     * Theo C&C View: GPS Devices → MQTT/HTTPS Async → GPS Tracking Service
     */
    async sendGPSData(locationData) {
        return this.request('/api/gps/location', {
            method: 'POST',
            body: JSON.stringify(locationData)
        });
    },

    /**
     * Lấy danh sách GPS devices
     * GET /api/gps/devices
     */
    async getDevices() {
        return this.request('/api/gps/devices');
    },

    /**
     * Đăng ký GPS device mới
     * POST /api/gps/device/register
     */
    async registerDevice(deviceData) {
        return this.request('/api/gps/device/register', {
            method: 'POST',
            body: JSON.stringify(deviceData)
        });
    },

    /**
     * Cập nhật trạng thái device
     * PUT /api/gps/device/:id/status
     */
    async updateDeviceStatus(deviceId, status) {
        return this.request(`/api/gps/device/${deviceId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },

    /**
     * Health check
     * GET /api/health
     */
    async healthCheck() {
        return this.request('/api/health');
    }
};
