var windowStatus = "first";
(async() => {

  browser.browserAction.onClicked.addListener(function() {
    var mainHtml = browser.extension.getURL('content/main.html');
    browser.thunderbirdcr.toggleWindow(mainHtml, windowStatus);
    if (windowStatus !== "opened") {
      browser.menus.create({
        id: "quick-search",
        title: browser.i18n.getMessage("search_label") + ": %s",
        contexts: ["selection"]
      });
      windowStatus = "opened";
    } else {
      browser.menus.remove("quick-search");
      windowStatus = "closed";
    }
  });

  browser.menus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId == "quick-search") {
      browser.thunderbirdcr.quickSearch(info.selectionText.trim());
    }
  });
})();
