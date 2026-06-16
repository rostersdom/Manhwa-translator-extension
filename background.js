chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    translationEnabled: true,
    autoDetect: true,
    hoverEnabled: true,
    targetLang: 'ru',
    showOriginal: true,
    showRomanization: true,
    highlightOnHover: true,
    pinOnDoubleClick: true,
    cacheEnabled: true,
    showPinyin: true
  });

  chrome.contextMenus.create({
    id: 'translate-selection',
    title: 'Перевести выделенное',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'translate-image',
    title: 'Распознать текст на картинке',
    contexts: ['image']
  });
});

// Handle keyboard shortcut from manifest
chrome.commands.onCommand.addListener((command) => {
  if (command === 'start-region') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // First capture, then send message
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
          if (chrome.runtime.lastError) {
            console.error('[MT BG] capture error:', chrome.runtime.lastError.message);
            // Still send message so content script can show error
            chrome.tabs.sendMessage(tabs[0].id, { action: 'startRegionSelect' });
            return;
          }
          // Send screenshot data along with region start message
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'startRegionSelectWithCapture',
            dataUrl: dataUrl
          });
        });
      }
    });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'translate-selection') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'translateSelection',
      text: info.selectionText
    });
  }

  if (info.menuItemId === 'translate-image') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'translateImage',
      srcUrl: info.srcUrl
    });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'captureScreen') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ dataUrl: dataUrl });
      }
    });
    return true;
  }
  return false;
});
