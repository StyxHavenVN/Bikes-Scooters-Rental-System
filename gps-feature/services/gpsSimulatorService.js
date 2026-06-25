/**
 * EXTERNAL SYSTEM SIMULATOR - GPS Devices
 * ==========================================
 * Theo C&C View: GPS Devices (External System) → MQTT/HTTPS Async → GPS Tracking Service
 * 
 * Khởi chạy ngầm phía server để định kỳ cập nhật tọa độ mới cho xe,
 * mô phỏng thiết bị GPS gắn trên phương tiện gửi dữ liệu thực tế.
 */

class GPSSimulatorService {
    /**
     * @param {import('../repositories/gpsRepository')} gpsRepo
     */
    constructor(gpsRepo) {
        this.gpsRepo = gpsRepo;
        this.intervalId = null;
        this.updateInterval = 3000; // Định kỳ 3 giây
        this.vehicleStates = {};
    }

    /**
     * Khởi chạy mô phỏng
     */
    start() {
        console.log('='.repeat(60));
        console.log('  [GPS Devices - External System] Starting periodic transmissions...');
        console.log('  Protocol: HTTPS Async (mô phỏng MQTT/HTTPS)');
        console.log('='.repeat(60));

        const vehicles = this.gpsRepo.getVehiclesWithGPS();
        vehicles.forEach(vehicle => {
            if (vehicle.currentLocation) {
                // Thiết lập trạng thái di chuyển ban đầu dựa trên vị trí hiện tại
                this.vehicleStates[vehicle.id] = {
                    vehicleId: vehicle.id,
                    deviceId: vehicle.gpsDevice ? vehicle.gpsDevice.deviceId : `GPS_${vehicle.id}`,
                    type: vehicle.type,
                    latitude: vehicle.currentLocation.latitude,
                    longitude: vehicle.currentLocation.longitude,
                    speed: vehicle.currentLocation.speed || 0,
                    heading: vehicle.currentLocation.heading || Math.random() * 360,
                    batteryLevel: vehicle.gpsDevice ? vehicle.gpsDevice.batteryLevel : 85,
                    moveAngle: Math.random() * Math.PI * 2,
                    turnRate: (Math.random() - 0.5) * 0.3,
                    speedVariation: Math.random()
                };
            }
        });

        // Bắt đầu vòng lặp gửi dữ liệu
        this.intervalId = setInterval(() => {
            this._broadcastLocations();
        }, this.updateInterval);
    }

    /**
     * Dừng mô phỏng
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Cập nhật vị trí của tất cả các xe
     */
    _broadcastLocations() {
        const vehicleIds = Object.keys(this.vehicleStates);
        for (const vehicleId of vehicleIds) {
            const state = this.vehicleStates[vehicleId];
            
            // Tính toán vị trí tiếp theo
            const newLocation = this._calculateNewPosition(state);
            
            // Lưu dữ liệu vào repository (mô phỏng tiếp nhận REST/MQTT từ thiết bị)
            try {
                this.gpsRepo.saveLocation(newLocation);
                
                // Cập nhật mức pin của thiết bị
                const device = this.gpsRepo.getDevice(state.deviceId);
                if (device) {
                    device.updateBattery(newLocation.batteryLevel);
                }
            } catch (err) {
                console.error(`[GPS Devices] Lỗi gửi dữ liệu cho xe ${vehicleId}:`, err.message);
            }
        }
    }

    /**
     * Tính toán vị trí xe tiếp theo dựa trên vận tốc và góc lái ngẫu nhiên mượt mà
     */
    _calculateNewPosition(state) {
        const maxSpeed = state.type === 'scooter' ? 45 : 25;
        const minSpeed = state.type === 'scooter' ? 15 : 8;
        
        // Vận tốc dao động mượt
        state.speedVariation += (Math.random() - 0.5) * 0.2;
        state.speedVariation = Math.max(0, Math.min(1, state.speedVariation));
        state.speed = minSpeed + (maxSpeed - minSpeed) * state.speedVariation;

        // Thỉnh thoảng dừng xe (mô phỏng đèn đỏ, dừng chân)
        if (Math.random() < 0.05) {
            state.speed = 0;
        }

        // Đổi hướng di chuyển mượt mà
        state.turnRate += (Math.random() - 0.5) * 0.1;
        state.turnRate = Math.max(-0.5, Math.min(0.5, state.turnRate));
        state.moveAngle += state.turnRate;

        // Tính khoảng cách đã đi (km) trong 3s
        const timeHours = this.updateInterval / 3600000;
        const distanceKm = state.speed * timeHours;

        // Chuyển khoảng cách sang độ vĩ/kinh (xấp xỉ khu vực Xích đạo/TP.HCM)
        const deltaLat = distanceKm * Math.cos(state.moveAngle) / 111.32;
        const deltaLng = distanceKm * Math.sin(state.moveAngle) / (111.32 * Math.cos(state.latitude * Math.PI / 180));

        // Cập nhật tọa độ
        state.latitude += deltaLat;
        state.longitude += deltaLng;

        // Giữ xe di chuyển trong phạm vi TP.HCM, nếu vượt ranh giới thì quay đầu ngược lại
        if (state.latitude < 10.7 || state.latitude > 10.9) {
            state.moveAngle = Math.PI - state.moveAngle;
            state.latitude = Math.max(10.7, Math.min(10.9, state.latitude));
        }
        if (state.longitude < 106.6 || state.longitude > 106.85) {
            state.moveAngle = -state.moveAngle;
            state.longitude = Math.max(106.6, Math.min(106.85, state.longitude));
        }

        // Tính hướng di chuyển dạng độ (heading: 0-360)
        state.heading = ((state.moveAngle * 180 / Math.PI) % 360 + 360) % 360;

        // Mức pin hao hụt rất chậm
        state.batteryLevel = Math.max(5, state.batteryLevel - 0.01);

        return {
            latitude: Math.round(state.latitude * 1000000) / 1000000,
            longitude: Math.round(state.longitude * 1000000) / 1000000,
            speed: Math.round(state.speed * 10) / 10,
            heading: Math.round(state.heading),
            accuracy: 3 + Math.random() * 5,
            deviceId: state.deviceId,
            vehicleId: state.vehicleId,
            batteryLevel: Math.round(state.batteryLevel)
        };
    }
}

module.exports = GPSSimulatorService;
