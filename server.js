const express = require('express');
const path = require('path');

// Import TOÀN BỘ Controllers
const vehicleController = require('./controllers/vehicleController');
const paymentController = require('./controllers/paymentController');
const emailController = require('./controllers/emailController');

const app = express();
const PORT = 3000;

app.use(express.json());

// --- CẤU HÌNH ĐƯỜNG DẪN TĨNH CHO GIAO DIỆN ---
// Trỏ thẳng thư mục views để tải file index.html
app.use(express.static(path.join(__dirname, 'views')));

// --- CẤU HÌNH ĐỊNH TUYẾN API CHO 3 DỊCH VỤ ---
app.get('/api/vehicle/available', vehicleController.getAvailable);
app.post('/api/payment/process', paymentController.handleProcess);
app.post('/api/email/send', emailController.handleSend);

app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`[API Gateway] Hệ thống đã khởi chạy thành công!`);
    console.log(`👉 Hãy truy cập trang chủ tại: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
});