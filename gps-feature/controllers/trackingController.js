/**
 * CONTROLLER MODULE (Application Layer) - Tracking Controller
 * ==============================================================
 * Theo Module View: Controller Module → Tracking Controller
 * Theo C&C View: GPS Tracking Service endpoints
 * 
 * Controller validates input, processes requests, và orchestrates Model operations.
 * Các endpoint mô phỏng luồng: API Gateway → GPS Tracking Service
 */

const express = require('express');
const router = express.Router();

/**
 * Factory function - nhận GPSRepository instance từ server.js
 * @param {import('../repositories/gpsRepository')} gpsRepo
 * @returns {express.Router}
 */
module.exports = function(gpsRepo) {

    /**
     * POST /api/gps/location
     * ========================
     * Theo C&C View: GPS Devices → (MQTT/HTTPS Async) → GPS Tracking Service
     * Nhận dữ liệu GPS từ thiết bị gắn trên xe.
     */
    router.post('/location', (req, res) => {
        try {
            const { latitude, longitude, speed, heading, accuracy, deviceId, vehicleId, batteryLevel } = req.body;

            if (!latitude || !longitude || !vehicleId) {
                return res.status(400).json({
                    error: 'Thiếu dữ liệu bắt buộc: latitude, longitude, vehicleId'
                });
            }

            // Lưu vị trí vào Repository (Infrastructure Layer)
            const location = gpsRepo.saveLocation({
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                speed: parseFloat(speed) || 0,
                heading: parseFloat(heading) || 0,
                accuracy: parseFloat(accuracy) || 10,
                deviceId: deviceId || `GPS_${vehicleId}`,
                vehicleId
            });

            // Cập nhật pin nếu có
            if (batteryLevel !== undefined && deviceId) {
                const device = gpsRepo.getDevice(deviceId);
                if (device) {
                    device.updateBattery(parseFloat(batteryLevel));
                }
            }

            console.log(`[GPS Tracking Service] Nhận GPS data từ ${vehicleId}: (${latitude}, ${longitude}) - ${speed} km/h`);

            res.status(200).json({
                message: 'Đã nhận và lưu dữ liệu GPS thành công',
                location: location.toJSON()
            });

        } catch (error) {
            console.error('[GPS Tracking Service] Lỗi xử lý GPS data:', error.message);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * GET /api/gps/vehicles
     * =======================
     * Theo C&C View: Client → API Gateway → GPS Tracking Service
     * Lấy danh sách tất cả xe có gắn GPS kèm vị trí hiện tại.
     */
    router.get('/vehicles', (req, res) => {
        try {
            const vehicles = gpsRepo.getVehiclesWithGPS();
            console.log(`[GPS Tracking Service] Trả về danh sách ${vehicles.length} xe có GPS`);

            res.status(200).json({
                count: vehicles.length,
                vehicles
            });
        } catch (error) {
            console.error('[GPS Tracking Service] Lỗi lấy danh sách xe:', error.message);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * GET /api/gps/vehicle/:id/location
     * ====================================
     * Theo C&C View: Client → API Gateway → GPS Tracking Service
     * Lấy vị trí hiện tại (real-time) của một xe.
     */
    router.get('/vehicle/:id/location', (req, res) => {
        try {
            const vehicleId = req.params.id;
            const vehicle = gpsRepo.getVehicle(vehicleId);

            if (!vehicle) {
                return res.status(404).json({ error: `Không tìm thấy xe: ${vehicleId}` });
            }

            const location = gpsRepo.getCurrentLocation(vehicleId);
            const device = gpsRepo.getDeviceByVehicle(vehicleId);

            res.status(200).json({
                vehicle,
                currentLocation: location ? location.toJSON() : null,
                device: device ? device.toJSON() : null
            });

        } catch (error) {
            console.error('[GPS Tracking Service] Lỗi lấy vị trí xe:', error.message);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * GET /api/gps/vehicle/:id/history
     * ===================================
     * Theo C&C View: Client → API Gateway → GPS Tracking Service
     * Lấy lịch sử di chuyển (Location History) của một xe.
     */
    router.get('/vehicle/:id/history', (req, res) => {
        try {
            const vehicleId = req.params.id;
            const { startTime, endTime } = req.query;

            const vehicle = gpsRepo.getVehicle(vehicleId);
            if (!vehicle) {
                return res.status(404).json({ error: `Không tìm thấy xe: ${vehicleId}` });
            }

            const history = gpsRepo.getLocationHistory(
                vehicleId,
                startTime ? new Date(startTime) : null,
                endTime ? new Date(endTime) : null
            );

            res.status(200).json({
                vehicle,
                history: history ? history.toJSON() : null
            });

        } catch (error) {
            console.error('[GPS Tracking Service] Lỗi lấy lịch sử:', error.message);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * POST /api/gps/device/register
     * ================================
     * Đăng ký GPS device mới cho xe.
     */
    router.post('/device/register', (req, res) => {
        try {
            const { deviceId, vehicleId, firmwareVersion } = req.body;

            if (!deviceId || !vehicleId) {
                return res.status(400).json({ error: 'Thiếu deviceId hoặc vehicleId' });
            }

            // Kiểm tra device đã tồn tại
            if (gpsRepo.getDevice(deviceId)) {
                return res.status(409).json({ error: `Device ${deviceId} đã được đăng ký` });
            }

            const device = gpsRepo.registerDevice({
                deviceId,
                vehicleId,
                firmwareVersion: firmwareVersion || '1.0.0'
            });

            console.log(`[GPS Tracking Service] Đăng ký device mới: ${deviceId} → ${vehicleId}`);

            res.status(201).json({
                message: 'Đăng ký GPS device thành công',
                device: device.toJSON()
            });

        } catch (error) {
            console.error('[GPS Tracking Service] Lỗi đăng ký device:', error.message);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * PUT /api/gps/device/:id/status
     * =================================
     * Cập nhật trạng thái GPS device.
     */
    router.put('/device/:id/status', (req, res) => {
        try {
            const deviceId = req.params.id;
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({ error: 'Thiếu trạng thái mới' });
            }

            const device = gpsRepo.updateDeviceStatus(deviceId, status);
            if (!device) {
                return res.status(404).json({ error: `Không tìm thấy device: ${deviceId}` });
            }

            console.log(`[GPS Tracking Service] Cập nhật trạng thái ${deviceId}: ${status}`);

            res.status(200).json({
                message: 'Cập nhật trạng thái thành công',
                device: device.toJSON()
            });

        } catch (error) {
            console.error('[GPS Tracking Service] Lỗi cập nhật device:', error.message);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * GET /api/gps/devices
     * ======================
     * Lấy danh sách tất cả GPS devices.
     */
    router.get('/devices', (req, res) => {
        try {
            const devices = gpsRepo.getAllDevices().map(d => d.toJSON());
            res.status(200).json({
                count: devices.length,
                devices
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
