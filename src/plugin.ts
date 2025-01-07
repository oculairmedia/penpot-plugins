// Template API Plugin
// This plugin provides an API for modifying and exporting Penpot templates

// Wrap initialization in a function to ensure it runs after the Penpot API is ready
function initializePlugin() {
  try {
    // Ensure we're in the Penpot environment
    if (typeof penpot === 'undefined') {
      throw new Error('This plugin must be run within the Penpot environment');
    }

    console.log("Template API Plugin initializing...");

    // Initialize plugin UI
    penpot.ui.open("Template API Plugin", `?theme=${penpot.theme}`, {
      width: 400,
      height: 600,
    });

    console.log("Template API Plugin initialized successfully");
  } catch (error) {
    console.error("Failed to initialize plugin:", error);
  }
}

// Initialize the plugin
initializePlugin();

interface Template {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  boardId?: string;
  elements: {
    id: string;
    type: string;
    name: string;
    data: any;
  }[];
}

interface TemplateModification {
  elementId: string;
  properties: Record<string, any>;
}

interface ExportOptions {
  format: 'png' | 'svg' | 'pdf';
  scale?: number;
  quality?: number;
}

// Template storage functions
function getStoredTemplates(): Template[] {
  const templatesJson = localStorage.getItem('penpot_templates');
  return templatesJson ? JSON.parse(templatesJson) : [];
}

function saveStoredTemplates(templates: Template[]) {
  localStorage.setItem('penpot_templates', JSON.stringify(templates));
}

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
    case 'SAVE_TEMPLATE':
      handleSaveTemplate(message.data);
      break;
    case 'LOAD_TEMPLATE':
      handleLoadTemplate(message.data.templateId);
      break;
    case 'DELETE_TEMPLATE':
      handleDeleteTemplate(message.data.templateId);
      break;
    case 'LIST_TEMPLATES':
      handleListTemplates();
      break;
  }
});

// Save current selection as template
async function handleSaveTemplate(data: { name: string; description: string }) {
  try {
    const selection = penpot.selection;
    if (!selection || selection.length === 0) {
      throw new Error('No objects selected for template');
    }

    const template: Template = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      createdAt: new Date().toISOString(),
      elements: selection.map(obj => ({
        id: obj.id,
        type: obj.type,
        name: obj.name,
        data: obj
      }))
    };

    const templates = getStoredTemplates();
    templates.push(template);
    saveStoredTemplates(templates);

    penpot.ui.sendMessage({
      type: 'TEMPLATE_SAVED',
      data: template
    });
  } catch (error) {
    handleError('Failed to save template', error);
  }
}

// Load template onto canvas
async function handleLoadTemplate(templateId: string) {
  try {
    const templates = getStoredTemplates();
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // For now, just notify the user that template loading is not yet implemented
    penpot.ui.sendMessage({
      type: 'WARNING',
      message: 'Template loading functionality is coming soon. The template data has been retrieved successfully.',
      data: template
    });

    penpot.ui.sendMessage({
      type: 'TEMPLATE_LOADED',
      data: template
    });
  } catch (error) {
    handleError('Failed to load template', error);
  }
}

// Delete template from storage
function handleDeleteTemplate(templateId: string) {
  try {
    const templates = getStoredTemplates();
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    saveStoredTemplates(updatedTemplates);

    penpot.ui.sendMessage({
      type: 'TEMPLATE_DELETED',
      data: { templateId }
    });
  } catch (error) {
    handleError('Failed to delete template', error);
  }
}

// List all saved templates
function handleListTemplates() {
  try {
    const templates = getStoredTemplates();
    penpot.ui.sendMessage({
      type: 'TEMPLATES_LIST',
      data: templates
    });
  } catch (error) {
    handleError('Failed to list templates', error);
  }
}

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