const processPaymentGateway = async (bookingId, amount) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ 
                transactionId: 'TXN_' + Date.now(), 
                status: 'SUCCESS',
                paidAmount: amount,
                bookingRef: bookingId
            });
        }, 1500);
    });
};

module.exports = { processPaymentGateway };