const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware (Mô phỏng một phần chức năng của API Gateway xử lý protocol)
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * MÔ PHỎNG: External Email Service Configuration
 * Trong thực tế, thông tin này trỏ về SMTP của SendGrid, Mailgun, AWS SES,...
 */
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // External SMTP Server
    port: 587,
    secure: false, 
    auth: {
        user: 'your_system_email@gmail.com', // Cấu hình email hệ thống của bạn
        pass: 'your_app_password_here'       // Mật khẩu ứng dụng (App Password)
    }
});

/**
 * MÔ PHỎNG: Notification Service Endpoint
 * Xử lý việc nhận yêu cầu từ hệ thống và gửi email thông báo.
 */
app.post('/api/notifications/send-email', async (req, res) => {
    const { email, message } = req.body;

    if (!email || !message) {
        return res.status(400).json({ error: 'Vui lòng cung cấp đủ email và nội dung.' });
    }

    // Cấu hình nội dung email gửi đi
    const mailOptions = {
        from: '"Hệ thống Thuê Xe" <your_system_email@gmail.com>',
        to: email,
        subject: 'Thông báo từ hệ thống',
        text: message,
        html: `<div style="font-family: Arial; padding: 20px; border: 1px solid #ddd;">
                <h2 style="color: #007bff;">Thông báo hệ thống</h2>
                <p>Xin chào,</p>
                <p>${message}</p>
                <hr>
                <p style="font-size: 12px; color: #888;">Đây là email tự động từ Notification Service.</p>
               </div>`
    };

    try {
        // Giao tiếp bất đồng bộ (Async) với External Email Service qua SMTP 
        let info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        
        // Trả về kết quả cho Booking/Payment/Gateway
        res.status(200).json({ message: 'Email đã được gửi thành công đến External Service!' });
    } catch (error) {
        console.error('Lỗi khi gọi External Email Service:', error);
        res.status(500).json({ error: 'Không thể gửi email. External Service có thể đang gặp sự cố.' });
    }
});

// Khởi chạy server
app.listen(PORT, () => {
    console.log(`Hệ thống đang chạy tại http://localhost:${PORT}`);
    console.log(`Sẵn sàng nhận request tại API Gateway mô phỏng...`);
});