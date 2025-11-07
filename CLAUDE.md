# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kori Photography Platform** — A professional photography workflow management system for handling client galleries, asset management, metadata embedding, rights management, and business operations.

**Tech Stack:**
- **Backend:** Fastify (Node.js), Prisma ORM, PostgreSQL
- **Frontend:** React 18, Vite, React Router v7, Tailwind CSS
- **Monorepo:** pnpm workspaces with `apps/api` and `apps/web`

---

## Essential Commands

### Development
```bash
# Start both API and web dev servers in parallel
pnpm dev

# Start only API server (port 3001)
pnpm dev:api

# Start only web server (port 3000)
pnpm dev:web
```

### Database Operations
```bash
# Generate Prisma client after schema changes
pnpm db:generate

# Create and apply migration
pnpm db:migrate

# Seed database with test data
pnpm db:seed

# Open Prisma Studio (database GUI)
pnpm db:studio

# Reset database (⚠️ destructive - drops all data)
pnpm db:reset

# Push schema changes without creating migration (dev only)
pnpm --filter @kori/api db:push

# Deploy migrations to production
pnpm --filter @kori/api db:migrate:prod
```

### Build & Type Checking
```bash
# Build both apps for production
pnpm build

# Type check all TypeScript files
pnpm typecheck

# Lint and auto-fix
pnpm lint:fix
```

### Testing
```bash
# Run all tests (currently placeholder)
pnpm test
```

---

## Architecture

### Monorepo Structure

```
kori_web_stable/
├── apps/
│   ├── api/              # Fastify backend (port 3001)
│   │   ├── src/
│   │   │   ├── routes/   # API route handlers (galleries, auth, assets, etc.)
│   │   │   ├── services/ # Business logic (gallery, auth, metadata, etc.)
│   │   │   ├── middleware/
│   │   │   ├── schemas/  # Validation schemas
│   │   │   ├── utils/
│   │   │   ├── server.ts # Fastify server setup (CORS, security, plugins)
│   │   │   └── index.ts  # Entry point
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── uploads/      # Local file storage (RAW, EDIT, VIDEO)
│   │
│   └── web/              # React frontend (port 3000)
│       ├── src/
│       │   ├── routes/   # File-based routes (admin, gallery)
│       │   ├── components/
│       │   │   ├── gallery/   # GridTheme, Tile, Lightbox, UploadZone
│       │   │   ├── ui/        # Shadcn components
│       │   │   └── layout/    # Header, Sidebar
│       │   ├── lib/      # API client, utilities
│       │   └── hooks/    # React hooks
│       └── public/
│
├── config/
│   └── env.js            # Zod-validated environment variables
│
├── docs/
│   └── adr/              # Architecture Decision Records
│
└── Build Prompts/        # Project requirements and specifications
```

### Data Flow Architecture

**Asset Upload & Management:**
1. Client uploads file via `UploadZone` component
2. POST `/admin/assets/upload` → `assets.ts` service
3. Sharp processes image (thumbnail generation, optimization)
4. ExifTool extracts EXIF/IPTC metadata
5. File stored in `uploads/{category}/{hash}.{ext}`
6. Asset record created in Prisma database
7. Asset can be added to galleries via `addAssetsToGallery()`

**Gallery Viewing:**
1. Admin route: `/admin/galleries/[id]` → displays `GridTheme` with `Tile` components
2. Public route: `/gallery/[token]` → password-protected public view
3. Lightbox overlay for full-screen photo viewing with zoom/pan
4. Favorites system using `Set<string>` for O(1) lookups
5. Infinite scroll with Intersection Observer (12 items per page)

**Authentication & Sessions:**
- Cookie-based sessions via `@fastify/cookie` and `@fastify/session`
- Password hashing with `argon2`
- Credentials mode: `include` (requires CORS credentials: true)

**File Delivery:**
- **Current:** Direct serve from API via `@fastify/static` at `/uploads/*`
- **Future:** Planned migration to Cloudflare R2 + CDN (see ADR 001)

---

## Key Architectural Patterns

### Database Schema Highlights

**Core Models:**
- `AdminUser` — System users (photographers/admins)
- `Client` — Customer records
- `Asset` — Photos/videos (RAW, EDIT, VIDEO categories)
- `Gallery` — Photo collections with token-based sharing
- `GalleryAsset` — Join table (galleries ↔ assets) with `sortOrder`, `isFavorite`
- `RightsPreset` — Copyright metadata templates
- `Release` — Model/property releases
- `Proposal` — Client proposals
- `Contract` — Signed contracts
- `Invoice` — Billing records
- `JournalEntry` — Accounting journals

