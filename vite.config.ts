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
      allow: ['..']
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
  ],
  preview: {
    port: 3000,
  },
});