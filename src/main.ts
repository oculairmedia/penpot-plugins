import "./style.css";

// Get the current theme from the URL
const searchParams = new URLSearchParams(window.location.search);
document.body.dataset.theme = searchParams.get("theme") ?? "light";

// UI Elements
const elementId = document.getElementById("elementId") as HTMLInputElement;
const properties = document.getElementById("properties") as HTMLTextAreaElement;
const exportFormat = document.getElementById("exportFormat") as HTMLSelectElement;
const exportScale = document.getElementById("exportScale") as HTMLInputElement;
const messages = document.getElementById("messages") as HTMLDivElement;
const selectedObjectInfo = document.getElementById("selectedObjectInfo") as HTMLDivElement;
const propertiesEditor = document.getElementById("propertiesEditor") as HTMLDivElement;
const logs = document.getElementById("logs") as HTMLPreElement;

// List of properties that cannot be modified
const readOnlyProps = ['id', 'type', 'bounds', 'center', 'parentX', 'parentY', 'boardX', 'boardY'];

// Event Handlers
document.querySelector("[data-handler='modify-template']")?.addEventListener("click", () => {
  try {
    const props = JSON.parse(properties.value);
    // Filter out read-only properties
    const modifiableProps = Object.fromEntries(
      Object.entries(props).filter(([key]) => !readOnlyProps.includes(key))
    );
    
    parent.postMessage({
      type: "MODIFY_TEMPLATE",
      data: [{
        elementId: elementId.value,
        properties: modifiableProps
      }]
    }, "*");
  } catch (error) {
    showMessage("Error: Invalid JSON in properties field", "error");
  }
});

document.querySelector("[data-handler='export-template']")?.addEventListener("click", () => {
  parent.postMessage({
    type: "EXPORT_TEMPLATE",
    data: {
      format: exportFormat.value,
      scale: parseFloat(exportScale.value)
    }
  }, "*");
});

// Message handling from plugin.ts
window.addEventListener("message", (event) => {
  const data = event.data;

  switch (data.type) {
    case "themechange":
      if (data.source === "penpot") {
        document.body.dataset.theme = data.theme;
      }
      break;

    case "MODIFICATION_COMPLETE":
      showMessage("Template modified successfully", "success");
      break;

    case "EXPORT_COMPLETE":
      showMessage("Template exported successfully", "success");
      break;

    case "EXPORT_NOT_SUPPORTED":
      showMessage(data.message, "warning");
      break;

    case "ERROR":
      showMessage(`Error: ${data.message}`, "error");
      break;

    case "SELECTION_CHANGED":
      updateSelectedObjectInfo(data.data);
      break;

    case "LOG":
      addLog(data.message);
      break;
  }
});

// Helper function to format property name for display
function formatPropertyName(name: string): string {
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to determine if a value should be displayed as a color picker
function isColorValue(value: any): boolean {
  if (typeof value !== 'string') return false;
  return value.match(/^#[0-9a-f]{3,8}$/i) !== null;
}

// Update selected object info and properties
function updateSelectedObjectInfo(obj: any) {
  // Update element ID display
  elementId.value = obj.id;

  // Show object info
  selectedObjectInfo.innerHTML = `
    <div>
      <strong>ID:</strong> ${obj.id}
    </div>
    <div>
      <strong>Type:</strong> ${obj.type}
    </div>
    <div>
      <strong>Name:</strong> ${obj.name || 'Unnamed'}
    </div>
  `;

  // Create editable properties interface
  let propsHtml = '';
  
  // Iterate through property categories
  Object.entries(obj.properties).forEach(([category, props]) => {
    if (Object.keys(props as object).length > 0) {
      propsHtml += `
        <div class="form-group">
          <h3 class="category-title">${category}</h3>
          ${Object.entries(props as object)
            .filter(([key]) => !readOnlyProps.includes(key))
            .map(([key, value]) => {
              const formattedName = formatPropertyName(key);
              const inputType = typeof value === 'number' ? 'number' :
                              typeof value === 'boolean' ? 'checkbox' :
                              isColorValue(value) ? 'color' : 'text';
              
              if (inputType === 'checkbox') {
                return `
                  <div class="form-group checkbox-group">
                    <label for="prop-${key}">${formattedName}:</label>
                    <input class="input" 
                           id="prop-${key}"
                           type="checkbox"
                           ${value ? 'checked' : ''}
                           data-property="${key}"
                           data-category="${category}"
                    />
                  </div>
                `;
              }
              
              return `
                <div class="form-group">
                  <label for="prop-${key}">${formattedName}:</label>
                  <input class="input" 
                         id="prop-${key}" 
                         type="${inputType}"
                         value="${value}"
                         data-property="${key}"
                         data-category="${category}"
                  />
                </div>
              `;
            }).join('')}
        </div>
      `;
    }
  });

  propertiesEditor.innerHTML = `
    <div class="properties-container">
      ${propsHtml}
    </div>
    <button type="button" data-appearance="primary" data-handler="apply-properties">Apply Changes</button>
  `;

  // Update JSON view
  properties.value = JSON.stringify(obj.properties, null, 2);

  // Add event listener for the apply button
  document.querySelector('[data-handler="apply-properties"]')?.addEventListener('click', () => {
    const updatedProps: Record<string, any> = {};
    const inputs = propertiesEditor.querySelectorAll<HTMLInputElement>('.input[data-property]');
    
    inputs.forEach((input) => {
      const key = input.dataset.property as string;
      if (readOnlyProps.includes(key)) return;
      
      let value: any = input.type === 'checkbox' ? input.checked : input.value;
      
      // Convert to number if the input type is number
      if (input.type === 'number') {
        value = parseFloat(value);
      }
      
      // Convert specific string values to booleans
      if (value === 'true' || value === 'false') {
        value = value === 'true';
      }
      
      updatedProps[key] = value;
    });

    // Send modification message
    parent.postMessage({
      type: "MODIFY_TEMPLATE",
      data: [{
        elementId: obj.id,
        properties: updatedProps
      }]
    }, "*");
  });
}

// Helper function to show messages
function showMessage(text: string, type: "success" | "error" | "warning" = "success") {
  const messageEl = document.createElement("div");
  messageEl.className = `message message-${type}`;
  messageEl.textContent = text;
  
  messages.appendChild(messageEl);
  
  // Remove message after 5 seconds
  setTimeout(() => {
    messageEl.remove();
  }, 5000);
}

// Helper function to add logs
function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString();
  logs.textContent += `[${timestamp}] ${message}\n`;
  logs.scrollTop = logs.scrollHeight;
}
