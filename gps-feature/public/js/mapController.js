/**
 * VIEW MODULE - Map Controller (Client-side Tracking Controller)
 * ================================================================
 * Theo Module View: Controller Module → Tracking Controller (client-side)
 * Theo Module View: External Services → GPS / Maps API (Google Maps API)
 * 
 * Quản lý bản đồ Google Maps, markers xe, polyline lịch sử di chuyển.
 * Tích hợp với External GPS/Maps API: Google Maps JavaScript API.
 * Cải tiến đối chiếu trải nghiệm với ứng dụng Google Maps di động trên Android & iOS.
 */

const MapController = {
    /** @type {google.maps.Map|null} Google Maps instance */
    map: null,

    /** @type {Map<string, google.maps.marker.AdvancedMarkerElement>} vehicleId → Google Advanced Marker */
    markers: new Map(),

    /** @type {google.maps.Polyline|null} Đường lịch sử di chuyển */
    historyPath: null,

    /** @type {google.maps.Polyline|null} Đường viền lịch sử di chuyển (tạo hiệu ứng 3D) */
    historyPathOutline: null,

    /** @type {Object[]} Danh sách markers trong lịch sử di chuyển */
    historyMarkers: [],

    /** @type {string|null} ID xe đang được theo dõi (follow) */
    followingVehicle: null,

    /** @type {google.maps.InfoWindow|null} Hộp thoại hiển thị thông tin xe */
    infoWindow: null,

    /** @type {Object} Cấu hình ban đầu */
    config: {
        // Trung tâm TP.HCM
        center: { lat: 10.7769, lng: 106.7009 },
        zoom: 13,
        minZoom: 10,
        maxZoom: 18
    },

    /**
     * Khởi tạo bản đồ Google Maps với Dark Style và các listeners tương tác
     */
    initialize() {
        const darkStyle = [
            { elementType: 'geometry', stylers: [{ color: '#161822' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#161822' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#9ca0b4' }] },
            {
                featureType: 'administrative.locality',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#e4e6ef' }]
            },
            {
                featureType: 'poi',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#9ca0b4' }]
            },
            {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{ color: '#0f1117' }]
            },
            {
                featureType: 'poi.park',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#6b6f85' }]
            },
            {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{ color: '#1e2030' }]
            },
            {
                featureType: 'road',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#2b2d42' }]
            },
            {
                featureType: 'road',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#9ca0b4' }]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry',
                stylers: [{ color: '#262835' }]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#323548' }]
            },
            {
                featureType: 'road.highway',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#e4e6ef' }]
            },
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#0f1117' }]
            },
            {
                featureType: 'water',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#6b6f85' }]
            }
        ];

        const mapEl = document.getElementById('map');
        if (!mapEl) {
            console.error('[Map Controller] Không tìm thấy phần tử DOM #map');
            return;
        }

        // Khởi tạo Map
        this.map = new google.maps.Map(mapEl, {
            center: this.config.center,
            zoom: this.config.zoom,
            minZoom: this.config.minZoom,
            maxZoom: this.config.maxZoom,
            styles: darkStyle,
            mapId: 'DEMO_MAP_ID',
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
        });

        // Khởi tạo InfoWindow
        this.infoWindow = new google.maps.InfoWindow();

        // ĐỐI CHIẾU GOOGLE MAP MOBILE: Khi người dùng kéo map, tạm ngắt chế độ tự động follow
        this.map.addListener('dragstart', () => {
            if (this.followingVehicle) {
                console.log('[Map Controller] 🗺️ Phát hiện vuốt bản đồ. Tạm dừng chế độ Theo dõi.');
                this.followingVehicle = null;
                this._updateFollowButtonUI(false);
                this._showRecenterButton(true);
            }
        });

        console.log('[Map Controller] 🗺️ Khởi tạo Google Maps thành công (Hỗ trợ tự động căn góc và cử chỉ di động)');
    },

    /**
     * Thêm hoặc cập nhật marker xe trên bản đồ
     * Xoay hướng xe theo heading gửi về
     * @param {Object} vehicle 
     * @param {Object} location 
     */
    updateVehicleMarker(vehicle, location) {
        if (!location || !location.latitude || !location.longitude) return;

        const latlng = { lat: location.latitude, lng: location.longitude };
        const vehicleType = vehicle.type || 'scooter';
        const icon = vehicleType === 'bike' ? '🚲' : '🛵';
        
        // ĐỐI CHIẾU GOOGLE MAP MOBILE: Xoay marker theo hướng di chuyển của xe (heading)
        // Emojis mặc định quay về bên trái (270 độ), bù hướng +90 độ để góc 0 là chỉ lên trên
        const heading = location.heading !== undefined ? location.heading : 0;
        const rotateDeg = (heading + 90) % 360;

        if (this.markers.has(vehicle.id)) {
            const marker = this.markers.get(vehicle.id);
            this._animateMarker(marker, latlng);
            
            // Cập nhật góc quay hiện tại và dữ liệu đính kèm
            marker.vehicleData = vehicle;
            marker.locationData = location;
            marker.currentRotation = rotateDeg;
            
            // Áp dụng xoay marker có tính đến việc scale nếu xe đang được chọn
            const pinEl = marker.element ? marker.element.querySelector('.marker-pin') : null;
            if (pinEl) {
                const isSelected = (typeof App !== 'undefined' && App.selectedVehicleId === vehicle.id);
                pinEl.style.transform = `rotate(${rotateDeg}deg) ${isSelected ? 'scale(1.25)' : 'scale(1)'}`;
            }

            // Cập nhật InfoWindow nếu đang mở
            if (this.infoWindow && this.infoWindow.getMap() && typeof App !== 'undefined' && App.selectedVehicleId === vehicle.id) {
                this.infoWindow.setContent(this._createPopupContent(vehicle, location));
            }
        } else {
            // Tạo HTML pin với góc quay ban đầu
            const markerElement = document.createElement('div');
            markerElement.className = 'custom-marker';
            markerElement.innerHTML = `
                <div class="marker-pulse ${vehicleType}"></div>
                <div class="marker-pin ${vehicleType}" style="transform: rotate(${rotateDeg}deg)">${icon}</div>
            `;

            const marker = new google.maps.marker.AdvancedMarkerElement({
                map: this.map,
                position: latlng,
                content: markerElement,
                title: vehicle.name
            });

            marker.vehicleData = vehicle;
            marker.locationData = location;
            marker.currentRotation = rotateDeg;

            marker.addListener('click', () => {
                this.infoWindow.setContent(this._createPopupContent(marker.vehicleData, marker.locationData));
                this.infoWindow.open(this.map, marker);
                
                if (typeof App !== 'undefined' && App.showVehicleInfo) {
                    App.showVehicleInfo(vehicle.id);
                }
            });

            this.markers.set(vehicle.id, marker);
        }

        // Cập nhật vị trí bản đồ nếu đang ở chế độ follow xe
        if (this.followingVehicle === vehicle.id) {
            this.map.panTo(latlng);
        }
    },

    /**
     * Animate marker di chuyển mượt bằng LERP
     */
    _animateMarker(marker, newLatLng) {
        const oldPos = marker.position;
        const oldLat = typeof oldPos.lat === 'function' ? oldPos.lat() : oldPos.lat;
        const oldLng = typeof oldPos.lng === 'function' ? oldPos.lng() : oldPos.lng;
        
        const steps = 15;
        let step = 0;

        const deltaLat = (newLatLng.lat - oldLat) / steps;
        const deltaLng = (newLatLng.lng - oldLng) / steps;

        const animate = () => {
            step++;
            const lat = oldLat + deltaLat * step;
            const lng = oldLng + deltaLng * step;
            marker.position = { lat, lng };

            if (step < steps) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },

    /**
     * Tạo nội dung InfoWindow
     */
    _createPopupContent(vehicle, location) {
        const icon = vehicle.type === 'bike' ? '🚲' : '🛵';
        const speed = location.speed ? `${location.speed} km/h` : '0 km/h';

        return `
            <div class="popup-content">
                <h4>${icon} ${vehicle.name}</h4>
                <p><strong>Biển số:</strong> ${vehicle.licensePlate}</p>
                <p><strong>Người thuê:</strong> ${vehicle.renter || '—'}</p>
                <p><strong>Tọa độ:</strong> ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}</p>
                <span class="speed-tag">⚡ ${speed}</span>
            </div>
        `;
    },

    /**
     * Vẽ đường lịch sử di chuyển
     * ĐỐI CHIẾU GOOGLE MAP MOBILE: Vẽ 2 lớp polyline (outline 3D) và định vị chấm xanh pulsing blue dot
     */
    drawHistoryPath(locations, vehicleType) {
        this.clearHistory();

        if (!locations || locations.length < 2) return;

        const latlngs = locations.map(loc => ({ lat: loc.latitude, lng: loc.longitude }));
        const color = vehicleType === 'bike' ? '#00cec9' : '#a29bfe';

        // 1. Vẽ đường viền dưới (Outline) tạo bóng đổ 3D
        this.historyPathOutline = new google.maps.Polyline({
            path: latlngs,
            geodesic: true,
            strokeColor: '#0f1117',
            strokeOpacity: 0.8,
            strokeWeight: 8,
            map: this.map
        });

        // 2. Vẽ đường chính (Google Maps Blue)
        this.historyPath = new google.maps.Polyline({
            path: latlngs,
            geodesic: true,
            strokeColor: '#1a73e8', // Xanh dương đặc trưng dẫn đường của Google Maps
            strokeOpacity: 1.0,
            strokeWeight: 4,
            map: this.map
        });

        // Điểm bắt đầu (Google Maps Green Pin)
        const startMarker = new google.maps.Marker({
            position: latlngs[0],
            map: this.map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#34a853', // Xanh lục Google
                fillOpacity: 1.0,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 6
            },
            title: 'Điểm bắt đầu'
        });
        
        const startInfoWindow = new google.maps.InfoWindow({
            content: '<div class="popup-content" style="color: var(--text-primary)">📍 Điểm bắt đầu hành trình</div>'
        });
        startMarker.addListener('click', () => {
            startInfoWindow.open(this.map, startMarker);
        });
        this.historyMarkers.push(startMarker);

        // Điểm kết thúc - ĐỐI CHIẾU GOOGLE MAP MOBILE: Pulse Blue Dot định vị GPS
        const blueDotElement = document.createElement('div');
        blueDotElement.className = 'gmap-blue-dot-container';
        blueDotElement.innerHTML = `
            <div class="gmap-blue-dot-pulse"></div>
            <div class="gmap-blue-dot"></div>
        `;
        
        const endMarker = new google.maps.marker.AdvancedMarkerElement({
            map: this.map,
            position: latlngs[latlngs.length - 1],
            content: blueDotElement,
            title: 'Vị trí hiện tại'
        });
        
        const endInfoWindow = new google.maps.InfoWindow({
            content: '<div class="popup-content" style="color: var(--text-primary)">🏁 Vị trí xe hiện tại</div>'
        });
        endMarker.addListener('click', () => {
            endInfoWindow.open(this.map, endMarker);
        });
        this.historyMarkers.push(endMarker);

        // Các mốc trung gian
        const step = Math.max(1, Math.floor(locations.length / 6));
        for (let i = step; i < locations.length - 1; i += step) {
            const midMarker = new google.maps.Marker({
                position: latlngs[i],
                map: this.map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: '#4285F4',
                    fillOpacity: 0.6,
                    strokeColor: '#ffffff',
                    strokeWeight: 1,
                    scale: 3
                }
            });
            this.historyMarkers.push(midMarker);
        }

        // Fit bounds
        const bounds = new google.maps.LatLngBounds();
        latlngs.forEach(latlng => bounds.extend(latlng));
        this.map.fitBounds(bounds);
    },

    /**
     * Xóa đường lịch sử di chuyển
     */
    clearHistory() {
        if (this.historyPathOutline) {
            this.historyPathOutline.setMap(null);
            this.historyPathOutline = null;
        }
        if (this.historyPath) {
            this.historyPath.setMap(null);
            this.historyPath = null;
        }
        if (this.historyMarkers && this.historyMarkers.length > 0) {
            this.historyMarkers.forEach(marker => marker.setMap(null));
            this.historyMarkers = [];
        }
    },

    /**
     * Hiển thị toàn bộ markers xe
     */
    fitAllMarkers() {
        if (this.markers.size === 0) return;

        const bounds = new google.maps.LatLngBounds();
        this.markers.forEach(marker => {
            bounds.extend(marker.position);
        });

        this.map.fitBounds(bounds);
    },

    /**
     * Focus xe
     */
    focusVehicle(vehicleId) {
        const marker = this.markers.get(vehicleId);
        if (marker) {
            this.map.panTo(marker.position);
            this.map.setZoom(16);
            
            if (marker.vehicleData && marker.locationData) {
                this.infoWindow.setContent(this._createPopupContent(marker.vehicleData, marker.locationData));
                this.infoWindow.open(this.map, marker);
            }
        }
    },

    /**
     * Bật/tắt follow
     */
    toggleFollow(vehicleId) {
        if (this.followingVehicle === vehicleId) {
            this.followingVehicle = null;
            this._updateFollowButtonUI(false);
            this._showRecenterButton(true);
            return false;
        } else {
            this.followingVehicle = vehicleId;
            this.focusVehicle(vehicleId);
            this._updateFollowButtonUI(true);
            this._showRecenterButton(false);
            return true;
        }
    },

    /**
     * ĐỐI CHIẾU GOOGLE MAP MOBILE: Hiển thị / ẩn nút Recenter nổi trên Map
     */
    _showRecenterButton(show) {
        const btn = document.getElementById('btnRecenter');
        if (btn) {
            btn.classList.toggle('hidden', !show);
        }
    },

    /**
     * Đồng bộ nút Theo dõi ở sidebar
     */
    _updateFollowButtonUI(isFollowing) {
        const btn = document.getElementById('btnCenterVehicle');
        if (btn) {
            btn.innerHTML = isFollowing 
                ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                   </svg> Đang theo dõi...`
                : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                   </svg> Theo dõi`;
            btn.classList.toggle('btn-primary', isFollowing);
            btn.classList.toggle('btn-outline', !isFollowing);
        }
    },

    /**
     * ĐỐI CHIẾU GOOGLE MAP MOBILE: Đổi lớp bản đồ (Roadmap với Dark style <=> Satellite)
     */
    toggleMapType() {
        if (!this.map) return;
        const currentType = this.map.getMapTypeId();
        const btn = document.getElementById('btnToggleLayers');
        
        if (currentType === google.maps.MapTypeId.ROADMAP) {
            this.map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
            if (btn) {
                btn.title = "Chuyển sang bản đồ Tối";
                btn.classList.add('active');
            }
            console.log('[Map Controller] 🗺️ Đã chuyển sang bản đồ vệ tinh.');
        } else {
            this.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
            if (btn) {
                btn.title = "Chuyển sang bản đồ Vệ tinh";
                btn.classList.remove('active');
            }
            console.log('[Map Controller] 🗺️ Đã chuyển sang bản đồ Vector tối.');
        }
    },

    /**
     * Highlight marker
     */
    highlightMarker(vehicleId) {
        this.markers.forEach((marker, id) => {
            const el = marker.element;
            if (el) {
                el.style.zIndex = id === vehicleId ? '1000' : '100';
                const pinEl = el.querySelector('.marker-pin');
                if (pinEl) {
                    const rotation = marker.currentRotation || 0;
                    const scale = id === vehicleId ? 'scale(1.25)' : 'scale(1)';
                    pinEl.style.transform = `rotate(${rotation}deg) ${scale}`;
                    pinEl.style.transition = 'transform 0.3s ease';
                }
            }
        });
    }
};
