const emailModule = require('../modules/emailModule');

const handleSend = async (req, res) => {
    try {
        const { email, message } = req.body;

        // 1. Validate dữ liệu đầu vào từ View
        if (!email || !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Vui lòng cung cấp đầy đủ email và nội dung thông báo.' 
            });
        }

        console.log(`[Email Service] Đang yêu cầu gửi mail tới: ${email}...`);

        // 2. Gọi Module để thực thi tác vụ gửi email ra ngoài
        await emailModule.sendNotification(email, message);

        // 3. Trả về Response thành công cho View
        res.status(200).json({ 
            success: true, 
            message: 'Đã gửi email thành công qua External Service!' 
        });

    } catch (error) {
        console.error('[Email Service] Lỗi khi gửi mail:', error);
        // Trả về lỗi nếu External Service từ chối hoặc sai cấu hình
        res.status(500).json({ 
            success: false, 
            error: 'External Email Service đang gặp sự cố hoặc sai thông tin xác thực.' 
        });
    }
};

module.exports = { 
    handleSend 
};