# Penpot Template API Plugin

A Penpot plugin that enables users to create, manage, and export templates within Penpot. This plugin provides a powerful API for programmatically working with templates.

## Features

- Create and save templates from selected elements
- List and manage saved templates
- Load templates onto the canvas
- Export templates in various formats
- Modify template properties
- Dark/Light theme support

## Documentation

- [Build and Development Setup](BUILD.md)
- [Configuration Details](CONFIG.md)
- [Implementation Plan](implementation_plan.md)

## Quick Start

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Build the plugin:
```bash
npm run build
```

4. Start the development server:
```bash
npm run serve
```

5. In Penpot:
   - Go to Plugins configuration
   - Add new plugin using URL: `http://localhost:3005/manifest.json`

## Development

The plugin is built using:
- TypeScript for type safety
- Vite for building and development
- Penpot Plugin API for integration
- CSS for styling (with theme support)

For detailed development instructions, see [BUILD.md](BUILD.md).

## Configuration

For detailed configuration information, including:
- Vite configuration
- TypeScript configuration
- Plugin manifest
- Package scripts

See [CONFIG.md](CONFIG.md).

## Project Structure

```
penpot-plugin/
├── public/              # Static files
│   ├── index.html      # Plugin UI entry point
│   ├── manifest.json   # Plugin manifest
│   └── style.css      # Plugin styles
├── src/                # Source files
│   ├── main.ts        # UI logic
│   ├── plugin.ts      # Plugin core logic
│   └── style.css      # Source styles
├── build/              # Build output
├── docs/               # Documentation
└── README.md          # This file
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.