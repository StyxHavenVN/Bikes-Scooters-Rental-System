const emailModule = require('../modules/emailModule');

const handleSendEmail = async (req, res) => {
    const { email, message } = req.body;

    // 1. Kiểm tra dữ liệu từ Views gửi lên
    if (!email || !message) {
        return res.status(400).json({ error: 'Vui lòng nhập đủ email và nội dung.' });
    }

    try {
        // 2. Gọi Module để thực hiện gửi email
        await emailModule.sendNotificationEmail(email, message);
        
        // 3. Trả kết quả về cho Views
        res.status(200).json({ success: true, message: 'Gửi email thành công!' });
    } catch (error) {
        console.error('Lỗi tại module email:', error);
        res.status(500).json({ success: false, error: 'Hệ thống email bên ngoài đang gặp sự cố.' });
    }
};

module.exports = {
    handleSendEmail
};