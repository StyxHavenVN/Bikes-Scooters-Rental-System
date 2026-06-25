// Mô phỏng Database chứa danh sách xe
const getAvailableVehicles = async () => {
    return [
        { id: 'S01', name: 'VinFast Feliz S (Scooter)', price: 1200000 },
        { id: 'B01', name: 'Giant ATX 830 (Bicycle)', price: 450000 },
        { id: 'S02', name: 'Honda Vision 2024 (Scooter)', price: 1500000 }
    ];
};

module.exports = { 
    getAvailableVehicles 
};