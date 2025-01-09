import "./style.css";

// Get the current theme from the URL
const searchParams = new URLSearchParams(window.location.search);
document.body.dataset.theme = searchParams.get("theme") ?? "light";

// UI Elements
const templateInfo = document.getElementById("templateInfo") as HTMLPreElement;
const elementId = document.getElementById("elementId") as HTMLInputElement;
const properties = document.getElementById("properties") as HTMLTextAreaElement;
const exportFormat = document.getElementById("exportFormat") as HTMLSelectElement;
const exportScale = document.getElementById("exportScale") as HTMLInputElement;
const messages = document.getElementById("messages") as HTMLDivElement;
const templateName = document.getElementById("templateName") as HTMLInputElement;
const templateDescription = document.getElementById("templateDescription") as HTMLTextAreaElement;
const templateList = document.getElementById("templateList") as HTMLDivElement;

// Load saved templates when the plugin starts
parent.postMessage({ type: "LIST_TEMPLATES" }, "*");

// Event Handlers
document.querySelector("[data-handler='get-info']")?.addEventListener("click", () => {
  parent.postMessage({ type: "GET_TEMPLATE_INFO" }, "*");
});

document.querySelector("[data-handler='modify-template']")?.addEventListener("click", () => {
  try {
    const props = JSON.parse(properties.value);
    parent.postMessage({
      type: "MODIFY_TEMPLATE",
      data: [{
        elementId: elementId.value,
        properties: props
      }]
    }, "*");
  } catch (error) {
    showMessage("Error: Invalid JSON in properties field", "error");
  }
});

document.querySelector("[data-handler='export-template']")?.addEventListener("click", () => {
  // Get the selected template
  const selectedTemplate = document.querySelector('.template-item.selected');
  if (!selectedTemplate) {
    showMessage("Please select a template to export", "error");
    return;
  }

  const templateId = selectedTemplate.getAttribute('data-template-id');
  if (!templateId) {
    showMessage("Invalid template selection", "error");
    return;
  }

  parent.postMessage({
    type: "EXPORT_TEMPLATE",
    data: {
      templateId,
      type: exportFormat.value,
      scale: parseFloat(exportScale.value)
    }
  }, "*");
});

// Add template selection handling
templateList.addEventListener('click', (event) => {
  const templateItem = (event.target as HTMLElement).closest('.template-item');
  if (!templateItem) return;

  // Don't select if clicking on action buttons
  if ((event.target as HTMLElement).closest('[data-action]')) return;

  // Toggle selection
  document.querySelectorAll('.template-item').forEach(item => {
    item.classList.remove('selected');
  });
  templateItem.classList.add('selected');

  // Get template info when selected
  const templateId = templateItem.getAttribute('data-template-id');
  if (templateId) {
    parent.postMessage({ type: "GET_TEMPLATE_INFO", data: { templateId } }, "*");
  }
});

// Save template handler
document.querySelector("[data-handler='save-template']")?.addEventListener("click", () => {
  const name = templateName.value.trim();
  const description = templateDescription.value.trim();
  
  if (!name) {
    showMessage("Template name is required", "error");
    return;
  }

  parent.postMessage({
    type: "SAVE_TEMPLATE",
    data: { name, description }
  }, "*");
});

// Render template list
function renderTemplates(templates: any[]) {
  templateList.innerHTML = templates.length === 0
    ? '<p class="no-templates">No templates saved yet</p>'
    : templates.map(template => `
      <div class="template-item" data-template-id="${template.id}">
        <h3>${escapeHtml(template.name)}</h3>
        <p>${escapeHtml(template.description || '')}</p>
        <div class="template-actions">
          <button type="button" data-action="load">Load Template</button>
          <button type="button" data-action="delete" data-appearance="danger">Delete</button>
        </div>
      </div>
    `).join('');

  // Add event listeners to template actions
  templateList.querySelectorAll('.template-item').forEach(item => {
    const templateId = item.getAttribute('data-template-id');
    
    item.querySelector('[data-action="load"]')?.addEventListener('click', () => {
      parent.postMessage({
        type: "LOAD_TEMPLATE",
        data: { templateId }
      }, "*");
    });

    item.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this template?')) {
        parent.postMessage({
          type: "DELETE_TEMPLATE",
          data: { templateId }
        }, "*");
      }
    });
  });
}

