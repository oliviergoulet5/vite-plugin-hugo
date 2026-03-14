# vite-plugin-hugo

Integrate Hugo with Vite for modern static site development.

> [!WARNING]
> This project is experimental and not yet ready for production use.

## Features

- **Dev Mode**: Watch and rebuild Vite assets while Hugo serves content
- **Build Mode**: Output assets to Hugo's public directory
- **Hugo as Server**: Use Hugo's development server with Vite assets
- **TypeScript Support**: Full TypeScript support out of the box

## Installation

```bash
npm install vite-plugin-hugo --save-dev
```

## Quick Start

### 1. Set Up Hugo

Ensure you have a Hugo site with the following structure:

```
my-site/
├── content/
├── layouts/
│   └── index.html
├── public/
└── src/                  # Your Vite assets
    ├── main.ts
    └── style.scss
```

### 2. Configure Vite

```ts
// vite.config.ts
import { defineConfig } from "vite";
import hugo from "vite-plugin-hugo";

export default defineConfig({
  plugins: [hugo()],
});
```

### 3. Update Hugo Layouts

Reference your Vite assets in your Hugo templates:

```html
<!-- layouts/index.html -->
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/assets/main.css">
</head>
<body>
  {{ .Content }}
  <script type="module" src="/assets/main.js"></script>
</body>
</html>
```

## Usage

### Development

Run Hugo server in one terminal:

```bash
hugo server
```

Run Vite in another terminal:

```bash
npm run dev
```

Vite will watch your `src/` files and rebuild to `public/assets/`. Hugo's live reload will refresh the browser.

### Production Build

```bash
npm run build
```

This outputs your Vite assets to `public/assets/`, ready for deployment with Hugo.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `watch` | `boolean` | `true` | Watch src files and rebuild on changes |

```ts
hugoPlugin({
  watch: false  // Disable file watching
})
```

## How It Works

- **Dev Mode**: Configures Vite to build assets to `public/assets/` with file watching enabled
- **Build Mode**: Outputs production-ready assets to `public/assets/`
- Hugo serves both your content and Vite assets from the same `public/` directory

## Example

See the `example/` directory for a complete working example.

## License

MIT
