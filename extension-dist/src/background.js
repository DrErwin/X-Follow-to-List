chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_PANEL" });
  } catch (error) {
    // The action is intentionally a no-op outside X. The content script only
    // exists on x.com/twitter.com pages, so this is expected on other tabs.
    console.debug("X Following Curator: no content script in this tab", error);
  }
});
