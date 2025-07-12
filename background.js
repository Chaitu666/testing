// background.js
// Handles communication between popup and content scripts, manages storage and config

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "saveActions") {
    chrome.storage.local.set({ actions: message.actions });
    sendResponse({ status: "ok" });
  } else if (message.type === "getActions") {
    chrome.storage.local.get(["actions"], (result) => {
      sendResponse({ actions: result.actions || [] });
    });
    return true;
  } else if (message.type === "saveConfig") {
    chrome.storage.local.set({ config: message.config });
    sendResponse({ status: "ok" });
  } else if (message.type === "getConfig") {
    chrome.storage.local.get(["config"], (result) => {
      sendResponse({ config: result.config || null });
    });
    return true;
  }
});