**Important Relationships:**
- Gallery has many Assets through `GalleryAsset` join table
- `GalleryAsset.sortOrder` controls photo ordering (drag-and-drop reordering)
- `GalleryAsset.isFavorite` for client selections
- Gallery passwords are hashed (bcrypt)
- Gallery tokens are unique, short URLs for sharing

### Frontend State Management

**Gallery System:**
- `useState` for local state (no global state library yet)
- Favorites stored as `Set<string>` for efficient lookups
- Real-time sync between grid view and lightbox
- Optimistic updates for favorite toggles
- Settings persist in component state (not localStorage yet)

**API Integration:**
- All API calls in `apps/web/src/lib/api.ts`
- Uses `credentials: 'include'` for cookie-based auth
- Error handling with try-catch and user-facing messages
- Fallback to mock data on API errors (development only)

### Metadata Embedding System

**Tools:**
- `exiftool-vendored` for reading/writing IPTC/XMP
- `exifr` for fast EXIF reading
- `sharp` for image processing

**Workflow:**
1. Extract existing metadata on upload
2. Store in `Asset.metadata` JSONB field
3. Admin can edit via metadata panel
4. Batch operations for multiple files
5. Rights presets for copyright templates
6. Re-embed metadata before client delivery

---

## Critical CORS Configuration

**⚠️ CORS Setup (apps/api/src/server.ts):**

The API uses `credentials: true` for cookie-based auth. The CORS origin **must be a string or array**, not a callback function:

```typescript
await fastify.register(cors, {
  origin: env.CORS_ORIGIN.split(',').map(o => o.trim()),  // ✅ Correct
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**❌ Do NOT use callback-based origin** — it causes `Access-Control-Allow-Credentials` header to be empty.

**Environment:**
- Development: `CORS_ORIGIN=http://localhost:3000`
- Production: Set to actual domain

---

## Component Architecture

### Gallery Components (`apps/web/src/components/gallery/`)

**GridTheme.tsx** — Main gallery grid
- Responsive columns (2-6 based on viewport)
- Infinite scroll with Intersection Observer
- Keyboard navigation (arrows, Home, End)
- Drag-and-drop reordering via `@dnd-kit`
- Selection mode for bulk operations
- Staggered fade-in animations

**Tile.tsx** — Individual photo tile
- Aspect ratio modes (square, portrait, landscape, original)
- Favorite button overlay
- Caption display (always, hover, never)
- Cover photo indicator
- Context menu (set cover, delete)
- Focus indicators for keyboard nav

**Lightbox.tsx** — Full-screen photo viewer
- Zoom controls (click, double-click, wheel, pinch)
- Pan when zoomed (mouse drag, touch swipe)
- Keyboard shortcuts (arrows, Z, I, Esc)
- Metadata sidebar with EXIF/IPTC
- Next/previous navigation
- Favorite toggle synced with grid
- Download button
- Share link copy

**UploadZone.tsx** — Drag-and-drop uploader
- Multi-file selection
- Progress tracking
- Preview thumbnails
- Auto-refresh gallery on complete

---

## Development Workflow

### Making Database Changes

1. Edit `apps/api/prisma/schema.prisma`
2. Generate Prisma client: `pnpm db:generate`
3. Create migration: `pnpm db:migrate` (prompts for name)
4. Update TypeScript imports if model changed
5. Update seed file if needed: `apps/api/prisma/seed.ts`

### Adding New API Routes

1. Create route file in `apps/api/src/routes/` (e.g., `myFeature.ts`)
2. Define route with Fastify schema validation
3. Add business logic in `apps/api/src/services/myFeature.ts`
4. Register route in `apps/api/src/routes/index.ts`
5. Add client function in `apps/web/src/lib/api.ts`

### Adding New Frontend Routes

Routes use React Router v7 file-based routing:
- Admin routes: `apps/web/src/routes/admin/[feature]/[id].tsx`
- Public routes: `apps/web/src/routes/gallery/[token].tsx`

### Environment Setup

1. Copy `apps/api/.env.example` to `apps/api/.env`
2. Set `DATABASE_URL` (PostgreSQL connection string)
3. Generate `SESSION_SECRET`: `openssl rand -base64 32`
4. Run `pnpm db:migrate` to apply schema
5. Run `pnpm db:seed` for test data

---

## Progress Tracking

