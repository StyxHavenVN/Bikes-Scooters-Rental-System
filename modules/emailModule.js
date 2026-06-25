const nodemailer = require('nodemailer');

// 1. Cấu hình External Email Service (Ví dụ dùng Gmail)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Dùng port 587 thì secure là false
    auth: {
        // LƯU Ý: Thay bằng email và App Password của bạn để test thực tế
        user: 'your_email@gmail.com', 
        pass: 'your_app_password_here' 
    }
});

// 2. Hàm xử lý nghiệp vụ tạo và gửi email
const sendNotification = async (email, message) => {
    // Đóng gói nội dung theo format HTML
    const mailOptions = {
        from: '"Hệ thống Thuê Xe" <your_email@gmail.com>',
        to: email,
        subject: 'Thông báo từ Hệ thống Thuê Xe',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 500px;">
                <h2 style="color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Thông báo hệ thống</h2>
                <p>Xin chào,</p>
                <p style="font-size: 15px; color: #333;">${message}</p>
                <br/>
                <hr style="border-top: 1px dashed #ccc;">
                <p style="font-size: 12px; color: #888;">Đây là email tự động từ Email Service. Vui lòng không trả lời.</p>
            </div>
        `
    };

    // Gọi bất đồng bộ (Async) ra External System
    return await transporter.sendMail(mailOptions);
};

module.exports = { 
    sendNotification 
};