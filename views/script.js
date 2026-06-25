document.getElementById('emailForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    const statusDiv = document.getElementById('statusMessage');
    const sendBtn = document.getElementById('sendBtn');

    // Reset status
    statusDiv.className = 'status';
    statusDiv.textContent = 'Đang xử lý gửi email...';
    sendBtn.disabled = true;

    try {
        // Gửi REST request (tương đương đi qua API Gateway vào Notification Service)
        const response = await fetch('/api/notifications/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, message })
        });

        const result = await response.json();

        if (response.ok) {
            statusDiv.textContent = 'Thành công: ' + result.message;
            statusDiv.classList.add('success');
            document.getElementById('emailForm').reset();
        } else {
            statusDiv.textContent = 'Lỗi: ' + result.error;
            statusDiv.classList.add('error');
        }
    } catch (error) {
        statusDiv.textContent = 'Lỗi kết nối máy chủ.';
        statusDiv.classList.add('error');
    } finally {
        sendBtn.disabled = false;
    }
});