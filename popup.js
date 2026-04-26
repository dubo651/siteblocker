// popup.js - Logic for the extension management interface

document.addEventListener('DOMContentLoaded', () => {
  const masterToggle = document.getElementById('master-toggle');
  const siteInput = document.getElementById('new-site-input');
  const addBtn = document.getElementById('add-site-btn');
  const siteListContainer = document.getElementById('site-list');
  const limitWarning = document.getElementById('limit-warning');

  let blockedSites = [];
  let extensionEnabled = true;

  // Load state from storage
  chrome.storage.sync.get(['blockedSites', 'extensionEnabled'], (data) => {
    blockedSites = data.blockedSites || [];
    extensionEnabled = data.extensionEnabled !== false;
    
    masterToggle.checked = extensionEnabled;
    renderSiteList();
    checkLimit();
  });

  // Handle master toggle
  masterToggle.addEventListener('change', () => {
    extensionEnabled = masterToggle.checked;
    chrome.storage.sync.set({ extensionEnabled });
  });

  // Handle adding a new site
  addBtn.addEventListener('click', () => {
    const domain = siteInput.value.trim().toLowerCase();
    if (domain && !blockedSites.some(s => s.domain === domain)) {
      blockedSites.push({ domain, enabled: true });
      siteInput.value = '';
      saveAndRender();
    }
  });

  // Also add on Enter key
  siteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addBtn.click();
  });

  function saveAndRender() {
    chrome.storage.sync.set({ blockedSites }, () => {
      renderSiteList();
      checkLimit();
    });
  }

  function renderSiteList() {
    siteListContainer.innerHTML = '';
    blockedSites.forEach((site, index) => {
      const siteItem = document.createElement('div');
      siteItem.className = 'site-item';
      
      siteItem.innerHTML = `
        <div class="site-info">
          <label class="switch">
            <input type="checkbox" class="site-toggle" data-index="${index}" ${site.enabled ? 'checked' : ''}>
            <span class="slider round"></span>
          </label>
          <span class="site-domain" title="${site.domain}">${site.domain}</span>
        </div>
        <button class="delete-btn" data-index="${index}">&times;</button>
      `;
      
      siteListContainer.appendChild(siteItem);
    });

    // Add event listeners to toggles and delete buttons
    document.querySelectorAll('.site-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const index = e.target.getAttribute('data-index');
        blockedSites[index].enabled = e.target.checked;
        saveAndRender();
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = e.target.getAttribute('data-index');
        blockedSites.splice(index, 1);
        saveAndRender();
      });
    });
  }

  function checkLimit() {
    const activeCount = blockedSites.filter(s => s.enabled).length;
    // Google limit is ~32 words. Each -site: counts as a word.
    // We show warning if we approach 30 to be safe.
    if (activeCount >= 30) {
      limitWarning.classList.remove('hidden');
    } else {
      limitWarning.classList.add('hidden');
    }
  }
});
