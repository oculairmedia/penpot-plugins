import { Template } from './types';
import { LibraryComponent } from '@penpot/plugin-types';

declare const penpot: any;

export function getStoredTemplates(): Template[] {
  try {
    console.log("Storage: Attempting to read templates");
    
    if (!penpot.library?.local) {
      console.warn("Storage: Library API not available");
      return [];
    }

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

    console.log("Storage: Available components", {
      components: components.map((comp: LibraryComponent) => ({
        id: comp.id,
        name: comp.name,
        hasPluginData: !!comp.getPluginData?.('templateData')
      }))
    });

    const templateComponents = components.filter((comp: LibraryComponent) => comp.name.startsWith('template:'));
    console.log("Storage: Found template components", {
      count: templateComponents.length,
      templateNames: templateComponents.map((comp: LibraryComponent) => comp.name)
    });

    const templates = templateComponents
      .map((comp: LibraryComponent) => {
        try {
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
      .filter((t: Template | null): t is Template => t !== null);

    console.log("Storage: Templates retrieved successfully", {
      count: templates.length,
      templates: templates.map((t: Template) => ({ id: t.id, name: t.name }))
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

export function saveStoredTemplates(templates: Template[]): void {
  try {
    console.log("Storage: Attempting to save templates", {
      count: templates.length,
      templates: templates.map(t => ({ id: t.id, name: t.name }))
    });

    if (!Array.isArray(templates)) {
      throw new Error('Invalid templates data');
    }

    if (!penpot.library?.local) {
      throw new Error('Library API not available');
    }

    console.log("Storage: Library status before save", {
      componentsAvailable: !!penpot.library.local.components,
      componentsCount: penpot.library.local.components?.length || 0
    });

    const existingComponents = penpot.library.local.components || [];
    const templateComponents = existingComponents.filter((comp: LibraryComponent) => comp.name.startsWith('template:'));
    
    console.log("Storage: Found existing template components", {
      count: templateComponents.length,
      names: templateComponents.map((comp: LibraryComponent) => comp.name)
    });

    for (const comp of templateComponents) {
      try {
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

    let savedCount = 0;
    for (const template of templates) {
      try {
        console.log("Storage: Creating component for template", {
          templateId: template.id,
          templateName: template.name,
          elementsCount: template.elements.length
        });

        let component: LibraryComponent | null = null;
        
        console.log("Creating component from original shapes");
        const shapes = template.elements.map(el => el.data);
        component = penpot.library.local.createComponent(shapes);
        if (!component) {
          throw new Error('Failed to create component');
        }

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