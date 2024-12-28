// Template API Plugin
// This plugin provides an API for modifying and exporting Penpot templates

interface TemplateModification {
  elementId: string;
  properties: Record<string, any>;
}

interface ExportOptions {
  format: 'png' | 'svg' | 'pdf';
  scale?: number;
  quality?: number;
}

// Initialize plugin UI
penpot.ui.open("Template API Plugin", `?theme=${penpot.theme}`, {
  width: 400,
  height: 600,
});

// Handle messages from the UI
penpot.ui.onMessage((message: any) => {
  switch (message.type) {
    case 'MODIFY_TEMPLATE':
      handleTemplateModification(message.data);
      break;
    case 'EXPORT_TEMPLATE':
      handleTemplateExport(message.data);
      break;
    case 'GET_TEMPLATE_INFO':
      handleGetTemplateInfo();
      break;
  }
});

// Get current template information
async function handleGetTemplateInfo() {
  try {
    const selection = penpot.selection;
    const currentBoard = selection.find(s => s.type === 'board');

    penpot.ui.sendMessage({
      type: 'TEMPLATE_INFO',
      data: {
        currentBoard: currentBoard ? {
          id: currentBoard.id,
          name: currentBoard.name
        } : null,
        selection: selection.map(s => ({
          id: s.id,
          type: s.type,
          name: s.name
        }))
      }
    });
  } catch (error) {
    handleError('Failed to get template info', error);
  }
}

// Handle template modifications
async function handleTemplateModification(modifications: TemplateModification[]) {
  try {
    for (const mod of modifications) {
      const shape = penpot.selection.find(s => s.id === mod.elementId);
      if (!shape) {
        console.warn(`Shape ${mod.elementId} not found`);
        continue;
      }

      // Apply modifications
      Object.assign(shape, mod.properties);
    }

    penpot.ui.sendMessage({
      type: 'MODIFICATION_COMPLETE',
      success: true
    });
  } catch (error) {
    handleError('Failed to modify template', error);
  }
}

// Handle template export
async function handleTemplateExport(_options: ExportOptions) {
  try {
    const selection = penpot.selection;
    if (!selection || selection.length === 0) {
      throw new Error('No objects selected for export');
    }

    const currentBoard = selection.find(s => s.type === 'board');
    if (!currentBoard) {
      throw new Error('No board selected');
    }

    // Currently we can only work with selected objects
    penpot.ui.sendMessage({
      type: 'EXPORT_INFO',
      message: 'Select the objects you want to export in Penpot',
      data: {
        selectedObjects: selection.map(obj => ({
          id: obj.id,
          type: obj.type,
          name: obj.name
        }))
      }
    });
  } catch (error) {
    handleError('Failed to export template', error);
  }
}

// Error handler
function handleError(message: string, error: any) {
  console.error(message, error);
  penpot.ui.sendMessage({
    type: 'ERROR',
    message: message,
    details: error?.message || 'Unknown error'
  });
}

// Update the theme in the iframe
penpot.on("themechange", (theme) => {
  penpot.ui.sendMessage({
    source: "penpot",
    type: "themechange",
    theme,
  });
});