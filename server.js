const express = require('express');
const path = require('path');

// Import các Controller xử lý API của bạn ở đây
// const vehicleController = require('./controllers/vehicleController');
// const paymentController = require('./controllers/paymentController');
const emailController = require('./controllers/emailController');

const app = express();
const PORT = 3000;

app.use(express.json());

// --- CẤU HÌNH ĐƯỜNG DẪN TĨNH CHO GIAO DIỆN CON ---
app.use('/vehicle', express.static(path.join(__dirname, 'views', 'vehicle')));
app.use('/payment', express.static(path.join(__dirname, 'views', 'payment')));
app.use('/email', express.static(path.join(__dirname, 'views', 'email')));

// --- ĐỊNH TUYẾN TRANG CHỦ CHÍNH (TRANG TỔNG) ---
app.get('/', (req, res) => {
    // Khi người dùng vào http://localhost:3000/ -> Trả về file index.html chính kết nối 3 dịch vụ
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// --- CẤU HÌNH ĐỊNH TUYẾN API CHUYỂN ĐẾN CONTROLLERS ---
// app.get('/api/vehicle/available', vehicleController.getAvailable);
// app.post('/api/payment/process', paymentController.handleProcess);
app.post('/api/email/send', emailController.handleSend);

app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`[API Gateway] Hệ thống đã khởi chạy thành công!`);
    console.log(`👉 Hãy truy cập trang chủ tại: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
});