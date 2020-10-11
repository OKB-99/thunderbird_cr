console.log("loaded implementation.js");

// Import some things we need.
var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { ExtensionSupport } = ChromeUtils.import("resource:///modules/ExtensionSupport.jsm");
var { Preferences } = ChromeUtils.import("resource://gre/modules/Preferences.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

var sidebarWindow;

var thunderbirdcr = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    context.callOnClose(this);
    return {
      thunderbirdcr: {
        toggleWindow(mainHtml, windowStatus) {
          console.log(`Called toggleWindow(${mainHtml}, ${windowStatus})`);
          // Listen for the main Thunderbird windows opening.
          if (windowStatus !== "opened") {
            if (windowStatus === "closed")
              ExtensionSupport.unregisterWindowListener("closeTBCRListener");
            ExtensionSupport.registerWindowListener("openTBCRListener", {
              // Before Thunderbird 74, messenger.xhtml was messenger.xul.
              chromeURLs: [
                "chrome://messenger/content/messenger.xhtml",
                "chrome://messenger/content/messenger.xul",
              ],
              onLoadWindow(window) {
                let xul = window.MozXULElement.parseXULToFragment(`
                    <splitter
                      id="thunderbirdcr-splitter"
                      collapse="after"
                      orient="horizontal"
                      persist="state hidden"
                    />
                    <vbox
                      id="thunderbirdcrPane"
                      width="400"
                      minwidth="350"
                      persist="width height hidden"
                    >
                    <browser src="${mainHtml}" id="thunderbirdcr-main" flex="1" disablesecurity="true"/>
                    </vbox>
                `);
                window.document.getElementById("messengerBox").appendChild(xul);
                sidebarWindow = window.document.getElementById("thunderbirdcr-main").contentWindow;
              },
            });
          } else {
            ExtensionSupport.unregisterWindowListener("openTBCRListener");
            ExtensionSupport.registerWindowListener("closeTBCRListener", {
              chromeURLs: [
                "chrome://messenger/content/messenger.xhtml",
                "chrome://messenger/content/messenger.xul",
              ],
              onLoadWindow(window) {
                let splitter = window.document.getElementById("thunderbirdcr-splitter");
                splitter.parentNode.removeChild(splitter);
                let sidebar = window.document.getElementById("thunderbirdcrPane");
                sidebar.parentNode.removeChild(sidebar);
              }
            });
          }
        },

        quickSearch(sourceText) {
          console.log(`called quickSearch(${sourceText})`);
          sidebarWindow.postMessage(JSON.stringify({sourceText: sourceText}), "*");
        }
      },
    };
  }

  close() {
    // Clean up any existing windows that have the menu item.
    /**
    for (let window of Services.wm.getEnumerator("mail:3pane")) {
      let fileRestartItem = window.document.getElementById("menu_FileRestartItem");
      if (fileRestartItem) {
        fileRestartItem.remove();
      }
    }
    **/
    // Stop listening for new windows.
    ExtensionSupport.unregisterWindowListener("restartListener");
  }
};