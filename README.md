# rokajdnik.com

[![E2E Tests](https://github.com/ajdnik/rokajdnik.com/actions/workflows/e2e.yml/badge.svg)](https://github.com/ajdnik/rokajdnik.com/actions/workflows/e2e.yml)
[![Lighthouse](https://github.com/ajdnik/rokajdnik.com/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/ajdnik/rokajdnik.com/actions/workflows/lighthouse.yml)
[![Deploy to GitHub Pages](https://github.com/ajdnik/rokajdnik.com/actions/workflows/deploy.yml/badge.svg)](https://github.com/ajdnik/rokajdnik.com/actions/workflows/deploy.yml)

Personal blog and portfolio website built with Astro.

## Tech Stack

- [Astro](https://astro.build/) - Static site generator
- [React](https://react.dev/) - Interactive components
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## Getting Started

### Prerequisites

- Node.js 24+ (see `.nvmrc`)

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The site will be available at `http://localhost:4321`.

### Build

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Testing

Run Playwright end-to-end tests:

```bash
npm run test:e2e
```

Run tests with the interactive UI:

```bash
npm run test:e2e:ui
```

Run Lighthouse performance audit:

```bash
npm run test:lighthouse
```

This builds the site, runs Lighthouse against key pages, and reports scores for Performance, Accessibility, Best Practices, and SEO. The process exits with a non-zero code if any score falls below the threshold defined in `scripts/lighthouse.mjs`.

Tests and Lighthouse audits also run automatically on every push and pull request via the [E2E Tests](https://github.com/ajdnik/rokajdnik.com/actions/workflows/e2e.yml) and [Lighthouse](https://github.com/ajdnik/rokajdnik.com/actions/workflows/lighthouse.yml) workflows.

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch via the [Deploy](https://github.com/ajdnik/rokajdnik.com/actions/workflows/deploy.yml) workflow.

Live at: [rokajdnik.com](https://rokajdnik.com)

## License

MIT
