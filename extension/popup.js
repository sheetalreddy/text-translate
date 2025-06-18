// Load saved percentage
chrome.storage.sync.get(['translationPercentage'], function(result) {
    const percentage = result.translationPercentage || 25;
    document.getElementById('percentage').value = percentage;
    document.getElementById('percentageDisplay').textContent = percentage + '%';
});

// Update percentage display and save to storage
document.getElementById('percentage').addEventListener('input', function() {
    const percentage = this.value;
    document.getElementById('percentageDisplay').textContent = percentage + '%';
    chrome.storage.sync.set({translationPercentage: parseInt(percentage)});
});

// Translate button
document.getElementById('translateBtn').addEventListener('click', function() {
    const percentage = document.getElementById('percentage').value;
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'translate',
            percentage: parseInt(percentage)
        }, function(response) {
            if (chrome.runtime.lastError) {
                console.error('Message error:', chrome.runtime.lastError.message);
                showStatus('Error: Content script not loaded. Try refreshing the page.', false);
                return;
            }
            showStatus(response && response.success ? 'Translation completed!' : 'Translation failed!', response && response.success);
        });
    });
});

// Reset button
document.getElementById('resetBtn').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'reset'
        }, function(response) {
            if (chrome.runtime.lastError) {
                console.error('Message error:', chrome.runtime.lastError.message);
                showStatus('Error: Content script not loaded. Try refreshing the page.', false);
                return;
            }
            showStatus(response && response.success ? 'Page reset!' : 'Reset failed!', response && response.success);
        });
    });
});

function showStatus(message, isSuccess) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = 'status ' + (isSuccess ? 'success' : 'error');
    statusEl.style.display = 'block';
    
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 2000);
}