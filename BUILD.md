# Penpot Plugin Development Environment Setup

This document describes how to set up and build the Penpot Template API Plugin development environment.

## Prerequisites

- Node.js (Latest LTS version recommended)
- npm (Comes with Node.js)
- A text editor (VS Code recommended)

## Project Structure

```
penpot-plugin/
├── public/              # Static files
│   ├── index.html      # Plugin UI entry point
│   ├── manifest.json   # Plugin manifest
│   └── style.css       # Plugin styles
├── src/                # Source files
│   ├── main.ts        # UI logic
│   ├── plugin.ts      # Plugin core logic
│   └── style.css      # Source styles (for development)
└── build/              # Build output directory
```

## Development Environment Setup

1. Install dependencies:
```bash
npm install
```

2. Install development dependencies:
```bash
npm install -D esbuild
```

## Building the Plugin

The build process consists of several steps:

1. Build the plugin core (plugin.ts):
```bash
npm run build:plugin
```

2. Build the UI logic (main.ts):
```bash
npm run build:main
```

3. Copy static files:
```bash
Copy-Item -Path "public\*.*" -Destination "build\" -Force  # PowerShell
# or
cp public/* build/  # Unix-like systems
```

4. All steps can be run together using:
```bash
npm run build
```

## Development Server

To serve the plugin locally:

```bash
npm run serve
```

This will serve the plugin at `http://localhost:3000` with CORS enabled.

## Plugin Configuration in Penpot

1. In Penpot, go to Plugins configuration
2. Add new plugin using the URL: `http://localhost:3000/manifest.json`
3. The plugin should appear in the Penpot interface

## Important Notes

- The plugin requires proper CORS headers for development
- The build process is configured to handle both the plugin core and UI separately
- Static files (index.html, manifest.json, style.css) are served from the build directory
- The development server must be running for Penpot to access the plugin

## Troubleshooting

### Common Issues and Solutions

1. Port Conflicts
   - If port 3000 is in use, kill all Node processes:
   ```bash
   taskkill /F /IM node.exe  # Windows
   # or
   pkill -f node  # Unix-like systems
   ```
   - Restart the development server:
   ```bash
   npm run serve
   ```

2. Permission Issues with build directory
   - If you encounter "Access denied" errors:
     * Stop all running servers
     * Delete the build directory manually
     * Run the build process again
   - On Windows, you might need to run PowerShell as administrator

3. Plugin Not Showing in Penpot
   - Verify all files are being served correctly (manifest.json, plugin.js, main.js)
   - Check browser console for any error messages
   - Ensure the plugin URL in Penpot matches your server URL exactly
   - Try clearing Penpot's plugin cache by removing and re-adding the plugin

4. Styling Issues
   - Make sure style.css is being served correctly
   - Verify the paths in index.html are correct
   - Check that both light and dark theme variables are properly defined

5. Build Process Failures
   - Clear the build directory
   - Run each build step separately to identify the issue:
     ```bash
     npm run build:plugin
     npm run build:main
     Copy-Item -Path "public\*.*" -Destination "build\" -Force
     ```
   - Check the console output for specific error messages

## File Descriptions

- `plugin.ts`: Core plugin logic that interacts with Penpot's API
- `main.ts`: UI logic for the plugin interface
- `manifest.json`: Plugin configuration and permissions
- `style.css`: Plugin styling with both light and dark theme support