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
    port: 53851,
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    },
    host: '0.0.0.0',
    fs: {
      allow: ['..']
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      overlay: true
    },
    watch: {
      usePolling: true,
      interval: 100
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
              
              // Enable HMR
              if (import.meta.hot) {
                import.meta.hot.accept();
              }
              
              // Load the actual plugin code
              import('/src/plugin.ts')
                .then(() => {
                  console.log('Plugin loaded successfully');
                })
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
    port: 53851,
  },
});
