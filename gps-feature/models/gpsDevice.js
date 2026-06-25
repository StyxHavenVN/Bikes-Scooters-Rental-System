/**
 * MODEL MODULE (Domain Layer) - GPSDevice
 * ==========================================
 * Theo Module View: Tracking Module → GPSDevice
 * Cũng liên quan đến Vehicle Module (GPSDevice là thuộc tính của Vehicle)
 * 
 * Đại diện cho thiết bị GPS được gắn trên xe.
 * Business logic: kiểm tra trạng thái, liên kết với vehicle.
 */

class GPSDevice {
    static STATUS = {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        MAINTENANCE: 'maintenance',
        OFFLINE: 'offline'
    };

    /**
     * @param {Object} data
     * @param {string} data.deviceId - ID thiết bị GPS
     * @param {string} data.vehicleId - ID xe được gắn GPS
     * @param {string} [data.status] - Trạng thái thiết bị
     * @param {number} [data.batteryLevel] - Mức pin (0-100%)
     * @param {string} [data.firmwareVersion] - Phiên bản firmware
     * @param {Date|string} [data.lastSeen] - Lần cuối gửi dữ liệu
     * @param {Date|string} [data.installedAt] - Ngày lắp đặt
     */
    constructor(data) {
        this.deviceId = data.deviceId;
        this.vehicleId = data.vehicleId;
        this.status = data.status || GPSDevice.STATUS.ACTIVE;
        this.batteryLevel = data.batteryLevel || 100;
        this.firmwareVersion = data.firmwareVersion || '1.0.0';
        this.lastSeen = data.lastSeen ? new Date(data.lastSeen) : new Date();
        this.installedAt = data.installedAt ? new Date(data.installedAt) : new Date();
    }

    /**
     * Kiểm tra thiết bị đang hoạt động
     * @returns {boolean}
     */
    isActive() {
        return this.status === GPSDevice.STATUS.ACTIVE;
    }

    /**
     * Kiểm tra thiết bị đang online (gửi data trong 5 phút gần nhất)
     * @returns {boolean}
     */
    isOnline() {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return this.lastSeen >= fiveMinutesAgo && this.isActive();
    }

    /**
     * Cập nhật thời gian gửi data cuối cùng
     */
    updateLastSeen() {
        this.lastSeen = new Date();
    }

    /**
     * Cập nhật trạng thái thiết bị
     * @param {string} newStatus
     */
    updateStatus(newStatus) {
        if (!Object.values(GPSDevice.STATUS).includes(newStatus)) {
            throw new Error(`Trạng thái không hợp lệ: ${newStatus}`);
        }
        this.status = newStatus;
    }

    /**
     * Cập nhật mức pin
     * @param {number} level
     */
    updateBattery(level) {
        if (level < 0 || level > 100) {
            throw new Error('Mức pin phải từ 0 đến 100');
        }
        this.batteryLevel = level;
    }

    /**
     * Kiểm tra pin yếu (dưới 20%)
     * @returns {boolean}
     */
    isLowBattery() {
        return this.batteryLevel < 20;
    }

    /**
     * Chuyển đổi sang object thuần
     */
    toJSON() {
        return {
            deviceId: this.deviceId,
            vehicleId: this.vehicleId,
            status: this.status,
            batteryLevel: this.batteryLevel,
            firmwareVersion: this.firmwareVersion,
            lastSeen: this.lastSeen.toISOString(),
            installedAt: this.installedAt.toISOString(),
            isOnline: this.isOnline(),
            isLowBattery: this.isLowBattery()
        };
    }
}

module.exports = GPSDevice;
