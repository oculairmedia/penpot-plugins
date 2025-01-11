declare const penpot: any;

export function initializePlugin() {
  try {
    console.log("Template API Plugin: Starting initialization...");

    if (typeof penpot === 'undefined') {
      throw new Error('This plugin must be run within the Penpot environment');
    }

    penpot.ui.open("Template API Plugin", `?theme=${penpot.theme}`, {
      width: 400,
      height: 600,
    });

    setTimeout(() => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('penpot_plugin_test', 'test');
          localStorage.removeItem('penpot_plugin_test');
          console.log("Template API Plugin: Storage check passed");
        }

        if (!penpot.library?.local) {
          throw new Error('Library API not available');
        }

        console.log("Template API Plugin: Library check", {
          libraryAvailable: !!penpot.library,
          localLibraryAvailable: !!penpot.library.local,
          componentsAvailable: !!penpot.library.local.components,
          componentsCount: penpot.library.local.components?.length || 0
        });

      } catch (e) {
        console.warn("Template API Plugin: Initialization checks failed, some features may be limited", e);
      }
    }, 1000);

    console.log("Template API Plugin: Initialization complete");
  } catch (error) {
    console.error("Failed to initialize plugin:", error);
  }
}