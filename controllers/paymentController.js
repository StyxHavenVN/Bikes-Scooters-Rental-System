const paymentModule = require('../modules/paymentModule');

const handleProcess = async (req, res) => {
    try {
        const { bookingId, amount } = req.body;

        // 1. Kiểm tra tính hợp lệ của dữ liệu gửi lên từ giao diện
        if (!bookingId || !amount) {
            return res.status(400).json({ 
                success: false, 
                error: 'Vui lòng cung cấp đầy đủ mã Booking và số tiền.' 
            });
        }

        console.log(`[Payment Service] Đang xử lý thanh toán ${amount} VND cho đơn ${bookingId}...`);

        // 2. Gọi sang tầng Module để xử lý giao dịch đồng bộ (REST Synchronous) với Payment Gateway[cite: 1]
        const result = await paymentModule.processPaymentGateway(bookingId, amount);

        // 3. Trả về kết quả thành công cho Frontend
        res.status(200).json({ 
            success: true, 
            data: result 
        });

    } catch (error) {
        console.error('[Payment Service] Lỗi khi xử lý giao dịch:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Hệ thống Payment Gateway đang gặp sự cố. Vui lòng thử lại sau.' 
        });
    }
};

module.exports = { 
    handleProcess 
};