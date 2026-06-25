/**
 * MODEL MODULE (Domain Layer) - LocationHistory
 * ================================================
 * Theo Module View: Tracking Module → LocationHistory
 * 
 * Quản lý lịch sử di chuyển của một xe/thiết bị GPS.
 * Business logic: tính tổng quãng đường, thời gian, tốc độ trung bình.
 */

const GPSLocation = require('./gpsLocation');

class LocationHistory {
    /**
     * @param {string} vehicleId - ID xe
     * @param {string} deviceId - ID thiết bị GPS
     */
    constructor(vehicleId, deviceId) {
        this.vehicleId = vehicleId;
        this.deviceId = deviceId;
        this.locations = []; // Mảng GPSLocation theo thứ tự thời gian
    }

    /**
     * Thêm một vị trí mới vào lịch sử
     * @param {GPSLocation} location
     */
    addLocation(location) {
        if (!(location instanceof GPSLocation)) {
            location = new GPSLocation(location);
        }
        this.locations.push(location);
        // Sắp xếp theo thời gian
        this.locations.sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * Lấy lịch sử trong khoảng thời gian
     * @param {Date} [startTime] - Thời điểm bắt đầu
     * @param {Date} [endTime] - Thời điểm kết thúc
     * @returns {GPSLocation[]}
     */
    getHistory(startTime, endTime) {
        let filtered = this.locations;

        if (startTime) {
            filtered = filtered.filter(loc => loc.timestamp >= new Date(startTime));
        }
        if (endTime) {
            filtered = filtered.filter(loc => loc.timestamp <= new Date(endTime));
        }

        return filtered;
    }

    /**
     * Lấy vị trí gần nhất (cuối cùng)
     * @returns {GPSLocation|null}
     */
    getLatestLocation() {
        if (this.locations.length === 0) return null;
        return this.locations[this.locations.length - 1];
    }

    /**
     * Tính tổng quãng đường đã di chuyển (km)
     * @returns {number}
     */
    getDistanceTraveled() {
        if (this.locations.length < 2) return 0;

        let totalDistance = 0;
        for (let i = 1; i < this.locations.length; i++) {
            totalDistance += this.locations[i - 1].distanceTo(this.locations[i]);
        }
        return Math.round(totalDistance * 100) / 100; // Làm tròn 2 chữ số
    }

    /**
     * Tính thời gian di chuyển (phút)
     * @returns {number}
     */
    getDuration() {
        if (this.locations.length < 2) return 0;

        const first = this.locations[0].timestamp;
        const last = this.locations[this.locations.length - 1].timestamp;
        return Math.round((last - first) / 60000); // Chuyển ms → phút
    }

    /**
     * Tính tốc độ trung bình (km/h)
     * @returns {number}
     */
    getAverageSpeed() {
        const duration = this.getDuration();
        if (duration === 0) return 0;

        const distance = this.getDistanceTraveled();
        return Math.round((distance / (duration / 60)) * 100) / 100;
    }

    /**
     * Lấy số lượng điểm GPS đã ghi nhận
     * @returns {number}
     */
    getPointCount() {
        return this.locations.length;
    }

    /**
     * Chuyển đổi sang object thuần
     */
    toJSON() {
        return {
            vehicleId: this.vehicleId,
            deviceId: this.deviceId,
            pointCount: this.getPointCount(),
            distanceTraveled: this.getDistanceTraveled(),
            duration: this.getDuration(),
            averageSpeed: this.getAverageSpeed(),
            locations: this.locations.map(loc => loc.toJSON())
        };
    }
}

module.exports = LocationHistory;
