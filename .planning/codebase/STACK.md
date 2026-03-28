# Technology Stack

**Analysis Date:** 2026-03-28

## Languages

**Primary:**
- TypeScript ~5.9.3 - Application code, type safety throughout
- JSX/TSX - React components using React 19 syntax

**Secondary:**
- JavaScript - Configuration files (vite.config.ts, eslint.config.js)

## Runtime

**Environment:**
- Node.js >=20.0.0 (required)

**Package Manager:**
- npm - Dependency management
- Lockfile: package-lock.json (present)

## Frameworks

**Core:**
- React 19.2.4 - UI library with concurrent features
- React DOM 19.2.4 - DOM rendering

**State Management:**
- Zustand 5.0.11 - Lightweight store with persist middleware
  - Implementation: `src/store/gameStore.ts` with slice-based architecture
  - Storage: 'cozy-garden-save' localStorage key

**Styling:**
- Tailwind CSS 4.2.1 - Utility-first CSS framework
- @tailwindcss/postcss 4.2.1 - PostCSS integration
- Autoprefixer 10.4.27 - Browser vendor prefixes

**Build & Dev:**
- Vite 8.0.0 - Frontend build tool and dev server
- @vitejs/plugin-react 6.0.0 - React fast refresh plugin

**Linting & Code Quality:**
- ESLint 9.39.4 - JavaScript/TypeScript linting
  - @eslint/js 9.39.4 - Core ESLint rules
  - typescript-eslint 8.56.1 - TypeScript-specific linting
  - eslint-plugin-react-hooks 7.0.1 - React Hooks rules
  - eslint-plugin-react-refresh 0.5.2 - Vite refresh compatibility

**Type Checking:**
- TypeScript compiler - Full type checking in build pipeline
- @types/react 19.2.14 - React type definitions
- @types/react-dom 19.2.3 - React DOM type definitions
- @types/node 24.12.0 - Node.js type definitions (for scripts)

## Key Dependencies

**Critical:**
- appwrite 23.0.0 - Backend-as-a-Service platform
  - Used for: User accounts, data persistence, server-side logic
  - SDK Client: `src/services/appwrite.ts`
  - Configuration: Environment variables

- zustand 5.0.11 - Immutable state management
  - Used for: Game state, persistence layer
  - Store location: `src/store/gameStore.ts`

- react 19.2.4, react-dom 19.2.4 - UI rendering
  - Used for: Component-based UI architecture

**Infrastructure:**
- tailwindcss 4.2.1 - Styling system
- autoprefixer 10.4.27 - CSS compatibility
- vite 8.0.0 - Build optimization and HMR

## Configuration

**Environment:**
- Vite-based environment variables (VITE_ prefix)
- `.env` file (not committed) for local development
- `.env.example` provides template

**Required Environment Variables:**
- `VITE_APPWRITE_ENDPOINT` - Appwrite server endpoint (default: https://nyc.cloud.appwrite.io/v1)
- `VITE_APPWRITE_PROJECT_ID` - Appwrite project ID (default: infinity-fg)

**Build Configuration:**
- `vite.config.ts` - Vite build config with React plugin
- `tsconfig.json` - Root TypeScript config with project references
- `tsconfig.app.json` - Application TypeScript settings (ES2023, JSX, bundler mode)
- `tsconfig.node.json` - Build tool TypeScript settings
- `eslint.config.js` - ESLint flat config with React and TypeScript support

## Platform Requirements

**Development:**
- Node.js >=20.0.0
- npm package manager
- Modern browser with ES2023 support

**Production:**
- Static hosting (Vite-compiled SPA)
- Appwrite backend instance or cloud account (for data persistence)
- Browser with ES2023 support (Chrome, Firefox, Safari, Edge modern versions)

## Build Outputs

**Development:**
- `npm run dev` - Vite dev server with HMR
- `npm run build` - Production bundle to `dist/`
- Type checking: `tsc -b` (separate build step)
- Linting: `npm run lint` runs ESLint

## Build Pipeline

**Scripts:**
- `dev` - Start Vite dev server
- `build` - Type-check + Vite production build
- `lint` - ESLint validation
- `preview` - Serve production build locally
- `build:pipeline` - Custom GSD orchestrator (tsx scripts/orchestrator.ts)
- `simulate:qa` - QA simulation runner
- `simulate:progression` - Progression simulation
- `simulate:balance` - Game balance simulation
- `simulate:roi` - Machine ROI analysis
- `validate:system` - Full validation suite (lint + build + strict tests)

## Browser Support

**Target:** ES2023 (modern browsers)
- React 19 requires modern JavaScript features
- No IE11 or legacy browser support
- Polyfills: None specified (expected to use native features)

---

*Stack analysis: 2026-03-28*
