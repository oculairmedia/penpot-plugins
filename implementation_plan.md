# Penpot Plugin: Template Management and API Export - Implementation Plan

**Objective:** To develop a Penpot plugin that enables users to create templates within Penpot and export them via an API.

**Phase 1: Enhance Template Creation and Management**

1.  **Understand Existing Template Interaction:** The plugin currently interacts with existing elements on the Penpot canvas. To create templates, we need a way to "save" the current state of a selection or a board as a reusable template.
2.  **Define Template Data Model (Refined):**
    *   Include the Penpot file/board ID, a snapshot of the relevant elements' data (likely their JSON representation), template name, description, and potentially metadata like creation date.
3.  **Implement Template Saving Logic:**
    *   Add a new UI element (e.g., a button) to trigger the template saving process.
    *   When triggered, capture the data of the selected elements or the current board.
    *   Store this data along with the template name and description (obtained from user input). Local/browser storage is suitable for the initial phase.
4.  **Implement Template Listing/Management UI (Refined):**
    *   Display saved templates with their names and descriptions.
    *   Provide an option to "load" a template, which would essentially add the saved elements back onto the canvas.

**Phase 2: Implement API-Based Export**

1.  **Refine API Endpoints:**
    *   `/api/templates`: List available templates.
    *   `/api/templates/{templateId}`: Get template metadata (name, description).
    *   `/api/templates/{templateId}/content`: Get the actual template content (the saved element data).
    *   `/api/templates/{templateId}/penpot`:  **(New)** Get the original Penpot file/board associated with the template (if applicable and feasible).
2.  **Implement API Logic (Backend - within `plugin.ts`):**
    *   **List Templates:** Retrieve template metadata from storage.
    *   **Get Template Metadata:** Retrieve metadata for a specific template.
    *   **Get Template Content:** Retrieve the saved element data for a template.
    *   **Get Penpot File/Board:** This will involve using the Penpot API, specifically the `get-file` method, to retrieve the original file associated with the template. (Source: Penpot API documentation provided earlier). Further investigation into Penpot's API capabilities is needed to determine if retrieving a board is also possible.
3.  **Implement Export Mechanism (Refined):**
    *   Modify the existing `handleTemplateExport` function or create a new one to handle the API-based export.
    *   Instead of just sending a message to the UI, this function will retrieve the template content and make it available via the defined API endpoints.

**Phase 3: UI Enhancements and API Integration**

1.  **Integrate API into UI:** Modify the UI to fetch and display the list of templates from the `/api/templates` endpoint.
2.  **Implement "Export via API" Option:** Add a button or option in the UI to trigger the API-based export, potentially allowing users to specify the desired format.

**Technical Considerations (Refined):**

*   **Penpot Plugin API:** Focus on using the Penpot Plugin API for data storage and potentially for accessing and manipulating Penpot files. The `@penpot/plugin-types` package provides TypeScript type definitions for the Penpot Plugin API, which can be installed using `npm install @penpot/plugin-types`. The `tsconfig.json` file needs to be updated to include the type definitions:
    ```json
    "typeRoots": [  "./node_modules/@types",  "./node_modules/@penpot"],"types": ["plugin-types"],
    ```
    (Source: Penpot Plugin API documentation). Further investigation into the Penpot Plugin API is needed to understand how to access canvas data and store plugin-specific data. The official documentation can be found at `https://penpot-docs-plugins.pages.dev/plugins/getting-started/` and practical examples can be found at `https://github.com/penpot/penpot-plugins-samples`. The Penpot Plugin API provides various interfaces and types for interacting with the Penpot environment. Some potentially relevant interfaces include `Penpot` (main interface), `Board`, `File`, `Page`, `ShapeBase`, `Rectangle`, `Ellipse`, `Path`, `Text`, `Image`, `SvgRaw`, `Group`, `Library`, `LibraryComponent`, `LibraryElement`, `Context`, `FontsContext`, `HistoryContext`, `Export`, and `PluginData`. Some relevant type aliases include `Shape`, `Point`, `Bounds`, `Gradient`, and `Color`. (Source: Penpot Plugin API modules documentation).
*   **Data Storage:** Local/browser storage (e.g., `localStorage`) is suitable for the initial phase.
*   **API Exposure:**  Since the plugin runs within Penpot, the "API" will likely be internal to the plugin. External access would require Penpot to provide a mechanism for plugins to expose HTTP endpoints, which is unlikely. The focus should be on providing access to the template data that other parts of Penpot or external tools could potentially use if Penpot's architecture allows for it.

**Implementation Steps (Refined):**

1.  **Explore Penpot Plugin API for Data Storage and Element Manipulation.**
2.  **Implement UI for Saving Templates (Phase 1).**
3.  **Implement Logic to Capture and Store Template Data (Phase 1).**
4.  **Implement UI for Listing and Loading Templates (Phase 1).**
5.  **Implement Logic to Retrieve and Provide Template Data (Phase 2).**
6.  **Implement API Endpoints (Internal to the Plugin) for Accessing Template Data (Phase 2).**
7.  **Test Thoroughly.**
8.  **Document the Plugin Functionality and "API" (Phase 2).**
