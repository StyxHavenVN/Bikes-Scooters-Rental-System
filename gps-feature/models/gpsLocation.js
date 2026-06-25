/**
 * MODEL MODULE (Domain Layer) - GPSLocation
 * ============================================
 * Theo Module View: Tracking Module → GPSLocation
 * 
 * Đại diện cho một điểm vị trí GPS tại một thời điểm cụ thể.
 * Chứa business logic: validate coordinates, calculate distance.
 */

class GPSLocation {
    /**
     * @param {Object} data
     * @param {number} data.latitude - Vĩ độ (-90 đến 90)
     * @param {number} data.longitude - Kinh độ (-180 đến 180)
     * @param {number} [data.speed] - Tốc độ (km/h)
     * @param {number} [data.heading] - Hướng di chuyển (0-360 độ)
     * @param {number} [data.accuracy] - Độ chính xác (mét)
     * @param {string} [data.deviceId] - ID thiết bị GPS gửi data
     * @param {string} [data.vehicleId] - ID xe được gắn GPS
     * @param {Date|string} [data.timestamp] - Thời điểm ghi nhận
     */
    constructor(data) {
        this.id = data.id || GPSLocation.generateId();
        this.latitude = data.latitude;
        this.longitude = data.longitude;
        this.speed = data.speed || 0;
        this.heading = data.heading || 0;
        this.accuracy = data.accuracy || 10;
        this.deviceId = data.deviceId || null;
        this.vehicleId = data.vehicleId || null;
        this.timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    }

    /**
     * Validate tọa độ GPS hợp lệ
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validate() {
        const errors = [];

        if (typeof this.latitude !== 'number' || this.latitude < -90 || this.latitude > 90) {
            errors.push('Latitude phải nằm trong khoảng -90 đến 90');
        }
        if (typeof this.longitude !== 'number' || this.longitude < -180 || this.longitude > 180) {
            errors.push('Longitude phải nằm trong khoảng -180 đến 180');
        }
        if (this.speed < 0) {
            errors.push('Speed không thể âm');
        }
        if (this.heading < 0 || this.heading > 360) {
            errors.push('Heading phải nằm trong khoảng 0 đến 360');
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Tính khoảng cách (km) giữa 2 điểm GPS bằng Haversine formula
     * @param {GPSLocation} otherLocation
     * @returns {number} Khoảng cách tính bằng km
     */
    distanceTo(otherLocation) {
        const R = 6371; // Bán kính Trái Đất (km)
        const dLat = GPSLocation.toRad(otherLocation.latitude - this.latitude);
        const dLon = GPSLocation.toRad(otherLocation.longitude - this.longitude);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(GPSLocation.toRad(this.latitude)) *
                  Math.cos(GPSLocation.toRad(otherLocation.latitude)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Chuyển đổi sang object thuần (cho JSON response)
     */
    toJSON() {
        return {
            id: this.id,
            latitude: this.latitude,
            longitude: this.longitude,
            speed: this.speed,
            heading: this.heading,
            accuracy: this.accuracy,
            deviceId: this.deviceId,
            vehicleId: this.vehicleId,
            timestamp: this.timestamp.toISOString()
        };
    }

    static toRad(deg) {
        return deg * (Math.PI / 180);
    }

    static generateId() {
        return 'loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }
}

module.exports = GPSLocation;
