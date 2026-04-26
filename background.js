// Background service worker for Google Search Site Blocker

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // Only process top-level frames
  if (details.frameId !== 0) return;

  const url = new URL(details.url);
  
  // Check if it's a Google search result page
  if (url.hostname.includes("google.com") && url.pathname === "/search") {
    const query = url.searchParams.get("q");
    if (!query) return;

    chrome.storage.sync.get(["extensionEnabled", "blockedSites"], (data) => {
      const isEnabled = data.extensionEnabled !== false; // Default to true
      const blockedSites = data.blockedSites || [];
      
      if (!isEnabled) return;

      const activeBlocks = blockedSites
        .filter(site => site.enabled)
        .map(site => site.domain);

      if (activeBlocks.length === 0) return;

      // Construct the exclusion string
      const exclusions = activeBlocks.map(domain => `-site:${domain}`).join(" ");
      
      // Check if the query already contains all active exclusions
      // We check for the presence of each exclusion to be safe
      const missingExclusions = activeBlocks.filter(domain => !query.includes(`-site:${domain}`));

      if (missingExclusions.length > 0) {
        // Append missing exclusions to the query
        const newQuery = `${query} ${missingExclusions.map(d => `-site:${d}`).join(" ")}`.trim();
        url.searchParams.set("q", newQuery);
        
        // Redirect the tab
        chrome.tabs.update(details.tabId, { url: url.toString() });
      }
    });
  }
});