// Helper function to escape HTML
function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Debug logging function
function logDebug(type: string, data: any) {
  console.log(`[UI ${type}]`, {
    data,
    timestamp: new Date().toISOString(),
    location: new Error().stack?.split('\n')[2]?.trim()
  });
}

// Error logging function
function logError(type: string, error: any) {
  console.error(`[UI Error - ${type}]`, {
    error,
    message: error?.message,
    stack: error?.stack,
    timestamp: new Date().toISOString()
  });
}

// Message handling from plugin.ts
window.addEventListener("message", (event) => {
  const data = event.data;
  logDebug('Received Message', { type: data.type, data });

  // Skip processing for undefined or null data
  if (!data) {
    return;
  }

  // Only process messages that have a type
  if (!data.type) {
    return;
  }

  logDebug('Received Message', { type: data.type, data });

  try {
    switch (data.type) {
      case "themechange":
        if (data.source === "penpot") {
          document.body.dataset.theme = data.theme;
          logDebug('Theme Changed', { theme: data.theme });
        }
        break;

      case "TEMPLATE_INFO":
        templateInfo.textContent = JSON.stringify(data.data, null, 2);
        logDebug('Template Info Updated', data.data);
        break;

      case "MODIFICATION_COMPLETE":
        showMessage("Template modified successfully", "success");
        logDebug('Template Modified', { success: true });
        break;

      case "EXPORT_COMPLETE":
        try {
          // Create a Blob from the binary data
          const binaryArray = new Uint8Array(data.data.binaryData);
          const blob = new Blob([binaryArray], { type: data.data.mimeType });
          
          // Create a download URL
          const url = URL.createObjectURL(blob);
          
          // Create and trigger download
          const a = document.createElement('a');
          a.href = url;
          a.download = data.data.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Clean up
          URL.revokeObjectURL(url);
          
          showMessage("Template exported successfully", "success");
          logDebug('Template Exported', { success: true });
        } catch (error) {
          logError('Export Error', error);
          showMessage(`Error exporting template: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
        }
        break;

      case "EXPORT_NOT_SUPPORTED":
        showMessage(data.message, "warning");
        logDebug('Export Not Supported', { message: data.message });
        break;

      case "TEMPLATES_LIST":
        renderTemplates(data.data);
        logDebug('Templates List Rendered', { count: data.data?.length });
        break;

      case "TEMPLATE_SAVED":
        if (data.data) {
          showMessage("Template saved successfully", "success");
          templateName.value = '';
          templateDescription.value = '';
          // Refresh template list
          parent.postMessage({ type: "LIST_TEMPLATES" }, "*");
          logDebug('Template Saved', { templateId: data.data.id });
        } else {
          const error = new Error("Template data is missing");
          logError('Template Save', error);
          showMessage("Error: Template data is missing", "error");
        }
        break;

      case "TEMPLATE_LOADED":
        showMessage("Template loaded successfully", "success");
        logDebug('Template Loaded', { templateData: data.data });
        break;

      case "TEMPLATE_DELETED":
        showMessage("Template deleted successfully", "success");
        // Refresh template list
        parent.postMessage({ type: "LIST_TEMPLATES" }, "*");
        logDebug('Template Deleted', { success: true });
        break;

      case "WARNING":
        showMessage(data.message, "warning");
        logDebug('Warning Received', { message: data.message });
        break;

      case "ERROR":
        showMessage(`Error: ${data.message}`, "error");
        logError('Error Received', {
          message: data.message,
          details: data.details,
          debugInfo: data.debugInfo
        });
        break;

      default:
        logError('Unknown Message Type', { type: data.type });
        break;
    }
  } catch (error) {
    logError('Message Handler', error);
    showMessage(`Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
  }
});

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
