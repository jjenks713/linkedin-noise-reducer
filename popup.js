const KEYS = ['hidePromoted', 'hideAnniversaries', 'hidePeopleYouMayKnow', 'hideSuggested'];
const DEFAULTS = { hidePromoted: true, hideAnniversaries: true, hidePeopleYouMayKnow: true, hideSuggested: true };

const toggles = {};
KEYS.forEach((k) => (toggles[k] = document.getElementById(k)));

chrome.storage.sync.get(DEFAULTS, (res) => {
  KEYS.forEach((k) => (toggles[k].checked = res[k]));
});

async function onChange() {
  const settings = {};
  KEYS.forEach((k) => (settings[k] = toggles[k].checked));
  await chrome.storage.sync.set(settings);

  const tabs = await chrome.tabs.query({ url: 'https://www.linkedin.com/*' });
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_SETTINGS', settings }, () => {
      void chrome.runtime.lastError;
    });
  }
}

KEYS.forEach((k) => toggles[k].addEventListener('change', onChange));
