const vehicleModule = require('../modules/vehicleModule');

const getAvailable = async (req, res) => {
    try {
        console.log(`[Vehicle Service] Đang lấy danh sách xe...`);
        const vehicles = await vehicleModule.getAvailableVehicles();
        
        res.status(200).json({ 
            success: true, 
            data: vehicles 
        });
    } catch (error) {
        console.error('[Vehicle Service] Lỗi:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Lỗi khi truy xuất dữ liệu xe từ hệ thống.' 
        });
    }
};

module.exports = { 
    getAvailable 
};