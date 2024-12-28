# Template API Plugin for Penpot

This plugin enables programmatic modification and export of Penpot templates through a user interface and API endpoints.

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- Access to a Penpot instance

## Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <your-repo-url>
   cd template-api-plugin
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Plugin**
   ```bash
   npm run build
   ```

4. **Serve the Plugin**
   You have several options to serve the plugin:

   a. Using http-server (recommended for testing):
   ```bash
   npm install -g http-server
   http-server dist -p 3000 --cors
   ```

   b. Using your own web server:
   - Copy the contents of the `dist` directory to your web server
   - Ensure CORS headers are properly set:
     ```
     Access-Control-Allow-Origin: *
     Access-Control-Allow-Methods: GET, POST, OPTIONS
     Access-Control-Allow-Headers: Content-Type
     ```

## Plugin Installation in Penpot

1. Open your Penpot instance
2. Press `Ctrl + Alt + P` (or `Cmd + Alt + P` on macOS) to open the Plugin Manager
3. Click "Install plugin"
4. Enter the plugin manifest URL:
   ```
   http://<your-server-ip>:3000/manifest.json
   ```
   Replace `<your-server-ip>` with your server's IP address or domain name

## Project Structure
```
template-api-plugin/
├── src/
│   ├── plugin.ts    # Main plugin logic
│   ├── main.ts      # UI interaction handling
│   └── style.css    # Plugin styles
├── public/
│   └── manifest.json # Plugin manifest
├── dist/            # Built files (after npm run build)
└── index.html       # Plugin UI template
```

## Plugin Features

1. **Template Information**
   - View current board information
   - List selected objects and their properties
   - Access object IDs for modification

2. **Template Modification**
   - Modify selected objects programmatically
   - Example modification:
     ```json
     {
       "name": "New Object Name",
       "content": "New Content"
     }
     ```

3. **Export Information**
   - Get details about selected objects
   - Prepare objects for external export processing

## Development Workflow

1. **Making Changes**
   - Modify plugin logic in `src/plugin.ts`
   - Update UI in `index.html` and `src/main.ts`
   - Adjust styles in `src/style.css`

2. **Building and Testing**
   ```bash
   # Build the plugin
   npm run build

   # Serve for testing
   http-server dist -p 3000 --cors
   ```

3. **Reloading in Penpot**
   - After making changes, rebuild the plugin
   - In Penpot, remove and reinstall the plugin to see changes

## Troubleshooting

1. **CORS Issues**
   - Ensure your server is sending proper CORS headers
   - Check browser console for CORS-related errors
   - Verify the manifest URL is accessible from Penpot

2. **Plugin Not Loading**
   - Verify the manifest.json is accessible
   - Check browser console for loading errors
   - Ensure all plugin files are being served correctly

3. **Changes Not Appearing**
   - Clear browser cache
   - Rebuild the plugin
   - Remove and reinstall the plugin in Penpot

## Security Notes

- The plugin requires specific permissions defined in manifest.json
- All modifications are made through Penpot's plugin API
- User authentication is handled by Penpot
- No sensitive data is stored by the plugin

## Quick Start Example

1. **Build and Serve**
   ```bash
   # First time setup
   npm install
   npm run build
   
   # Serve the plugin
   http-server dist -p 3000 --cors
   ```

2. **Install in Penpot**
   - Open Penpot
   - Press Ctrl + Alt + P
   - Enter: http://<your-server-ip>:3000/manifest.json

3. **Test Basic Functionality**
   - Select an object in Penpot
   - Click "Get Template Info" in the plugin
   - Try modifying the object using its ID

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console logs
3. Contact repository maintainers