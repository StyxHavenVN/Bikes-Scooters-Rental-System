const nodemailer = require('nodemailer');

// Thiết lập kết nối đến External Email Service (VD: Gmail SMTP)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'your_email@gmail.com', // Thay bằng email của bạn
        pass: 'your_app_password'     // Thay bằng App Password
    }
});

// Hàm thực hiện gửi email
const sendNotificationEmail = async (toEmail, messageContent) => {
    const mailOptions = {
        from: '"Hệ thống Thuê Xe" <your_email@gmail.com>',
        to: toEmail,
        subject: 'Thông báo từ hệ thống',
        html: `
            <div style="padding: 20px; border: 1px solid #ddd; font-family: Arial;">
                <h2 style="color: #007bff;">Thông báo hệ thống</h2>
                <p>${messageContent}</p>
                <hr>
                <p style="font-size: 12px; color: #888;">Email tự động từ module Email Service.</p>
            </div>
        `
    };

    // Thực thi việc gửi ra bên ngoài (External System)
    return await transporter.sendMail(mailOptions);
};

module.exports = {
    sendNotificationEmail
};