**Completed Features (see PROGRESS_TRACKER.md):**
- ✅ AG1: Gallery grid display with infinite scroll
- ✅ AG2: Lightbox viewer with zoom/pan
- ✅ GS1: Gallery sharing with password protection
- ✅ Persistent favorites system

**In Progress:**
- 🔄 AG3: Gallery list page and CRUD operations

**Planned:**
- ⏳ Photo upload system with batch processing
- ⏳ Client gallery public view
- ⏳ Metadata embedding workflow
- ⏳ Rights management and releases
- ⏳ Proposal and contract generation
- ⏳ Invoice and payment tracking

---

## Build Prompts Reference

The `Build Prompts/` folder contains detailed specifications for:
- Gallery hosting and delivery system
- Metadata/IPTC embedding methods
- Contract/document templates
- Invoice automation
- Accounting/bookkeeping integration
- Cloud delivery architecture

**Photography-system-build-expert agent** — Use this specialized agent (`.claude/agents/photography-system-build-expert.md`) for questions about build architecture and Build Prompts requirements.

---

## Known Issues & Gotchas

1. **Image paths:** Frontend constructs URLs as `http://localhost:3001/uploads/{category}/{filename}`. Ensure API is running for images to load.

2. **Prisma BigInt serialization:** `BigInt.prototype.toJSON` is overridden in `apps/api/src/index.ts` to serialize as strings.

3. **Mock data fallback:** If API fails, gallery page shows Lorem Picsum placeholders. Check console for `❌ Failed to load gallery` errors.

4. **React strict mode:** In development, effects run twice. This causes duplicate API calls visible in console logs.

5. **File uploads:** Currently limited to memory storage. Large batches may cause memory issues. Consider streaming uploads for production.

6. **Session cookies:** Require `credentials: 'include'` in fetch calls. Ensure CORS is properly configured.

---

## Key Files to Reference

- **PROGRESS_TRACKER.md** — Detailed feature completion log
- **PROJECT_HANDOVER.md** — Comprehensive project documentation
- **docs/adr/001-delivery-substrate.md** — CDN/storage architecture decision
- **env-reference.md** — Environment variable documentation
- **apps/api/prisma/schema.prisma** — Database schema
- **apps/web/src/lib/api.ts** — API client functions
- **config/env.js** — Environment validation with Zod

---

## ADR Reference

**ADR 001: Media Delivery Substrate**
- Current: Self-hosted direct serve from API
- Future: Planned migration to Cloudflare R2 + CDN
- Triggers: >500GB bandwidth/month, >20 active clients
- Zero egress fees with R2 vs AWS S3 ($85/month savings at 1TB)

---

## Observability

**Metrics endpoint:** `http://localhost:3001/metrics` (Prometheus format)
**Health checks:**
- `/healthz` — Basic liveness
- `/readyz` — Readiness (DB connection)
- `/version` — Version info

**Logging:**
- Pino logger with pretty-print in development
- Log level controlled by `LOG_LEVEL` env var
- Request IDs for tracing (`reqId`)

---

## Security Considerations

- **Password hashing:** Use `argon2` (not bcrypt) for new code
- **SQL injection:** Prisma parameterizes queries automatically
- **CSRF:** Not yet implemented (TODO for production)
- **Rate limiting:** 100 requests/minute per IP via `@fastify/rate-limit`
- **Helmet:** CSP headers configured in `server.ts`
- **File uploads:** No validation on file type yet (security gap)
- **Signed URLs:** Not implemented yet (planned for R2 migration)

---

## Performance Notes

- **Image optimization:** Sharp generates thumbnails on upload (600x400)
- **Lazy loading:** Images use native `loading="lazy"` attribute
- **Infinite scroll:** Loads 12 items per page, Intersection Observer
- **Database indexes:** Check `schema.prisma` for `@@index` on frequently queried fields
- **Bundle size:** React production build ~150KB gzipped (Vite optimized)

---

## Notes for Future Claude Instances

1. **Always restart API** after changing `server.ts`, `env.js`, or Prisma schema
2. **Check CORS errors first** — Most fetch failures are CORS misconfiguration
3. **Read PROGRESS_TRACKER.md** before implementing new gallery features
4. **Consult Build Prompts** for business requirements before coding
5. **Use TodoWrite tool** to track multi-step tasks and keep user informed
6. **Test on real mobile devices** — DevTools mobile emulation has limitations
7. **Check git status** — Many files are currently modified (see gitStatus above)
8. **pnpm, not npm** — This project requires pnpm for workspace management
