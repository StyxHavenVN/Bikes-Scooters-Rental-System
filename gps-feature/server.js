/**
 * SERVER - API Gateway + GPS Tracking Service
 * ==============================================
 * Theo C&C View:
 *   - API Gateway: Request routing, Authentication, Rate limiting, Protocol handling
 *   - GPS Tracking Service: Receive GPS data, Store location, Real-time tracking, Location history
 * 
 * Luồng: Client (Web Browser / Mobile App) → HTTPS/REST → API Gateway → REST → GPS Tracking Service
 * Luồng GPS: GPS Devices → MQTT/HTTPS Async → GPS Tracking Service
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const GPSRepository = require('./repositories/gpsRepository');
const trackingController = require('./controllers/trackingController');

const app = express();
const PORT = 3001; // Khác port 3000 của email-feature để tránh xung đột

// ==================== API GATEWAY MIDDLEWARE ====================
// Mô phỏng các chức năng của API Gateway theo C&C View

// 1. Protocol handling - Parse JSON body
app.use(bodyParser.json());

// 2. CORS handling (cho phép cross-origin từ client)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// 3. Request logging (mô phỏng Logging & Auditing - Cross-cutting Module)
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[API Gateway] ${timestamp} | ${req.method} ${req.url}`);
    next();
});

// 4. Rate limiting đơn giản (mô phỏng) - chỉ áp dụng cho API routes
const requestCounts = new Map();
app.use('/api', (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 60000; // 1 phút
    const maxRequests = 500; // Tăng lên cho GPS simulator (5 xe × mỗi 3s = ~100 req/min)

    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, []);
    }

    const requests = requestCounts.get(ip).filter(time => now - time < windowMs);
    requests.push(now);
    requestCounts.set(ip, requests);

    if (requests.length > maxRequests) {
        return res.status(429).json({ error: 'Quá nhiều request. Vui lòng thử lại sau.' });
    }
    next();
});

// ==================== STATIC FILES (VIEW MODULE) ====================
// Serve View Module (Presentation Layer)
app.use(express.static(path.join(__dirname, 'public')));

// Root route redirects to tracking_gps.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tracking_gps.html'));
});

// ==================== KHỞI TẠO INFRASTRUCTURE ====================
// Tạo GPS Repository instance (Infrastructure Module)
const gpsRepo = new GPSRepository();

// Khởi chạy GPS Simulator Service (External System - GPS Devices) ngầm phía server
const GPSSimulatorService = require('./services/gpsSimulatorService');
const gpsSimulator = new GPSSimulatorService(gpsRepo);
gpsSimulator.start();

// ==================== ROUTE TO GPS TRACKING SERVICE ====================
// Mô phỏng API Gateway routing requests đến GPS Tracking Service
app.use('/api/gps', trackingController(gpsRepo));

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
    res.json({
        service: 'GPS Tracking Service',
        status: 'running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        architecture: {
            pattern: 'Microservices (mô phỏng)',
            gateway: 'API Gateway',
            service: 'GPS Tracking Service',
            protocol: 'REST / MQTT-HTTPS Async'
        }
    });
});

// ==================== ERROR HANDLING ====================
// Mô phỏng Error Handling (Cross-cutting Module)
app.use((err, req, res, next) => {
    console.error(`[API Gateway] Error: ${err.message}`);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.url} không tồn tại`
    });
});

// ==================== KHỞI CHẠY SERVER ====================
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('  BIKES & SCOOTERS RENTAL SYSTEM');
    console.log('  GPS Tracking Feature');
    console.log('='.repeat(60));
    console.log(`  🌐 Web UI:        http://localhost:${PORT}`);
    console.log(`  🔌 API Gateway:   http://localhost:${PORT}/api/gps`);
    console.log(`  ❤️  Health Check:  http://localhost:${PORT}/api/health`);
    console.log('='.repeat(60));
    console.log('');
    console.log('  Kiến trúc (theo C&C View):');
    console.log('  Client → HTTPS/REST → API Gateway → REST → GPS Tracking Service');
    console.log('  GPS Devices → MQTT/HTTPS Async → GPS Tracking Service');
    console.log('');
    console.log('  Đang lắng nghe request...');
    console.log('');
});
