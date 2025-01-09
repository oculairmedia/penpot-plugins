// Template API Plugin
// This plugin provides an API for modifying and exporting Penpot templates

import { Shape, LibraryComponent, Penpot } from '@penpot/plugin-types';

// Declare penpot as an ambient variable
declare const penpot: Penpot;

// Define Stroke interface
interface Stroke {
  strokeColor: string;
  strokeOpacity: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted' | 'mixed';
  strokeWidth: number;
  strokeAlignment: 'center' | 'inner' | 'outer';
  strokeCapEnd: 'none' | 'round' | 'square';
  strokeCapStart: 'none' | 'round' | 'square';
}

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

    // Perform initialization checks after UI is opened
    setTimeout(() => {
      try {
        // Verify localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('penpot_plugin_test', 'test');
          localStorage.removeItem('penpot_plugin_test');
          console.log("Template API Plugin: Storage check passed");
        }

        // Verify library access and components
        if (!penpot.library?.local) {
          throw new Error('Library API not available');
        }

        // Log library status
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
  type: 'svg' | 'png' | 'jpeg' | 'pdf';
  scale?: number;
  suffix?: string;
}

// Template storage functions
function getStoredTemplates(): Template[] {
  try {
    console.log("Storage: Attempting to read templates");
    
    // Verify library access
    if (!penpot.library?.local) {
      console.warn("Storage: Library API not available");
      return [];
    }

    // Get templates from local library components with detailed logging
    const components = penpot.library.local.components;
    console.log("Storage: Library components status", {
      componentsAvailable: !!components,
      componentsCount: components?.length || 0,
      timestamp: new Date().toISOString()
    });

    if (!components || components.length === 0) {
      console.log("Storage: No components found in library");
      return [];
    }

    // Log all components for debugging
    console.log("Storage: Available components", {
      components: components.map(comp => ({
        id: comp.id,
        name: comp.name,
        hasPluginData: !!comp.getPluginData?.('templateData')
      }))
    });

    // Filter and convert components to templates
    const templateComponents = components.filter(comp => comp.name.startsWith('template:'));
    console.log("Storage: Found template components", {
      count: templateComponents.length,
      templateNames: templateComponents.map(comp => comp.name)
    });

    const templates = templateComponents
      .map(comp => {
        try {
          // Get and verify template data
          const templateData = comp.getPluginData('templateData');
          console.log("Storage: Processing template component", {
            id: comp.id,
            name: comp.name,
            hasTemplateData: !!templateData
          });

          if (!templateData) {
            console.warn("Storage: No template data found for component", {
              componentId: comp.id,
              componentName: comp.name
            });
            return null;
          }

          const data = JSON.parse(templateData);
          
          // Get both main instance and create a new instance
          const mainInstance = comp.mainInstance();
          const instance = comp.instance();
          
          console.log("Storage: Component instances", {
            componentId: comp.id,
            hasMainInstance: !!mainInstance,
            hasInstance: !!instance,
            mainInstanceId: mainInstance?.id,
            instanceId: instance?.id
          });

          if (!mainInstance && !instance) {
            console.warn("Storage: No instances available for component", {
              componentId: comp.id,
              componentName: comp.name
            });
            return null;
          }

          // Use the instance that's available
          const activeInstance = mainInstance || instance;
          
          return {
            id: data.id || comp.id,
            name: comp.name.replace('template:', ''),
            description: data.description || '',
            createdAt: data.createdAt || new Date().toISOString(),
            elements: [{
              id: activeInstance.id,
              type: activeInstance.type,
              name: activeInstance.name,
              data: activeInstance
            }]
          };
        } catch (e) {
          console.warn('Failed to parse template data:', {
            error: e,
            componentId: comp.id,
            componentName: comp.name
          });
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

    // Verify library access
    if (!penpot.library?.local) {
      throw new Error('Library API not available');
    }

    console.log("Storage: Library status before save", {
      componentsAvailable: !!penpot.library.local.components,
      componentsCount: penpot.library.local.components?.length || 0
    });

    // First, remove existing template components
    const existingComponents = penpot.library.local.components || [];
    const templateComponents = existingComponents.filter(comp => comp.name.startsWith('template:'));
    
    console.log("Storage: Found existing template components", {
      count: templateComponents.length,
      names: templateComponents.map(comp => comp.name)
    });

    for (const comp of templateComponents) {
      try {
        // Clear the component's content
        const instance = comp.mainInstance();
        if (instance) {
          instance.remove();
          console.log("Storage: Removed template component instance", {
            componentId: comp.id,
            componentName: comp.name
          });
        }
      } catch (e) {
        console.warn("Storage: Failed to remove template component", {
          error: e,
          componentId: comp.id,
          componentName: comp.name
        });
      }
    }

    // Save new templates as components
    let savedCount = 0;
    for (const template of templates) {
      try {
        console.log("Storage: Creating component for template", {
          templateId: template.id,
          templateName: template.name,
          elementsCount: template.elements.length
        });

        // Find existing component or create new one
        let component: LibraryComponent | null = null;
        
        // Use the original shapes directly
        console.log("Creating component from original shapes");
        const shapes = template.elements.map(el => el.data);
        component = penpot.library.local.createComponent(shapes);
        if (!component) {
          throw new Error('Failed to create component');
        }

        // Update component name and metadata
        component.name = `template:${template.name}`;
        const templateData = {
          id: template.id,
          description: template.description,
          createdAt: template.createdAt,
          elements: template.elements.map(el => ({
            id: el.id,
            type: el.type,
            name: el.name
          }))
        };
        component.setPluginData('templateData', JSON.stringify(templateData));

        console.log("Storage: Template component updated successfully", {
          componentId: component.id,
          componentName: component.name,
          elementsCount: template.elements.length,
          templateData: templateData
        });

        savedCount++;
      } catch (e) {
        console.error("Storage: Failed to save template", {
          error: e,
          templateId: template.id,
          templateName: template.name
        });
      }
    }

    console.log("Storage: Templates save operation complete", {
      attemptedCount: templates.length,
      successfulSaves: savedCount,
      libraryComponentsCount: penpot.library.local.components?.length || 0
    });
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

    // Use selection directly as template elements
    const elements = selection.map(obj => ({
      id: obj.id,
      type: obj.type as ShapeType,
      name: obj.name || 'Unnamed Object',
      data: obj
    }));

    console.log("Template save: Using selected objects", {
      count: elements.length,
      objects: elements.map(el => ({
        id: el.id,
        type: el.type,
        name: el.name
      }))
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

// Shape modification types
interface Fill {
  fillColor: string;
  fillOpacity: number;
  fillColorGradient?: any;
  fillColorRefId?: string;
  fillColorRefFile?: string;
  fillImage?: any;
}

interface GeometricProperties {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
}

interface ShapeProperties extends GeometricProperties {
  text?: string;
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted' | 'mixed';
  strokeWidth?: number;
  strokeAlignment?: 'center' | 'inner' | 'outer';
  strokeCapEnd?: 'none' | 'round' | 'square';
  strokeCapStart?: 'none' | 'round' | 'square';
  imageUrl?: string;
}

function handleTemplateModification(modifications: TemplateModification[]): void {
  try {
    const results = modifications.map(mod => {
      const shape = penpot.selection.find(s => s.id === mod.elementId);
      if (!shape) {
        console.warn(`Shape ${mod.elementId} not found`);
        return { id: mod.elementId, success: false };
      }

      try {
        const props = mod.properties as ShapeProperties;
        const shapeObj = shape as any;

        // Apply text modifications for text shapes
        if (shape.type === 'text' && props.text) {
          shapeObj.characters = props.text;
        }

        // Apply fill modifications
        if (props.fillColor) {
          const fill: Fill = {
            fillColor: props.fillColor,
            fillOpacity: props.fillOpacity || 1
          };
          shapeObj.fills = [fill];
        }

        // Apply stroke modifications
        if (props.strokeColor && 'strokes' in shape) {
          const stroke: Stroke = {
            strokeColor: props.strokeColor,
            strokeOpacity: props.strokeOpacity || 1,
            strokeStyle: props.strokeStyle || 'solid',
            strokeWidth: props.strokeWidth || 1,
            strokeAlignment: props.strokeAlignment || 'center',
            strokeCapEnd: props.strokeCapEnd || 'none',
            strokeCapStart: props.strokeCapStart || 'none'
          };
          shapeObj.strokes = [stroke];
        }

        // Apply image source for image shapes
        if (shape.type === 'image' && props.imageUrl) {
          shapeObj.imageUrl = props.imageUrl;
        }

        // Apply geometric properties
        const geometricProps: GeometricProperties = {
          x: props.x,
          y: props.y,
          width: props.width,
          height: props.height,
          rotation: props.rotation
        };

        Object.entries(geometricProps).forEach(([key, value]) => {
          if (value !== undefined) {
            shapeObj[key] = value;
          }
        });

        console.log("Shape modified:", {
          id: shape.id,
          type: shape.type,
          appliedProperties: Object.keys(mod.properties)
        });

        return { id: shape.id, success: true };
      } catch (err) {
        console.error(`Failed to modify shape ${shape.id}:`, err);
        return { id: shape.id, success: false };
      }
    });

    const success = results.every(r => r.success);
    
    penpot.ui.sendMessage({
      type: 'MODIFICATION_COMPLETE',
      success,
      results
    });
  } catch (error) {
    console.error("Template modification failed:", error);
    penpot.ui.sendMessage({
      type: 'MODIFICATION_COMPLETE',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}


// Handle template export
async function handleTemplateExport(data: { templateId: string } & ExportOptions) {
  try {
    console.log("Starting template export with data:", {
      templateId: data.templateId,
      exportOptions: {
        type: data.type,
        scale: data.scale,
        suffix: data.suffix
      }
    });

    // Find the template
    const templates = getStoredTemplates();
    const template = templates.find(t => t.id === data.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    console.log("Found template:", {
      templateId: template.id,
      templateName: template.name,
      elementsCount: template.elements.length
    });

    // Get the component instance from the template
    const component = template.elements[0].data;
    if (!component) {
      throw new Error('Template component not found');
    }

    console.log("Component details:", {
      componentId: component.id,
      componentType: component.type,
      componentName: component.name
    });

    // Get the component's bounds to determine the export size
    const bounds = component.bounds;
    console.log("Component bounds:", bounds);
    
    if (!bounds) {
      throw new Error('Could not determine component bounds');
    }

    try {
      // Configure export settings
      const exportConfig = {
        type: data.type || 'png',
        scale: data.scale || 2, // Default 2x scale for better quality
        suffix: data.suffix || ''
      };

      console.log("Starting export with config:", exportConfig);
      
      // Export the component directly
      const exportData = await component.export(exportConfig);
      console.log("Export successful, data size:", exportData.length);
      
      // Convert the export data to a Uint8Array if it isn't already
      const binaryData = exportData instanceof Uint8Array 
        ? exportData 
        : new Uint8Array(exportData);
      
      // Send the binary data directly to the UI
      console.log("Export complete, sending binary data to UI");
      penpot.ui.sendMessage({
        type: 'EXPORT_COMPLETE',
        data: {
          binaryData: Array.from(binaryData), // Convert Uint8Array to regular array for serialization
          mimeType: exportConfig.type === 'png' ? 'image/png' : 
                   exportConfig.type === 'svg' ? 'image/svg+xml' :
                   exportConfig.type === 'pdf' ? 'application/pdf' : 
                   'image/jpeg',
          filename: `${template.name}${exportConfig.suffix || ''}.${exportConfig.type}`
        }
      });
    } catch (error) {
      console.error("Export operation failed:", {
        error,
        component: {
          id: component.id,
          name: component.name,
          type: component.type,
          bounds: bounds
        }
      });
      
      if (error instanceof Error) {
        throw new Error(`Export operation failed: ${error.message}`);
      } else {
        throw new Error('Export operation failed: Unknown error');
      }
    }
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
