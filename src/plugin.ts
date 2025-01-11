// Template API Plugin
// This plugin provides an API for modifying and exporting Penpot templates

import { initializePlugin } from './initialization';
import {
  handleSaveTemplate,
  handleLoadTemplate,
  handleDeleteTemplate,
  handleListTemplates,
  handleGetTemplateInfo,
  handleTemplateModification,
  handleTemplateExport,
  handleGetElementInfo
} from './handlers';

declare const penpot: any;

// Initialize the plugin
initializePlugin();

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
      handleGetTemplateInfo(message.data);
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
    case 'GET_ELEMENT_INFO':
      handleGetElementInfo(message.data);
      break;
  }
});