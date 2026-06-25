const nodemailer = require('nodemailer');

// 1. Cấu hình kết nối đến máy chủ SMTP của Google
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Sử dụng TLS
    auth: {
        // ĐIỀN EMAIL CỦA BẠN VÀO ĐÂY (Sẽ hiển thị là người gửi)
        user: 'kdoan4810@gmail.com', 
        
        // ĐIỀN MẬT KHẨU ỨNG DỤNG 16 CHỮ CÁI (Viết liền, không có dấu cách)
        pass: 'iwplfytadiryngtw' 
    }
});

// 2. Hàm gửi email ra External System
const sendNotification = async (toEmail, message) => {
    try {
        const mailOptions = {
            // Tên người gửi hiển thị thật chuyên nghiệp
            from: '"2Wheels Rental System" <kdoan4810@gmail.com>',
            
            // Nhận địa chỉ email mà khách hàng vừa nhập trên giao diện
            to: toEmail,
            
            subject: 'Xác nhận đặt thuê xe thành công!',
            
            // Thiết kế nội dung Email bằng HTML cho đẹp mắt
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                        Cảm ơn bạn đã đặt xe tại 2Wheels Rental
                    </h2>
                    <p style="color: #374151; font-size: 16px;">Xin chào,</p>
                    <p style="color: #374151; font-size: 16px; line-height: 1.5;">
                        ${message}
                    </p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin-top: 20px;">
                        <p style="margin: 0; color: #4b5563; font-size: 14px;">
                            <strong>Lưu ý:</strong> Vui lòng có mặt tại điểm giao xe đúng giờ.
                        </p>
                    </div>
                    <p style="font-size: 12px; color: #9ca3af; margin-top: 30px; text-align: center;">
                        Email này được gửi tự động từ hệ thống. Vui lòng không trả lời.
                    </p>
                </div>
            `
        };

        // Thực thi việc gửi mail
        const info = await transporter.sendMail(mailOptions);
        console.log('[Email Service] Đã gửi thư thành công đến:', info.accepted);
        return true;

    } catch (error) {
        console.error('[Email Service] Gặp sự cố khi gửi thư:', error);
        throw error;
    }
};

module.exports = { 
    sendNotification 
};