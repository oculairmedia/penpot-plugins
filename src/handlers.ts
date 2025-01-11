import { Template, TemplateModification, ExportOptions } from './types';
import { getStoredTemplates, saveStoredTemplates } from './storage';
import { generateUniqueId, handleError } from './utils';

declare const penpot: any;

export async function handleSaveTemplate(data: { name: string; description: string }) {
  try {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Template name is required');
    }

    if (typeof penpot === 'undefined') {
      throw new Error('Penpot environment is not available');
    }

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

    console.log("Template save: Selection details", {
      objects: selection.map((obj: any) => ({
        id: obj.id,
        type: obj.type,
        name: obj.name
      })),
      timestamp: new Date().toISOString()
    });

    const elements = selection.map((obj: any) => ({
      id: obj.id,
      type: obj.type,
      name: obj.name || 'Unnamed Object',
      data: obj
    }));

    console.log("Template save: Using selected objects", {
      count: elements.length,
      objects: elements.map((el: any) => ({
        id: el.id,
        type: el.type,
        name: el.name
      }))
    });

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

    if (!template.elements.every(el => el.id && el.type)) {
      throw new Error('Invalid template data: Missing required properties');
    }

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

    penpot.ui.sendMessage({
      type: 'TEMPLATE_SAVED',
      data: template
    });
  } catch (error) {
    console.error('Template save error:', error);
    handleError('Failed to save template', error);
  }
}

export async function handleLoadTemplate(templateId: string) {
  try {
    const templates = getStoredTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }

    console.log("Template load: Found template", {
      id: template.id,
      name: template.name,
      elementCount: template.elements.length
    });

    const instances = template.elements.map(el => {
      if (!el.data) {
        throw new Error(`Missing data for element: ${el.id}`);
      }
      return el.data;
    });

    console.log("Template load: Creating instances", {
      count: instances.length,
      types: instances.map(i => i.type)
    });

    penpot.ui.sendMessage({
      type: 'TEMPLATE_LOADED',
      data: template
    });
  } catch (error) {
    handleError('Failed to load template', error);
  }
}

export function handleDeleteTemplate(templateId: string) {
  try {
    const templates = getStoredTemplates();
    const filteredTemplates = templates.filter(t => t.id !== templateId);
    saveStoredTemplates(filteredTemplates);
    
    penpot.ui.sendMessage({
      type: 'TEMPLATE_DELETED',
      data: { templateId }
    });
  } catch (error) {
    handleError('Failed to delete template', error);
  }
}

export function handleListTemplates() {
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

export async function handleGetTemplateInfo(data?: { templateId?: string }) {
  try {
    const templates = getStoredTemplates();
    
    if (data?.templateId) {
      const template = templates.find(t => t.id === data.templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      console.log("Template info: Found template", {
        id: template.id,
        name: template.name,
        elementCount: template.elements.length
      });

      penpot.ui.sendMessage({
        type: 'TEMPLATE_INFO',
        data: template
      });
    } else {
      console.log("Template info: Returning all templates info", {
        count: templates.length
      });

      penpot.ui.sendMessage({
        type: 'TEMPLATES_INFO',
        data: templates.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          createdAt: t.createdAt,
          elementCount: t.elements.length
        }))
      });
    }
  } catch (error) {
    handleError('Failed to get template info', error);
  }
}

export function handleTemplateModification(modifications: TemplateModification[]): void {
  try {
    if (!Array.isArray(modifications)) {
      throw new Error('Invalid modifications data');
    }

    console.log("Template modification: Starting", {
      modificationCount: modifications.length,
      modifications: modifications.map(m => ({
        elementId: m.elementId,
        propertyCount: Object.keys(m.properties).length
      }))
    });

    const selection = penpot.selection;
    if (!selection) {
      throw new Error('No selection available');
    }

    for (const mod of modifications) {
      try {
        const element = selection.find((el: any) => el.id === mod.elementId);
        if (!element) {
          console.warn(`Element not found: ${mod.elementId}`);
          continue;
        }

        console.log("Template modification: Applying to element", {
          elementId: mod.elementId,
          elementType: element.type,
          properties: Object.keys(mod.properties)
        });

        Object.entries(mod.properties).forEach(([key, value]) => {
          try {
            element[key] = value;
          } catch (e) {
            console.warn(`Failed to set property ${key} on element ${mod.elementId}:`, e);
          }
        });
      } catch (e) {
        console.error(`Failed to process modification for element ${mod.elementId}:`, e);
      }
    }

    penpot.ui.sendMessage({
      type: 'TEMPLATE_MODIFIED',
      data: { modifiedCount: modifications.length }
    });
  } catch (error) {
    handleError('Failed to modify template', error);
  }
}

export async function handleTemplateExport(data: { templateId: string } & ExportOptions) {
  try {
    const templates = getStoredTemplates();
    const template = templates.find(t => t.id === data.templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }

    console.log("Template export: Found template", {
      id: template.id,
      name: template.name,
      elementCount: template.elements.length,
      exportType: data.type
    });

    const instances = template.elements.map(el => {
      if (!el.data) {
        throw new Error(`Missing data for element: ${el.id}`);
      }
      return el.data;
    });

    console.log("Template export: Processing instances", {
      count: instances.length,
      types: instances.map(i => i.type)
    });

    const scale = data.scale || 1;
    const suffix = data.suffix || '';
    const filename = `${template.name}${suffix}.${data.type}`;

    console.log("Template export: Preparing export", {
      filename,
      scale,
      type: data.type
    });

    penpot.ui.sendMessage({
      type: 'TEMPLATE_EXPORTED',
      data: {
        templateId: template.id,
        filename,
        type: data.type
      }
    });
  } catch (error) {
    handleError('Failed to export template', error);
  }
}

export function handleGetElementInfo(data: { elementId: string }) {
  try {
    const selection = penpot.selection;
    if (!selection) {
      throw new Error('No selection available');
    }

    const element = selection.find((el: any) => el.id === data.elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    console.log("Element info: Found element", {
      id: element.id,
      type: element.type,
      name: element.name
    });

    const elementInfo = {
      id: element.id,
      type: element.type,
      name: element.name,
      properties: {
        width: element.width,
        height: element.height,
        x: element.x,
        y: element.y,
        rotation: element.rotation,
        opacity: element.opacity
      }
    };

    penpot.ui.sendMessage({
      type: 'ELEMENT_INFO',
      data: elementInfo
    });
  } catch (error) {
    handleError('Failed to get element info', error);
  }
}