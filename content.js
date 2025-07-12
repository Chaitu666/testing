// content.js
// Injected into web pages to record user actions

(function() {
  let recording = false;
  let actions = [];

  function recordEvent(e) {
    if (!recording) return;
    let action = null;
    if (e.type === 'click') {
      action = {
        type: 'click',
        tag: e.target.tagName,
        selector: getUniqueSelector(e.target),
        timestamp: Date.now()
      };
    } else if (e.type === 'input') {
      action = {
        type: 'input',
        tag: e.target.tagName,
        selector: getUniqueSelector(e.target),
        value: e.target.value,
        timestamp: Date.now()
      };
    }
    if (action) actions.push(action);
  }

  function getUniqueSelector(el) {
    if (el.id) return `#${el.id}`;
    let path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
      let selector = el.nodeName.toLowerCase();
      if (el.className) selector += '.' + el.className.trim().replace(/\s+/g, '.');
      path.unshift(selector);
      el = el.parentNode;
    }
    return path.join(' > ');
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'startRecording') {
      recording = true;
      actions = [];
      window.addEventListener('click', recordEvent, true);
      window.addEventListener('input', recordEvent, true);
      sendResponse({ status: 'recording' });
    } else if (msg.type === 'stopRecording') {
      recording = false;
      window.removeEventListener('click', recordEvent, true);
      window.removeEventListener('input', recordEvent, true);
      chrome.runtime.sendMessage({ type: 'saveActions', actions });
      sendResponse({ status: 'stopped', actions });
    }
  });
})();
