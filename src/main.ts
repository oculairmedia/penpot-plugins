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
  parent.postMessage({
    type: "EXPORT_TEMPLATE",
    data: {
      format: exportFormat.value,
      scale: parseFloat(exportScale.value)
    }
  }, "*");
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

// Message handling from plugin.ts
window.addEventListener("message", (event) => {
  const data = event.data;

  switch (data.type) {
    case "themechange":
      if (data.source === "penpot") {
        document.body.dataset.theme = data.theme;
      }
      break;

    case "TEMPLATE_INFO":
      templateInfo.textContent = JSON.stringify(data.data, null, 2);
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

    case "TEMPLATES_LIST":
      renderTemplates(data.data);
      break;

    case "TEMPLATE_SAVED":
      showMessage("Template saved successfully", "success");
      templateName.value = '';
      templateDescription.value = '';
      // Refresh template list
      parent.postMessage({ type: "LIST_TEMPLATES" }, "*");
      break;

    case "TEMPLATE_LOADED":
      showMessage("Template loaded successfully", "success");
      break;

    case "TEMPLATE_DELETED":
      showMessage("Template deleted successfully", "success");
      // Refresh template list
      parent.postMessage({ type: "LIST_TEMPLATES" }, "*");
      break;

    case "WARNING":
      showMessage(data.message, "warning");
      break;

    case "ERROR":
      showMessage(`Error: ${data.message}`, "error");
      break;
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