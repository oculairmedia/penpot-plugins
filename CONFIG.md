# Configuration Files Documentation

This document details the configuration files used in the Penpot Template API Plugin.

## vite.config.ts

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'build',
    emptyOutDir: false,
    rollupOptions: {
      input: 'src/plugin.ts',
      output: {
        entryFileNames: 'plugin.js',
        format: 'iife',
        name: 'plugin',
        inlineDynamicImports: true
      }
    },
    target: 'es2015',
    minify: false
  },
  publicDir: false,
  server: {
    port: 3000,
    cors: true,
    host: true,
    fs: {
      allow: ['..']  // Allow serving files from outside the root
    }
  },
  plugins: [
    {
      name: 'serve-plugin',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/plugin.js') {
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.end(`
              // Ensure penpot is available
              if (typeof penpot === 'undefined') {
                throw new Error('Penpot plugin API not found');
              }
              
              // Load the actual plugin code
              import('/src/plugin.ts')
                .catch(error => console.error('Failed to load plugin:', error));
            `);
            return;
          }
          next();
        });
      }
    }
  ]
});
```

This configuration:
- Builds the plugin core as an IIFE (Immediately Invoked Function Expression)
- Disables the public directory handling (we handle it manually)
- Enables CORS and network access for development
- Allows serving files from outside the project root directory
- Includes a custom middleware that:
  * Ensures the Penpot API is available before loading the plugin
  * Handles dynamic loading of the plugin code
  * Provides proper error handling for plugin initialization

## package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build:plugin": "vite build",
    "build:main": "esbuild src/main.ts --bundle --outfile=build/main.js",
    "copy-files": "copy public\\*.* build\\",
    "build": "npm run build:plugin && npm run build:main && npm run copy-files",
    "preview": "vite preview",
    "serve": "serve build --cors -l 3000 --no-clipboard"
  }
}
```

These scripts:
- Handle separate builds for plugin core and UI
- Copy static files to build directory
- Serve the built files with CORS enabled

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "typeRoots": ["./node_modules/@types", "./node_modules/@penpot"],
    "types": ["plugin-types"]
  },
  "include": ["src"]
}
```

This configuration:
- Sets up TypeScript for modern JavaScript features
- Includes Penpot plugin type definitions
- Enables strict type checking

## manifest.json

```json
{
  "name": "Template API Plugin",
  "code": "plugin.js",
  "description": "Plugin for programmatically modifying and exporting Penpot templates",
  "permissions": [
    "content:read",
    "content:write",
    "library:read",
    "library:write",
    "allow:downloads"
  ]
}
```

This configuration:
- Defines the plugin metadata
- Specifies required permissions
- Points to the main plugin code file

## Dependencies

Main dependencies:
- `@penpot/plugin-types`: TypeScript definitions for Penpot plugin API
- `@penpot/plugin-styles`: Base styles for Penpot plugins

Development dependencies:
- `vite`: Build tool and development server
- `typescript`: TypeScript compiler
- `esbuild`: Fast JavaScript/TypeScript bundler
- `serve`: Static file server for development