/**
 * VIEW MODULE - Main Application (app.js)
 * ==========================================
 * Theo Module View: View Module → Customer Web App
 * 
 * Entry point cho GPS Tracking Dashboard.
 * Khởi tạo các controller và service, xử lý event handling.
 * Kết nối các thành phần: Map Controller, GPS Simulator, API Service.
 */

const App = {
    /** @type {Object[]} Danh sách xe */
    vehicles: [],

    /** @type {string|null} ID xe đang được chọn */
    selectedVehicleId: null,

    /** @type {boolean} Đã khởi tạo xong? */
    initialized: false,

    /** @type {boolean} Đã dựng danh sách xe ở sidebar? */
    listRendered: false,

    /**
     * Khởi tạo ứng dụng
     */
    async init() {
        console.log('='.repeat(50));
        console.log('  GPS TRACKING DASHBOARD');
        console.log('  Bikes & Scooters Rental System');
        console.log('='.repeat(50));

        try {
            // 1. Khởi tạo Map Controller (External GPS/Maps API)
            MapController.initialize();
            this.showToast('🗺️ Bản đồ Google Maps đã sẵn sàng', 'info');

            // 2. Tải danh sách xe từ GPS Tracking Service
            await this.loadVehicles();

            // 3. Khởi động polling định kỳ 3 giây để lấy dữ liệu vị trí thời gian thực (từ GPS Devices ngầm)
            setInterval(async () => {
                try {
                    await this.loadVehicles();
                } catch (err) {
                    console.error('[App] Lỗi polling dữ liệu vị trí:', err.message);
                }
            }, 3000);

            // 4. Bind events
            this._bindEvents();

            // 5. Cập nhật trạng thái kết nối
            this._updateConnectionStatus(true);

            // 6. Fit map cho tất cả xe
            setTimeout(() => MapController.fitAllMarkers(), 500);

            this.initialized = true;
            this.showToast('✅ Hệ thống GPS Tracking sẵn sàng', 'success');

        } catch (error) {
            console.error('[App] Lỗi khởi tạo:', error);
            this.showToast('❌ Lỗi kết nối GPS Tracking Service', 'error');
            this._updateConnectionStatus(false);
        }
    },

    /**
     * Tải danh sách xe từ GPS Tracking Service
     * Luồng C&C: Client → API Gateway → GPS Tracking Service
     */
    async loadVehicles() {
        const data = await APIService.getVehicles();
        this.vehicles = data.vehicles;

        // Render vehicle list trong sidebar lần đầu
        if (!this.listRendered) {
            this._renderVehicleList();
            this.listRendered = true;
        } else {
            // Cập nhật giá trị tốc độ thời gian thực ở sidebar (tránh dựng lại toàn bộ DOM gây giật/cuộn)
            this.vehicles.forEach(vehicle => {
                const speedEl = document.getElementById(`speed_${vehicle.id}`);
                if (speedEl && vehicle.currentLocation) {
                    const speed = vehicle.currentLocation.speed !== undefined ? vehicle.currentLocation.speed : 0;
                    speedEl.textContent = `⚡ ${speed} km/h`;
                }
            });
        }

        // Cập nhật hoặc thêm markers lên bản đồ
        this.vehicles.forEach(vehicle => {
            if (vehicle.currentLocation) {
                MapController.updateVehicleMarker(vehicle, vehicle.currentLocation);
            }
        });

        // Cập nhật counter
        document.getElementById('vehicleCount').textContent = `${this.vehicles.length} xe`;

        // Cập nhật Info Panel nếu xe đang chọn nhận được vị trí mới
        if (this.selectedVehicleId) {
            const selectedVehicle = this.vehicles.find(v => v.id === this.selectedVehicleId);
            if (selectedVehicle) {
                this._updateInfoPanel(selectedVehicle);
            }
        }

        // Cập nhật thời gian nhận tín hiệu cuối
        document.getElementById('lastUpdateTime').textContent = 
            `Cập nhật: ${new Date().toLocaleTimeString('vi-VN')}`;
    },

    /**
     * Render danh sách xe trong sidebar
     */
    _renderVehicleList() {
        const container = document.getElementById('vehicleList');
        
        if (this.vehicles.length === 0) {
            container.innerHTML = '<div class="loading-placeholder"><span>Không có xe nào</span></div>';
            return;
        }

        container.innerHTML = this.vehicles.map(vehicle => {
            const icon = vehicle.type === 'bike' ? '🚲' : '🛵';
            const speed = vehicle.currentLocation ? `${vehicle.currentLocation.speed || 0} km/h` : '—';
            const typeBadge = vehicle.type === 'bike' ? 'bike' : 'scooter';

            return `
                <div class="vehicle-card" data-vehicle-id="${vehicle.id}" id="vehicleCard_${vehicle.id}">
                    <div class="vehicle-icon">${icon}</div>
                    <div class="vehicle-details">
                        <div class="vehicle-name">${vehicle.name}</div>
                        <div class="vehicle-meta">
                            <span class="badge ${typeBadge}">${vehicle.type}</span>
                            <span>${vehicle.licensePlate}</span>
                        </div>
                    </div>
                    <div class="vehicle-speed" id="speed_${vehicle.id}">
                        ⚡ ${speed}
                    </div>
                </div>
            `;
        }).join('');

        // Bind click events cho từng vehicle card
        container.querySelectorAll('.vehicle-card').forEach(card => {
            card.addEventListener('click', () => {
                const vehicleId = card.dataset.vehicleId;
                this.showVehicleInfo(vehicleId);
            });
        });
    },

    /**
     * Hiển thị thông tin chi tiết xe (Info Panel)
     * @param {string} vehicleId
     */
    async showVehicleInfo(vehicleId) {
        this.selectedVehicleId = vehicleId;

        // Highlight card trong sidebar
        document.querySelectorAll('.vehicle-card').forEach(card => {
            card.classList.toggle('active', card.dataset.vehicleId === vehicleId);
        });

        // Highlight marker trên bản đồ
        MapController.highlightMarker(vehicleId);

        try {
            // Lấy thông tin chi tiết từ GPS Tracking Service
            const data = await APIService.getVehicleLocation(vehicleId);
            const vehicle = data.vehicle;
            const location = data.currentLocation;
            const device = data.device;

            // Cập nhật Info Panel
            const icon = vehicle.type === 'bike' ? '🚲' : '🛵';
            document.getElementById('panelVehicleIcon').textContent = icon;
            document.getElementById('panelVehicleName').textContent = vehicle.name;
            document.getElementById('panelVehicleType').textContent = vehicle.type;
            document.getElementById('panelVehicleType').className = `badge ${vehicle.type}`;
            document.getElementById('panelLicensePlate').textContent = vehicle.licensePlate;
            document.getElementById('panelRenter').textContent = vehicle.renter || '—';

            if (location) {
                document.getElementById('panelCoordinates').textContent = 
                    `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
                document.getElementById('panelSpeed').textContent = `${location.speed || 0} km/h`;
            }

            if (device) {
                const batteryColor = device.batteryLevel < 20 ? 'color: var(--danger)' : '';
                document.getElementById('panelBattery').innerHTML = 
                    `<span style="${batteryColor}">${device.batteryLevel}%</span> ${device.isOnline ? '🟢' : '🔴'}`;
            }

            // Lấy stats từ vehicle data đã cache
            const vehicleData = this.vehicles.find(v => v.id === vehicleId);
            if (vehicleData && vehicleData.stats) {
                document.getElementById('panelDistance').textContent = 
                    `${vehicleData.stats.distanceTraveled} km`;
            }

            // Hiện panel
            document.getElementById('vehicleInfoPanel').classList.remove('hidden');

            // Focus bản đồ
            MapController.focusVehicle(vehicleId);

        } catch (error) {
            console.error('[App] Lỗi lấy thông tin xe:', error);
            this.showToast('❌ Không thể tải thông tin xe', 'error');
        }
    },

    /**
     * Hiển thị lịch sử di chuyển trên bản đồ
     * @param {string} vehicleId
     */
    async showVehicleHistory(vehicleId) {
        try {
            this.showToast('📍 Đang tải lịch sử di chuyển...', 'info');

            const data = await APIService.getVehicleHistory(vehicleId);
            
            if (data.history && data.history.locations && data.history.locations.length > 1) {
                const vehicle = this.vehicles.find(v => v.id === vehicleId);
                MapController.drawHistoryPath(data.history.locations, vehicle ? vehicle.type : 'scooter');

                // Cập nhật distance
                document.getElementById('panelDistance').textContent = 
                    `${data.history.distanceTraveled} km`;

                this.showToast(
                    `📊 ${data.history.pointCount} điểm GPS | ${data.history.distanceTraveled} km`, 
                    'success'
                );
            } else {
                this.showToast('ℹ️ Chưa đủ dữ liệu lịch sử. Hãy bật GPS Simulator!', 'info');
            }

        } catch (error) {
            console.error('[App] Lỗi tải lịch sử:', error);
            this.showToast('❌ Không thể tải lịch sử di chuyển', 'error');
        }
    },

    /**
     * Cập nhật Info Panel khi xe được chọn có vị trí mới từ vòng lặp Polling
     * @param {Object} vehicle - Thông tin xe kèm vị trí hiện tại
     */
    _updateInfoPanel(vehicle) {
        const location = vehicle.currentLocation;
        const device = vehicle.gpsDevice;

        if (location) {
            document.getElementById('panelCoordinates').textContent = 
                `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
            document.getElementById('panelSpeed').textContent = `${location.speed || 0} km/h`;
        }

        if (device) {
            const batteryColor = device.batteryLevel < 20 ? 'color: var(--danger)' : '';
            document.getElementById('panelBattery').innerHTML = 
                `<span style="${batteryColor}">${device.batteryLevel}%</span> ${device.isOnline ? '🟢' : '🔴'}`;
        }

        if (vehicle.stats) {
            document.getElementById('panelDistance').textContent = 
                `${vehicle.stats.distanceTraveled} km`;
        }
    },

    /**
     * Bind tất cả event handlers
     */
    _bindEvents() {
        // Info Panel controls
        document.getElementById('btnClosePanel').addEventListener('click', () => {
            document.getElementById('vehicleInfoPanel').classList.add('hidden');
            this.selectedVehicleId = null;
            MapController.followingVehicle = null; // Stop follow mode
            MapController._showRecenterButton(false); // Hide floating recenter button
            MapController.clearHistory();
            // Remove active state from vehicle cards
            document.querySelectorAll('.vehicle-card').forEach(card => {
                card.classList.remove('active');
            });
        });

        document.getElementById('btnShowHistory').addEventListener('click', () => {
            if (this.selectedVehicleId) {
                this.showVehicleHistory(this.selectedVehicleId);
            }
        });

        document.getElementById('btnCenterVehicle').addEventListener('click', () => {
            if (this.selectedVehicleId) {
                MapController.toggleFollow(this.selectedVehicleId);
            }
        });

        // Map controls
        document.getElementById('btnFitAll').addEventListener('click', () => {
            MapController.fitAllMarkers();
            MapController.clearHistory();
        });

        document.getElementById('btnRefresh').addEventListener('click', async () => {
            await this.loadVehicles();
            this.showToast('🔄 Đã làm mới dữ liệu', 'info');
        });

        // Nút nổi Căn giữa (Google Maps style)
        const recenterBtn = document.getElementById('btnRecenter');
        if (recenterBtn) {
            recenterBtn.addEventListener('click', () => {
                if (this.selectedVehicleId) {
                    MapController.toggleFollow(this.selectedVehicleId);
                }
            });
        }

        // Nút đổi Lớp bản đồ (Satellite / Dark roadmap)
        const toggleLayersBtn = document.getElementById('btnToggleLayers');
        if (toggleLayersBtn) {
            toggleLayersBtn.addEventListener('click', () => {
                MapController.toggleMapType();
            });
        }
    },

    /**
     * Cập nhật trạng thái kết nối
     * @param {boolean} connected
     */
    _updateConnectionStatus(connected) {
        const statusEl = document.getElementById('connectionStatus');
        const textEl = statusEl.querySelector('.status-text');

        if (connected) {
            statusEl.classList.add('connected');
            textEl.textContent = 'GPS Service Online';
        } else {
            statusEl.classList.remove('connected');
            textEl.textContent = 'Mất kết nối';
        }
    },

    /**
     * Hiển thị toast notification
     * @param {string} message
     * @param {'success'|'error'|'info'} type
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Tự xóa sau 4 giây
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 4000);
    }
};

// ==================== KHỞI CHẠY ỨNG DỤNG ====================
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
