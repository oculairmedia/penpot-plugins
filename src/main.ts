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