# Quick Reference: Adding a New Tenant

## Prerequisites Checklist

- [ ] Frontend site exists in `../Frontendsites/<folder-name>`
- [ ] Frontend follows Next.js 15 structure with `sections` arrays
- [ ] Components use standard naming (Hero, RichText, Gallery, CTA, etc.)

## Step-by-Step Commands

### 1. Extract Sync Pack
```bash
pnpm extract:sync -- \
  --tenant <tenant-code> \
  --projectName "<Display Name>" \
  --domains "domain1.com,domain2.com" \
  --frontendPath "../Frontendsites/<folder-name>"
```

### 2. Create Tenant Blocks
```bash
# Create directory structure
mkdir -p src/tenants/<tenant-code>/blocks
mkdir -p src/tenants/<tenant-code>/renderers

# Create block files (see ADD_NEW_TENANT_FLOW.md for templates)
# - hero.ts
# - richText.ts
# - imageGallery.ts
# - cta.ts
# - genericSection.ts
```

### 3. Register Tenant
- Update `src/tenantRegistry.ts`:
  - Add import: `import { <tenant>Blocks } from './tenants/<tenant-code>'`
  - Add to `TENANTS` array
  - Add to `tenantBlocks` array

- Update `src/utils/tenantBlocksLoader.ts`:
  - Add case in `getTenantBlocks()` switch
  - Add to `getTenantCodesWithBlocks()` array

### 4. Generate Types
```bash
pnpm generate:types
```

### 5. Sync Site
```bash
pnpm sync:site -- --tenant <tenant-code>
```

### 6. Configure CORS
Update `src/middleware.ts` - add domains to `allowedOrigins` array

### 7. Create Users
Via Payload Admin UI: `/admin` → Users → Create New

### 8. Test
- [ ] Admin access works
- [ ] Frontend API calls work
- [ ] CORS configured correctly
- [ ] Content visible and editable

## File Locations

| Item | Location |
|------|----------|
| Sync Pack | `src/sync-pack/<tenant-code>/` |
| Tenant Blocks | `src/tenants/<tenant-code>/blocks/` |
| Tenant Registry | `src/tenantRegistry.ts` |
| Blocks Loader | `src/utils/tenantBlocksLoader.ts` |
| CORS Config | `src/middleware.ts` |

## Common Block Types

| Component Name | Block Slug | File |
|----------------|------------|------|
| Hero, PageHero | `<tenant>.hero` | `blocks/hero.ts` |
| RichText, RichTextSection | `<tenant>.richText` | `blocks/richText.ts` |
| Gallery, ImageGrid | `<tenant>.imageGallery` | `blocks/imageGallery.ts` |
| CTA, CTASection | `<tenant>.cta` | `blocks/cta.ts` |
| Unknown | `<tenant>.genericSection` | `blocks/genericSection.ts` |

## Naming Conventions

- **Tenant Code**: lowercase, kebab-case (e.g., `gymnastics-kefalonia`)
- **Block Slug**: `<tenant-code>.<block-name>` (e.g., `gymnastics-kefalonia.hero`)
- **Variable Names**: camelCase (e.g., `gymnasticsKefaloniaBlocks`)
- **Type Names**: PascalCase (e.g., `GymnasticsKefaloniaBlockType`)

## Troubleshooting Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Blocks not appearing | Run `pnpm generate:types` and restart server |
| CORS errors | Add domain to `middleware.ts` allowedOrigins |
| Tenant not found | Check tenant code matches exactly (case-sensitive) |
| Sync fails | Check `manifest.json` in sync-pack for errors |
| Media not loading | Verify media uploaded during sync, check URLs |

## Example: Complete Flow

```bash
# Tenant: gymnastics-kefalonia
# Frontend: ../Frontendsites/gymnastics-kefalonia-website

# 1. Extract
pnpm extract:sync -- \
  --tenant gymnastics-kefalonia \
  --projectName "Gymnastics Kefalonia" \
  --domains "gymnastics-kefalonia.gr,www.gymnastics-kefalonia.gr" \
  --frontendPath "../Frontendsites/gymnastics-kefalonia-website"

# 2. Create blocks (manual - see templates in ADD_NEW_TENANT_FLOW.md)

# 3. Register (update tenantRegistry.ts and tenantBlocksLoader.ts)

# 4. Generate types
pnpm generate:types

# 5. Sync
pnpm sync:site -- --tenant gymnastics-kefalonia

# 6. Configure CORS (update middleware.ts)

# 7. Create users (via admin UI)

# 8. Test
```

## See Also

- **Full Documentation**: `docs/ADD_NEW_TENANT_FLOW.md`
- **Sync Pack Details**: `src/sync-pack/README.md`
- **Deployment**: `DEPLOYMENT.md`
