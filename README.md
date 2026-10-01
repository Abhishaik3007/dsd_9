# Tablewave — QR Code Dine-in & Restaurant Management Platform

Tablewave is an all-in-one restaurant ordering and guest management ecosystem designed for modern hospitality venues. It enables seamless contactless QR ordering for guests, real-time kitchen display tickets, menu management, and multi-tenant SaaS administration.

---

## Architecture & Technology Stack

- **Monorepo**: PNPM Workspaces, Node.js 20+, TypeScript 5.9
- **Frontend App (`artifacts/tablewave`)**:
  - React 19, Vite, Tailwind CSS v4, Wouter routing
  - TanStack React Query for async state management
  - Radix UI & Lucide / Remix Icons
- **Backend API Server (`artifacts/api-server`)**:
  - Express 5 REST API with Pino logging
  - Drizzle ORM + PostgreSQL
  - Zod validation and type-safe contracts generated from OpenAPI
- **Shared Libraries (`lib/`)**:
  - `lib/db`: Database schema definitions, Drizzle migrations, and client
  - `lib/api-spec`: OpenAPI 3.1 specification
  - `lib/api-client-react`: Generated React Query hooks & types (Orval)
  - `lib/api-zod`: Generated Zod schemas and TypeScript models

---

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20 or later)
- [pnpm](https://pnpm.io/) (`corepack enable && corepack prepare pnpm@latest --activate`)
- PostgreSQL database (optional for demo / mock mode)

### 2. Installation
```bash
pnpm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local` and set your credentials:
```bash
cp .env.example .env.local
```

### 4. Running the Development Environment
Run both the API server (port 5000) and frontend client (port 3000) concurrently:
```bash
pnpm run dev
```

Or run individual services:
```bash
# Frontend only (http://localhost:3000)
pnpm --filter @workspace/tablewave run dev

# Backend only (http://localhost:5000)
pnpm --filter @workspace/api-server run dev
```

---

## Available Commands

| Command | Description |
| :--- | :--- |
| `pnpm run dev` | Launch both frontend and backend concurrently |
| `pnpm run typecheck` | Run full TypeScript typechecks across all workspace packages |
| `pnpm run build` | Typecheck and build production bundles for all packages |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API client hooks and schemas from `openapi.yaml` |
| `pnpm --filter @workspace/db run push` | Push Drizzle schema updates to PostgreSQL |

## Deploying to Vercel

This repository is pre-configured for one-click deployment on [Vercel](https://vercel.com).

### Quick Setup:
1. Import this repository into Vercel.
2. Vercel will automatically detect `vercel.json` with the following presets:
   - **Framework Preset**: Vite
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `artifacts/tablewave/dist/public`
3. **Environment Variables** (Optional):
   - `DATABASE_URL`: Your PostgreSQL connection string (e.g. Neon, Supabase, Vercel Postgres). If omitted, the app runs in in-memory multi-tenant demonstration mode.
   - `SESSION_SECRET`: A secure random string for session tokens.
4. Click **Deploy**.

---

## License
MIT
