const express = require('express');
const path = require('path');
const emailController = require('./controllers/emailController');

const app = express();
const PORT = 3000;

app.use(express.json());

// Phục vụ các file tĩnh trong thư mục views
app.use(express.static(path.join(__dirname, 'views')));

// Định tuyến API kết nối thẳng vào Controller
app.post('/api/send-email', emailController.handleSendEmail);

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});