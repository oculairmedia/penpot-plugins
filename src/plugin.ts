// Template Engine Plugin
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

// Helper function to log to UI
function logToUI(message: string) {
  penpot.ui.sendMessage({
    type: 'LOG',
    message: message
  });
}

// Initialize plugin UI
penpot.ui.open("Template Engine", `?theme=${penpot.theme}`, {
  width: 400,
  height: 600,
});

// Handle selection changes
penpot.on("selectionchange", () => {
  const selection = penpot.selection;
  if (selection.length === 1) {
    const obj = selection[0];
    logToUI('Selected object: ' + JSON.stringify({
      id: obj.id,
      type: obj.type,
      name: obj.name
    }));
    
    // Get all properties of the object
    const allProps = getAllProperties(obj);
    logToUI('Available properties: ' + JSON.stringify(allProps));
    
    penpot.ui.sendMessage({
      type: 'SELECTION_CHANGED',
      data: {
        id: obj.id,
        type: obj.type,
        name: obj.name,
        properties: allProps
      }
    });
  }
});

// Get all properties from an object
function getAllProperties(obj: any) {
  const props: Record<string, any> = {};
  
  // Get all properties from the object
  for (const key in obj) {
    // Skip internal properties and functions
    if (!key.startsWith('_') && typeof obj[key] !== 'function') {
      props[key] = obj[key];
    }
  }

  // Group properties by category
  const groupedProps: Record<string, any> = {
    'Basic': {},
    'Position & Size': {},
    'Style': {},
    'Text': {},
    'Other': {}
  };

  // Basic properties
  const basicProps = ['id', 'name', 'type', 'opacity', 'visible', 'blocked', 'interactive'];
  basicProps.forEach(prop => {
    if (props[prop] !== undefined) {
      groupedProps['Basic'][prop] = props[prop];
      delete props[prop];
    }
  });

  // Position & Size properties
  const positionProps = ['x', 'y', 'width', 'height', 'rotation', 'selrect', 'points', 'transforms'];
  positionProps.forEach(prop => {
    if (props[prop] !== undefined) {
      groupedProps['Position & Size'][prop] = props[prop];
      delete props[prop];
    }
  });

  // Style properties
  const styleProps = ['fills', 'strokes', 'strokeStyle', 'strokeWidth', 'strokeAlignment', 'strokeColor',
                     'fillColor', 'fillOpacity', 'strokeOpacity', 'shadow'];
  styleProps.forEach(prop => {
    if (props[prop] !== undefined) {
      groupedProps['Style'][prop] = props[prop];
      delete props[prop];
    }
  });

  // Text properties
  const textProps = ['textContent', 'fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'textAlign',
                    'letterSpacing', 'lineHeight', 'textDecoration'];
  if (obj.type === 'text') {
    textProps.forEach(prop => {
      if (props[prop] !== undefined) {
        groupedProps['Text'][prop] = props[prop];
        delete props[prop];
      }
    });
  }

  // Add remaining properties to Other category
  groupedProps['Other'] = props;

  // Remove empty categories
  Object.keys(groupedProps).forEach(category => {
    if (Object.keys(groupedProps[category]).length === 0) {
      delete groupedProps[category];
    }
  });

  return groupedProps;
}

// Handle messages from the UI
penpot.ui.onMessage((message: any) => {
  logToUI('Received message: ' + JSON.stringify(message));
  switch (message.type) {
    case 'MODIFY_TEMPLATE':
      handleTemplateModification(message.data);
      break;
    case 'EXPORT_TEMPLATE':
      handleTemplateExport(message.data);
      break;
  }
});

// Handle template modifications
async function handleTemplateModification(modifications: TemplateModification[]) {
  try {
    logToUI('Modifications received: ' + JSON.stringify(modifications));

    for (const mod of modifications) {
      const shape = penpot.selection.find(s => s.id === mod.elementId);
      if (!shape) {
        logToUI(`Shape ${mod.elementId} not found`);
        continue;
      }

      logToUI('Found shape: ' + JSON.stringify({
        id: shape.id,
        type: shape.type,
        name: shape.name
      }));

      // Apply modifications
      for (const [key, value] of Object.entries(mod.properties)) {
        try {
          logToUI(`Attempting to modify ${key} to: ${JSON.stringify(value)}`);
          logToUI(`Current value of ${key}: ${JSON.stringify((shape as any)[key])}`);
          
          // Special handling for certain properties
          if (key === 'x' || key === 'y') {
            const x = key === 'x' ? value : shape.x;
            const y = key === 'y' ? value : shape.y;
            logToUI('Setting position: ' + JSON.stringify({ x, y }));
            shape.x = x;
            shape.y = y;
          } else if (key === 'width' || key === 'height') {
            // Create a new bounds object with the updated dimension
            const bounds = {
              x: shape.x,
              y: shape.y,
              width: key === 'width' ? value : shape.width,
              height: key === 'height' ? value : shape.height
            };
            logToUI('Setting bounds: ' + JSON.stringify(bounds));
            Object.assign(shape.bounds, bounds);
          } else if (key === 'rotation') {
            logToUI('Setting rotation: ' + value);
            shape.rotation = value;
          } else if (key === 'visible') {
            logToUI('Setting visibility: ' + value);
            shape.visible = value;
          } else if (key === 'blocked') {
            logToUI('Setting blocked state: ' + value);
            shape.blocked = value;
          } else {
            // For other properties, try direct assignment
            logToUI('Direct assignment: ' + key + ' = ' + JSON.stringify(value));
            (shape as any)[key] = value;
          }
          
          logToUI(`Modified ${key} to: ${JSON.stringify((shape as any)[key])}`);
        } catch (err) {
          logToUI(`Error modifying property ${key}: ${err}`);
          throw err;
        }
      }
    }

    penpot.ui.sendMessage({
      type: 'MODIFICATION_COMPLETE',
      success: true
    });
  } catch (error) {
    logToUI('Modification error: ' + error);
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
  const errorMessage = `${message}: ${error?.message || 'Unknown error'}`;
  logToUI(errorMessage);
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
