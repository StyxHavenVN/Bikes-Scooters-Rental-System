/**
 * INFRASTRUCTURE MODULE (Data & External Layer) - GPS Repository
 * ================================================================
 * Theo Module View: Infrastructure Module → GPS Repository
 * 
 * Xử lý lưu trữ dữ liệu GPS (in-memory, mô phỏng database).
 * Chứa seed data: 5 xe mẫu tại khu vực TP.HCM.
 */

const GPSLocation = require('../models/gpsLocation');
const LocationHistory = require('../models/locationHistory');
const GPSDevice = require('../models/gpsDevice');

class GPSRepository {
    constructor() {
        /** @type {Map<string, GPSDevice>} deviceId → GPSDevice */
        this.devices = new Map();

        /** @type {Map<string, GPSLocation>} vehicleId → latest GPSLocation */
        this.currentLocations = new Map();

        /** @type {Map<string, LocationHistory>} vehicleId → LocationHistory */
        this.histories = new Map();

        /** @type {Object[]} vehicles - Danh sách xe (mô phỏng Vehicle Module) */
        this.vehicles = [];

        // Khởi tạo seed data
        this._seedData();
    }

    /**
     * Seed data: 5 xe mẫu tại khu vực TP.HCM
     * Mô phỏng dữ liệu từ Vehicle Management Service
     */
    _seedData() {
        const seedVehicles = [
            {
                id: 'VH001',
                name: 'Honda Vision 2024',
                type: 'scooter',
                licensePlate: '59-B1 12345',
                status: 'renting',
                renter: 'Nguyễn Văn A',
                // Quận 1 - Nhà thờ Đức Bà
                startLat: 10.7797,
                startLng: 106.6990
            },
            {
                id: 'VH002',
                name: 'Yamaha NVX 155',
                type: 'scooter',
                licensePlate: '59-C2 67890',
                status: 'renting',
                renter: 'Trần Thị B',
                // Quận 7 - Phú Mỹ Hưng
                startLat: 10.7295,
                startLng: 106.7218
            },
            {
                id: 'VH003',
                name: 'Giant ATX 830',
                type: 'bike',
                licensePlate: 'BK-003',
                status: 'renting',
                renter: 'Lê Văn C',
                // Thủ Đức - Đại học Bách Khoa
                startLat: 10.8804,
                startLng: 106.8057
            },
            {
                id: 'VH004',
                name: 'VinFast Klara S',
                type: 'scooter',
                licensePlate: '59-D4 11223',
                status: 'renting',
                renter: 'Phạm Thị D',
                // Quận Bình Thạnh - Landmark 81
                startLat: 10.7952,
                startLng: 106.7220
            },
            {
                id: 'VH005',
                name: 'Trinx M500 Elite',
                type: 'bike',
                licensePlate: 'BK-005',
                status: 'renting',
                renter: 'Hoàng Văn E',
                // Quận 2 - Thảo Điền
                startLat: 10.8040,
                startLng: 106.7370
            }
        ];

        seedVehicles.forEach(v => {
            // Tạo vehicle
            this.vehicles.push({
                id: v.id,
                name: v.name,
                type: v.type,
                licensePlate: v.licensePlate,
                status: v.status,
                renter: v.renter
            });

            // Tạo GPS Device cho mỗi xe
            const device = new GPSDevice({
                deviceId: `GPS_${v.id}`,
                vehicleId: v.id,
                status: 'active',
                batteryLevel: 70 + Math.floor(Math.random() * 30)
            });
            this.devices.set(device.deviceId, device);

            // Tạo vị trí ban đầu
            const initialLocation = new GPSLocation({
                latitude: v.startLat,
                longitude: v.startLng,
                speed: 0,
                heading: Math.random() * 360,
                accuracy: 5 + Math.random() * 10,
                deviceId: device.deviceId,
                vehicleId: v.id
            });
            this.currentLocations.set(v.id, initialLocation);

            // Tạo lịch sử di chuyển
            const history = new LocationHistory(v.id, device.deviceId);
            history.addLocation(initialLocation);
            this.histories.set(v.id, history);
        });

        console.log(`[GPS Repository] Đã khởi tạo ${this.vehicles.length} xe với GPS devices`);
    }

    // ==================== DEVICE OPERATIONS ====================

