// Template API Plugin
// This plugin provides an API for modifying and exporting Penpot templates

import { Shape } from '@penpot/plugin-types';

// Wrap initialization in a function to ensure it runs after the Penpot API is ready
function initializePlugin() {
  try {
    console.log("Template API Plugin: Starting initialization...");

    // Basic environment check
    if (typeof penpot === 'undefined') {
      throw new Error('This plugin must be run within the Penpot environment');
    }

    // Initialize plugin UI first
    penpot.ui.open("Template API Plugin", `?theme=${penpot.theme}`, {
      width: 400,
      height: 600,
    });

    // Perform storage checks after UI is initialized
    setTimeout(() => {
      try {
        // Verify localStorage after initialization
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('penpot_plugin_test', 'test');
          localStorage.removeItem('penpot_plugin_test');
          console.log("Template API Plugin: Storage check passed");
        }
      } catch (e) {
        console.warn("Template API Plugin: Storage check failed, some features may be limited", e);
      }
    }, 1000);

    console.log("Template API Plugin: Initialization complete");
  } catch (error) {
    console.error("Failed to initialize plugin:", error);
  }
}

// Initialize the plugin
initializePlugin();

type ShapeType = "boolean" | "group" | "board" | "rectangle" | "path" | "text" | "ellipse" | "svg-raw" | "image";

interface TemplateElement {
  id: string;
  type: ShapeType;
  name: string;
  data: Shape;
}

