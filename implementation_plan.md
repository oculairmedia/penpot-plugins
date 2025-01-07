# Penpot Plugin: Template Management and API Export - Implementation Plan

**Objective:** To develop a Penpot plugin that enables users to create templates within Penpot and export them via an API.

**Phase 1: Template Creation and Management Implementation**

1.  **Template Data Model:**
     ```typescript
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
     ```

2.  **Storage Implementation:**
     * Templates are stored as Penpot library components using the Plugin API
     * Each template is stored as a component with:
       - Name prefixed with 'template:' for identification
       - Template metadata stored using component's plugin data
       - Template elements stored as component shapes
     * Implementation uses `penpot.library.local` API for persistence
     * Template data is serialized/deserialized using JSON

3.  **Template Operations:**
     * **Save Template:**
       - Captures selected elements from canvas
       - Creates a library component with template prefix
       - Stores metadata using plugin data API
       - Preserves element structure and properties
     * **Load Template:**
       - Retrieves component from library
       - Extracts metadata from plugin data
       - Creates instance of component on canvas
     * **List Templates:**
       - Filters library components by template prefix
       - Deserializes metadata for each template
       - Returns formatted template list

**Phase 2: Template Storage and Plugin Data Implementation**

1.  **Plugin Data Storage:**
     * Templates are stored using Penpot's Plugin Data API:
       ```typescript
       // Store template metadata
       component.setPluginData('templateData', JSON.stringify({
         description: template.description,
         createdAt: template.createdAt
       }));

       // Retrieve template metadata
       const templateData = component.getPluginData('templateData');
       const data = JSON.parse(templateData);
       ```

2.  **Component Integration:**
     * Templates are managed through Penpot's Library Components:
       - Each template is a library component
       - Template data is stored in plugin data
       - Template content is stored in component instances
       - Component names are prefixed with 'template:'

3.  **Data Access Methods:**
     * **Template Storage:**
       ```typescript
       // Save template
       const component = penpot.library.local.createComponent(shapes);
       component.name = `template:${template.name}`;
       component.setPluginData('templateData', metadata);

       // Load template
       const instance = component.mainInstance();
       const metadata = JSON.parse(component.getPluginData('templateData'));
       ```

**Phase 3: Future Enhancements**

1.  **Implementation Status:**
    * ✓ Template data model defined
    * ✓ Component-based storage implemented
    * ✓ Plugin data persistence working
    * ✓ Basic template saving functional
    * ✓ Template listing implemented

2.  **Next Steps:**
    * Enhance template loading functionality
    * Add template modification capabilities
    * Improve error handling and validation
    * Add template preview functionality
    * Implement template versioning

3.  **Future Features:**
    * Template categories and organization
    * Advanced search and filtering
    * Batch operations support
    * Template sharing capabilities
    * Export/import functionality

**Technical Considerations:**

*   **Penpot Plugin API Integration:**
    * Using `@penpot/plugin-types` for TypeScript type safety
    * Key interfaces utilized:
      - `LibraryComponent` for template storage
      - `Shape` for template content
      - `PluginData` for metadata storage
    * Template data structure:
      ```typescript
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
      ```

*   **Data Storage Strategy:**
    * Templates stored as library components
    * Metadata stored using plugin data API
    * Component instances for template content
    * JSON serialization for data persistence

*   **Plugin Architecture:**
    * Component-based storage system
    * Plugin data for metadata management
    * Library API for template persistence
    * Event-driven UI communication

**Implementation Steps (Refined):**

1.  **Explore Penpot Plugin API for Data Storage and Element Manipulation.**
2.  **Implement UI for Saving Templates (Phase 1).**
3.  **Implement Logic to Capture and Store Template Data (Phase 1).**
4.  **Implement UI for Listing and Loading Templates (Phase 1).**
5.  **Implement Logic to Retrieve and Provide Template Data (Phase 2).**
6.  **Implement API Endpoints (Internal to the Plugin) for Accessing Template Data (Phase 2).**
7.  **Test Thoroughly.**
8.  **Document the Plugin Functionality and "API" (Phase 2).**