    /**
     * Đăng ký GPS device mới
     * @param {Object} deviceData
     * @returns {GPSDevice}
     */
    registerDevice(deviceData) {
        const device = new GPSDevice(deviceData);
        this.devices.set(device.deviceId, device);
        return device;
    }

    /**
     * Lấy thông tin device theo ID
     * @param {string} deviceId
     * @returns {GPSDevice|null}
     */
    getDevice(deviceId) {
        return this.devices.get(deviceId) || null;
    }

    /**
     * Lấy device theo vehicleId
     * @param {string} vehicleId
     * @returns {GPSDevice|null}
     */
    getDeviceByVehicle(vehicleId) {
        for (const device of this.devices.values()) {
            if (device.vehicleId === vehicleId) return device;
        }
        return null;
    }

    /**
     * Cập nhật trạng thái device
     * @param {string} deviceId
     * @param {string} status
     * @returns {GPSDevice|null}
     */
    updateDeviceStatus(deviceId, status) {
        const device = this.devices.get(deviceId);
        if (!device) return null;
        device.updateStatus(status);
        return device;
    }

    /**
     * Lấy tất cả devices
     * @returns {GPSDevice[]}
     */
    getAllDevices() {
        return Array.from(this.devices.values());
    }

    // ==================== LOCATION OPERATIONS ====================

    /**
     * Lưu vị trí GPS mới (nhận từ GPS Device)
     * @param {Object} locationData
     * @returns {GPSLocation}
     */
    saveLocation(locationData) {
        const location = new GPSLocation(locationData);
        const validation = location.validate();
        
        if (!validation.valid) {
            throw new Error(`GPS data không hợp lệ: ${validation.errors.join(', ')}`);
        }

        // Cập nhật vị trí hiện tại
        this.currentLocations.set(location.vehicleId, location);

        // Thêm vào lịch sử
        if (!this.histories.has(location.vehicleId)) {
            this.histories.set(location.vehicleId, new LocationHistory(location.vehicleId, location.deviceId));
        }
        this.histories.get(location.vehicleId).addLocation(location);

        // Cập nhật lastSeen của device
        if (location.deviceId) {
            const device = this.devices.get(location.deviceId);
            if (device) {
                device.updateLastSeen();
            }
        }

        return location;
    }

    /**
     * Lấy vị trí hiện tại của xe
     * @param {string} vehicleId
     * @returns {GPSLocation|null}
     */
    getCurrentLocation(vehicleId) {
        return this.currentLocations.get(vehicleId) || null;
    }

    /**
     * Lấy lịch sử di chuyển của xe
     * @param {string} vehicleId
     * @param {Date} [startTime]
     * @param {Date} [endTime]
     * @returns {LocationHistory|null}
     */
    getLocationHistory(vehicleId, startTime, endTime) {
        const history = this.histories.get(vehicleId);
        if (!history) return null;

        if (startTime || endTime) {
            // Tạo filtered history
            const filteredHistory = new LocationHistory(vehicleId, history.deviceId);
            const filteredLocations = history.getHistory(startTime, endTime);
            filteredLocations.forEach(loc => filteredHistory.addLocation(loc));
            return filteredHistory;
        }

        return history;
    }

    // ==================== VEHICLE OPERATIONS ====================

    /**
     * Lấy danh sách tất cả xe có GPS
     * @returns {Object[]} Danh sách xe kèm thông tin GPS
     */
    getVehiclesWithGPS() {
        return this.vehicles.map(vehicle => {
            const device = this.getDeviceByVehicle(vehicle.id);
            const location = this.getCurrentLocation(vehicle.id);
            const history = this.histories.get(vehicle.id);

            return {
                ...vehicle,
                gpsDevice: device ? device.toJSON() : null,
                currentLocation: location ? location.toJSON() : null,
                stats: history ? {
                    pointCount: history.getPointCount(),
                    distanceTraveled: history.getDistanceTraveled(),
                    duration: history.getDuration()
                } : null
            };
        });
    }

    /**
     * Lấy thông tin xe theo ID
     * @param {string} vehicleId
     * @returns {Object|null}
     */
    getVehicle(vehicleId) {
        return this.vehicles.find(v => v.id === vehicleId) || null;
    }
}

module.exports = GPSRepository;