interface Template {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  boardId?: string;
  elements: TemplateElement[];
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
  try {
    console.log("Storage: Attempting to read templates");
    
    // Get templates from local library components
    const components = penpot.library.local.components;
    if (!components || components.length === 0) {
      console.log("Storage: No components found");
      return [];
    }

    // Filter and convert components to templates
    const templates = components
      .filter(comp => comp.name.startsWith('template:'))
      .map(comp => {
        try {
          // Get template data from plugin data
          const templateData = comp.getPluginData('templateData');
          const data = templateData ? JSON.parse(templateData) : {};
          
          // Get the main instance to access the shapes
          const instance = comp.mainInstance();
          
          return {
            id: comp.id,
            name: comp.name.replace('template:', ''),
            description: data.description || '',
            createdAt: data.createdAt || new Date().toISOString(),
            elements: instance ? [{
              id: instance.id,
              type: instance.type,
              name: instance.name,
              data: instance
            }] : []
          };
        } catch (e) {
          console.warn('Failed to parse template data:', e);
          return null;
        }
      })
      .filter((t): t is Template => t !== null);

    console.log("Storage: Templates retrieved successfully", {
      count: templates.length,
      templates: templates.map(t => ({ id: t.id, name: t.name }))
    });

    return templates;
  } catch (error) {
    console.error('Storage: Error reading templates:', {
      error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return [];
  }
}

function saveStoredTemplates(templates: Template[]): void {
  try {
    console.log("Storage: Attempting to save templates", {
      count: templates.length,
      templates: templates.map(t => ({ id: t.id, name: t.name }))
    });

    if (!Array.isArray(templates)) {
      throw new Error('Invalid templates data');
    }

    // First, remove existing template components
    const existingComponents = penpot.library.local.components || [];
    for (const comp of existingComponents) {
      if (comp.name.startsWith('template:')) {
        // Clear the component's content
        const instance = comp.mainInstance();
        if (instance) {
          instance.remove();
        }
      }
    }

    // Save new templates as components
    for (const template of templates) {
      // Create a new component
      const shapes = template.elements.map(el => el.data);
      const component = penpot.library.local.createComponent(shapes);
      
      // Set the template name
      component.name = `template:${template.name}`;
      
      // Store template metadata using plugin data
      const templateData = {
        description: template.description,
        createdAt: template.createdAt
      };
      component.setPluginData('templateData', JSON.stringify(templateData));
    }

    console.log("Storage: Templates saved successfully");
  } catch (error) {
    console.error('Storage: Error saving templates:', {
      error,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error('Failed to save templates to storage');
  }
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
    // Validate input data
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Template name is required');
    }

    // Check if Penpot is available
    if (typeof penpot === 'undefined') {
      throw new Error('Penpot environment is not available');
    }

    // Get and validate selection
    const selection = penpot.selection;
    console.log("Template save: Selection check", {
      selectionExists: !!selection,
      selectionType: typeof selection,
      selectionLength: selection?.length,
      timestamp: new Date().toISOString()
    });

    if (!selection) {
      throw new Error('Unable to access Penpot selection');
    }
    if (selection.length === 0) {
      throw new Error('Please select objects to save as template');
    }

    // Log selection details
    console.log("Template save: Selection details", {
      objects: selection.map(obj => ({
        id: obj.id,
        type: obj.type,
        name: obj.name
      })),
      timestamp: new Date().toISOString()
    });

    // Create deep copy of selected objects to ensure we capture all properties
    console.log("Template save: Starting object processing", {
      objectCount: selection.length,
      timestamp: new Date().toISOString()
    });

    const elements = selection.map(obj => {
      try {
        console.log("Processing object:", {
          id: obj.id,
          type: obj.type,
          name: obj.name,
          properties: Object.keys(obj)
        });

        // Clone the object to avoid reference issues
        const objString = JSON.stringify(obj);
        console.log("Object stringified successfully");
        
        const objData = JSON.parse(objString);
        console.log("Object parsed successfully");

        const element = {
          id: obj.id,
          type: obj.type,
          name: obj.name || 'Unnamed Object',
          data: objData
        };

        console.log("Element created successfully:", {
          id: element.id,
          type: element.type,
          name: element.name,
          dataKeys: Object.keys(element.data)
        });

        return element;
      } catch (err) {
        console.error('Error processing object:', {
          object: {
            id: obj.id,
            type: obj.type,
            name: obj.name
          },
          error: err,
          stack: err instanceof Error ? err.stack : undefined,
          timestamp: new Date().toISOString()
        });
        throw new Error(`Failed to process selected object: ${obj.name || 'unnamed'}`);
      }
    });

    console.log("Template save: Object processing complete", {
      processedCount: elements.length,
      timestamp: new Date().toISOString()
    });

    // Generate a unique ID using timestamp and random number
    const generateUniqueId = () => {
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 8);
      return `${timestamp}-${randomStr}`;
    };

    const template: Template = {
      id: generateUniqueId(),
      name: data.name.trim(),
      description: data.description?.trim() || '',
      createdAt: new Date().toISOString(),
      elements: elements
    };

    console.log("Template save: Template object created", {
      id: template.id,
      name: template.name,
      elementCount: template.elements.length
    });

    // Validate template data before saving
    if (!template.elements.every(el => el.id && el.type)) {
      throw new Error('Invalid template data: Missing required properties');
    }

    // Get existing templates
    let templates: Template[];
    try {
      console.log("Template save: Reading existing templates");
      templates = getStoredTemplates();
      console.log("Template save: Existing templates read successfully", {
        count: templates.length,
        existingNames: templates.map(t => t.name)
      });
    } catch (err) {
      console.error('Error reading existing templates:', {
        error: err,
        stack: err instanceof Error ? err.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw new Error('Failed to access template storage');
    }

    // Check for duplicate names
    const duplicateName = templates.find(t => t.name === template.name);
    if (duplicateName) {
      console.warn("Template save: Duplicate name found", {
        newName: template.name,
        existingTemplate: {
          id: duplicateName.id,
          createdAt: duplicateName.createdAt
        }
      });
      throw new Error('A template with this name already exists');
    }

    // Save the template
    try {
      console.log("Template save: Attempting to save template", {
        templateId: template.id,
        templateName: template.name,
        elementCount: template.elements.length
      });

      templates.push(template);
      saveStoredTemplates(templates);

      console.log("Template save: Template saved successfully", {
        totalTemplates: templates.length,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error saving template:', {
        error: err,
        stack: err instanceof Error ? err.stack : undefined,
        templateData: {
          id: template.id,
          name: template.name,
          elementCount: template.elements.length
        },
        timestamp: new Date().toISOString()
      });
      throw new Error('Failed to save template to storage');
    }

    // Notify UI of success
    penpot.ui.sendMessage({
      type: 'TEMPLATE_SAVED',
      data: template
    });
  } catch (error) {
    console.error('Template save error:', error);
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
  const errorDetails = {
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    data: error?.data,
    name: error?.name,
    code: error?.code
  };
  
  console.error('Plugin Error:', {
    message,
    error: errorDetails,
    timestamp: new Date().toISOString(),
    location: error?.stack?.split('\n')[1]?.trim() || 'Unknown location'
  });
  
  penpot.ui.sendMessage({
    type: 'ERROR',
    message: message,
    details: errorDetails.message,
    debugInfo: {
      ...errorDetails,
      timestamp: new Date().toISOString()
    }
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