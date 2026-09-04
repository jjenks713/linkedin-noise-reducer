(function () {
  const DEFAULTS = {
    hidePromoted: true,
    hideAnniversaries: true,
    hidePeopleYouMayKnow: true,
    hideSuggested: true,
  };

  const HIDDEN_ATTR = 'data-lnr-hidden';
  let settings = { ...DEFAULTS };
  let observer = null;

  function findPostContainer(node) {
    let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    for (let i = 0; el && i < 25; i++, el = el.parentElement) {
      if (el.hasAttribute('data-id')) return el;
      if (el.id && el.id.includes('FeedType')) return el;
      if (el.tagName === 'LI' && el.parentElement && el.parentElement.tagName === 'UL') return el;
    }
    return null;
  }

  function hideContainer(el) {
    if (!el || el.getAttribute(HIDDEN_ATTR)) return;
    el.style.setProperty('display', 'none', 'important');
    el.setAttribute(HIDDEN_ATTR, 'true');
  }

  function processRoot(root) {
    if (!root || !root.querySelectorAll) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      const t = node.nodeValue.trim();
      if (!t) continue;
      if (settings.hidePromoted && t === 'Promoted') hideContainer(findPostContainer(node));
      if (settings.hideSuggested && /^(suggested|recommended for you|jobs recommended for you)$/i.test(t)) hideContainer(findPostContainer(node));
      if (settings.hidePeopleYouMayKnow && /^people you may know$/i.test(t)) hideContainer(findPostContainer(node));
    }

    if (settings.hideAnniversaries) {
      root.querySelectorAll('[data-id], [id*="FeedType"], li').forEach((el) => {
        if (el.getAttribute(HIDDEN_ATTR)) return;
        if (/work anniversary|is celebrating|has a new job|started a new position|new role at|promoted to|joined .+ as|job updates|[’']s job update/i.test(el.textContent.slice(0, 400))) {
          hideContainer(el);
        }
      });
    }
  }

  function unhideAll() {
    document.querySelectorAll(`[${HIDDEN_ATTR}]`).forEach((el) => {
      el.style.removeProperty('display');
      el.removeAttribute(HIDDEN_ATTR);
    });
  }

  function startObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) processRoot(node);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  chrome.storage.sync.get(DEFAULTS, (res) => {
    settings = res;
    processRoot(document.body);
    startObserver();
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'UPDATE_SETTINGS') {
      settings = msg.settings;
      unhideAll();
      processRoot(document.body);
    }
  });
})();
