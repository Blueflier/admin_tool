// Initialize popup
document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('saveLayout');
  const resetButton = document.getElementById('resetLayout');
  const statusElement = document.getElementById('status');

  // Save button click handler
  saveButton.addEventListener('click', function() {
    // Send message to content script to save current layout
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "saveLayout"}, function(response) {
        if (response && response.success) {
          // Show success message
          statusElement.textContent = "Layout saved successfully!";
          statusElement.style.color = "#4CAF50";
          
          // Reset after 3 seconds
          setTimeout(() => {
            statusElement.textContent = "";
          }, 3000);
        } else {
          // Show error message
          statusElement.textContent = "Error saving layout. Please try again.";
          statusElement.style.color = "#F44336";
        }
      });
    });
  });

  // Reset button click handler
  resetButton.addEventListener('click', function() {
    if (confirm('Reset column layout to default? This will reload the page.')) {
      // Send message to content script to reset layout
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "resetLayout"}, function(response) {
          // This may not get called if page reloads immediately
          if (response && response.success) {
            statusElement.textContent = "Layout reset successfully!";
            statusElement.style.color = "#4CAF50";
          }
        });
      });
    }
  });

  // Check if we're on a valid page for the extension
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "checkPage"}, function(response) {
      if (chrome.runtime.lastError) {
        // Content script not available (wrong page)
        document.body.innerHTML = '<div style="padding: 20px; text-align: center;">' +
          '<p style="color: #666;">This extension only works on the Biola registration page.</p>' +
          '<p style="font-size: 12px; margin-top: 15px; color: #999;">Visit the class search page to use this extension.</p>' +
          '</div>';
      }
    });
  });
}); 