# Flow: Adding a New Tenant and Frontend Site

This document outlines the complete step-by-step process for adding a new tenant and integrating a new frontend site into the Payload CMS multi-tenant system.

## 🛡️ Safety First: Your Data is Protected

**IMPORTANT:** Before you begin, know that this process is **completely safe** and **cannot affect existing tenants' data**.

The system uses multiple layers of protection:
- ✅ **Tenant-scoped queries** - Every operation filters by tenant ID
- ✅ **Database constraints** - Unique constraints prevent conflicts
- ✅ **Access control** - Users can only access their tenant's content
- ✅ **Read-only tenant fields** - Cannot accidentally move content between tenants

**For detailed safety information, see:** [`TENANT_SAFETY_GUARANTEES.md`](./TENANT_SAFETY_GUARANTEES.md)

You can safely add new tenants without any risk to existing data. The sync process only affects the specific tenant you're adding.

## Overview

The process involves:
1. **Frontend Site Preparation** - Ensuring the frontend is ready for extraction
2. **Sync Pack Extraction** - Converting the frontend into a CMS-compatible format
3. **Tenant Block Setup** - Creating tenant-specific content blocks
4. **CMS Configuration** - Registering the tenant in the CMS
5. **Site Synchronization** - Importing the frontend content into CMS
6. **CORS Configuration** - Allowing frontend to access CMS API
7. **User Setup** - Creating tenant-specific users
8. **Testing & Verification** - Ensuring everything works

---

## Step 1: Frontend Site Preparation

### 1.1 Verify Frontend Structure

Ensure your frontend site follows the expected Next.js 15 structure:

```
frontend-<tenant-name>/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Homepage (required)
│   │   ├── about/
│   │   │   └── page.tsx          # Static routes
│   │   ├── contact/
│   │   │   └── page.tsx
│   │   └── ...
│   └── components/
│       ├── navigation.tsx        # Navigation component (for header extraction)
│       └── footer.tsx            # Footer component (for footer extraction)
└── public/                       # Static assets
```

### 1.2 Verify Page Structure

Each page should have a `sections` array with components:

```tsx
// src/app/page.tsx
export default function HomePage() {
  const sections = [
    <Hero key="hero" title="Welcome" />,
    <RichText key="text" content="..." />,
    // ... more sections
  ]
  
  return (
    <div>
      {sections.map((section) => section)}
    </div>
  )
}
```

### 1.3 Component Naming

Ensure components use standard names that the extractor recognizes:
- `Hero`, `PageHero` → Will map to `<tenant>.hero`
- `RichText`, `RichTextSection` → Will map to `<tenant>.richText`
- `Gallery`, `ImageGrid`, `ImageGallery` → Will map to `<tenant>.imageGallery`
- `CTA`, `CTASection`, `CTABanner` → Will map to `<tenant>.cta`
- Unknown components → Will map to `<tenant>.genericSection`

---

## Step 2: Extract Sync Pack from Frontend

### 2.1 Navigate to CMS Repository

```bash
cd cmsftiaxesite
```

### 2.2 Run Sync Pack Extractor

```bash
pnpm extract:sync -- \
  --tenant <tenant-code> \
  --projectName "<Project Display Name>" \
  --domains "domain1.com,domain2.com" \
  --frontendPath "../Frontendsites/<frontend-folder-name>"
```

**Example:**
```bash
pnpm extract:sync -- \
  --tenant gymnastics-kefalonia \
  --projectName "Gymnastics Kefalonia" \
  --domains "gymnastics-kefalonia.gr,www.gymnastics-kefalonia.gr" \
  --frontendPath "../Frontendsites/gymnastics-kefalonia-website"
```

### 2.3 Verify Extraction Output

Check that the sync pack was created:

```bash
ls src/sync-pack/<tenant-code>/
```

You should see:
- `site.json` - Tenant configuration
- `header.json` - Header/navigation data
- `footer.json` - Footer data
- `menu.json` - Menu structure
- `pages/` - Directory with page JSON files
- `assets-list.json` - Referenced assets
- `manifest.json` - Extraction summary

### 2.4 Review Manifest

Check `src/sync-pack/<tenant-code>/manifest.json` for any warnings or issues.

---

## Step 3: Create Tenant-Specific Blocks

### 3.1 Create Tenant Directory Structure

```bash
mkdir -p src/tenants/<tenant-code>/blocks
mkdir -p src/tenants/<tenant-code>/renderers
```

**Example:**
```bash
mkdir -p src/tenants/gymnastics-kefalonia/blocks
mkdir -p src/tenants/gymnastics-kefalonia/renderers
```

### 3.2 Create Block Definitions

For each component type found in your frontend, create a block definition file:

**Example: `src/tenants/<tenant-code>/blocks/hero.ts`**

```typescript
import type { Block } from 'payload'

export const <tenant>Hero: Block = {
  slug: '<tenant-code>.hero',
  labels: {
    singular: 'Hero',
    plural: 'Heroes',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'ctaLabel',
      type: 'text',
    },
    {
      name: 'ctaUrl',
      type: 'text',
    },
  ],
}
```

**Repeat for all block types:**
- `hero.ts`
- `richText.ts`
- `imageGallery.ts`
- `cta.ts`
- `genericSection.ts` (for unknown components)
- ... (any other component types)

### 3.3 Create Tenant Index File

**`src/tenants/<tenant-code>/index.ts`**

```typescript
import { <tenant>Hero } from './blocks/hero'
import { <tenant>RichText } from './blocks/richText'
import { <tenant>ImageGallery } from './blocks/imageGallery'
import { <tenant>Cta } from './blocks/cta'
// ... import all blocks

export const tenantCode = '<tenant-code>'

export const <tenant>Blocks = [
  <tenant>Hero,
  <tenant>RichText,
  <tenant>ImageGallery,
  <tenant>Cta,
  // ... all blocks
]
```

### 3.4 Create Tenant Schema File (Optional)

**`src/tenants/<tenant-code>/schema.ts`**

```typescript
export const tenantCode = '<tenant-code>'

export const allowedBlocks = [
  '<tenant-code>.hero',
  '<tenant-code>.richText',
  '<tenant-code>.imageGallery',
  '<tenant-code>.cta',
] as const

export type <Tenant>BlockType = (typeof allowedBlocks)[number]
```

### 3.5 Create Frontend Renderers (Optional)

If you need custom frontend rendering, create renderer components:

**`src/tenants/<tenant-code>/renderers/hero.tsx`**

```tsx
import type { <Tenant>HeroBlock } from '@/payload-types'

export function <Tenant>HeroRenderer({ data }: { data: <Tenant>HeroBlock }) {
  return (
    <section className="hero">
      <h1>{data.title}</h1>
      {data.subtitle && <p>{data.subtitle}</p>}
      {/* ... render hero */}
    </section>
  )
}
```

**`src/tenants/<tenant-code>/renderers/index.ts`**

```typescript
export { <Tenant>HeroRenderer } from './hero'
// ... export all renderers
```

---

## Step 4: Register Tenant in CMS

### 4.1 Update Tenant Registry

**`src/tenantRegistry.ts`**

Add import and register tenant:

```typescript
import { <tenant>Blocks } from './tenants/<tenant-code>'

export const TENANTS = ['kallitechnia', 'ftiaxesite', '<tenant-code>'] as const

export const tenantBlocks = [
  ...kallitechniaBlocks,
  ...ftiaxesiteBlocks,
  ...<tenant>Blocks,  // Add new tenant blocks
]
```

### 4.2 Update Tenant Blocks Loader

**`src/utils/tenantBlocksLoader.ts`**

Add case for new tenant:

```typescript
import { <tenant>Blocks } from '../tenants/<tenant-code>'

export function getTenantBlocks(tenantCode: string): Block[] {
  switch (tenantCode) {
    case 'kallitechnia':
      return kallitechniaBlocks
    case 'ftiaxesite':
      return []
    case '<tenant-code>':  // Add new case
      return <tenant>Blocks
    default:
      console.warn(`[TenantBlocksLoader] Unknown tenant code: ${tenantCode}`)
      return []
  }
}

export function getTenantCodesWithBlocks(): string[] {
  return ['kallitechnia', 'ftiaxesite', '<tenant-code>']  // Add to array
}
```

### 4.3 Generate Types

After making changes, regenerate Payload types:

```bash
pnpm generate:types
```

---

## Step 5: Sync Site to CMS

### 5.1 Run Site Sync Script

```bash
pnpm sync:site -- --tenant <tenant-code>
```

**Example:**
```bash
pnpm sync:site -- --tenant gymnastics-kefalonia
```

### 5.2 What the Sync Does

The sync script will:
1. ✅ Create/update the **Tenant** record in CMS
2. ✅ Create/update the **Navigation Menu**
3. ✅ Create/update the **Header**
4. ✅ Create/update the **Footer**
5. ✅ Upload and hydrate **Media** files
6. ✅ Create/update all **Pages** with blocks
7. ✅ Create/update the **Homepage**

### 5.3 Verify Sync Success

Check the console output for:
- ✅ Tenant created/updated
- ✅ Navigation menu created
- ✅ Pages synced (count)
- ✅ No errors

---

## Step 6: Configure CORS

### 6.1 Update Middleware

**`src/middleware.ts`**

Add frontend domains to allowed origins:

```typescript
const allowedOrigins = [
  'https://www.kallitechnia.gr',
  'https://kallitechnia.gr',
  'https://www.<tenant-domain>.gr',      // Add new domains
  'https://<tenant-domain>.gr',           // Add new domains
  'http://localhost:3000',
  'http://localhost:3001',
  ...envOrigins,
]
```

### 6.2 Alternative: Environment Variable

You can also configure via `.env.local`:

```bash
CORS_ORIGINS=https://www.<tenant-domain>.gr,https://<tenant-domain>.gr
```

---

## Step 7: Create Tenant Users

### 7.1 Access Payload Admin

Navigate to: `http://localhost:3000/admin`

### 7.2 Create User

1. Go to **Users** collection
2. Click **Create New**
3. Fill in:
   - **Email**: user@tenant-domain.com
   - **Password**: (set secure password)
   - **Tenant**: Select the new tenant from dropdown
   - **Roles**: Select appropriate roles (admin, editor, user)
4. Click **Save**

### 7.3 Create Super Admin (Optional)

To create a super admin that can manage all tenants:
1. Create user as above
2. **Leave Tenant field empty**
3. Set **Roles** to include `admin`

---

## Step 8: Testing & Verification

### 8.1 Test CMS Admin Access

1. Log in to Payload admin: `http://localhost:3000/admin`
2. Verify tenant user can see only their tenant's content
3. Verify super admin can see all tenants

### 8.2 Test Frontend API Access

From your frontend, test API calls:

```typescript
// Test fetching pages
const response = await fetch('http://localhost:3000/api/pages?where[tenant.code][equals]=<tenant-code>')
const data = await response.json()
console.log('Pages:', data)
```

### 8.3 Test CORS

Ensure frontend can make requests:
- Check browser console for CORS errors
- Verify API responses include CORS headers

### 8.4 Verify Content

1. Check that all pages are visible in CMS
2. Verify blocks are correctly structured
3. Test editing a page and saving
4. Verify media files are uploaded and accessible

---

## Step 9: Production Deployment

### 9.1 Update Environment Variables

Ensure production `.env` includes:
- `DATABASE_URI` - Production database
- `PAYLOAD_SECRET` - Production secret
- `CORS_ORIGINS` - Production frontend domains

### 9.2 Deploy CMS

Follow your deployment process (see `DEPLOYMENT.md`)

### 9.3 Run Sync in Production

After deployment, run sync script in production environment:

```bash
# On production server
pnpm sync:site -- --tenant <tenant-code>
```

### 9.4 Verify Production

1. Test CMS admin in production
2. Test frontend API calls from production frontend
3. Verify CORS is working
4. Check that content is accessible

---

## Troubleshooting

> **Safety Concern?** If you're worried about affecting other tenants' data, see [`TENANT_SAFETY_GUARANTEES.md`](./TENANT_SAFETY_GUARANTEES.md) for detailed information about all the safety mechanisms in place.

### Issue: Sync Pack Extraction Fails

**Solution:**
- Check frontend structure matches expected format
- Verify `sections` array exists in pages
- Check `manifest.json` for specific errors
- Ensure component names match expected patterns

### Issue: Blocks Not Appearing in CMS

**Solution:**
- Verify blocks are registered in `tenantRegistry.ts`
- Check `getTenantBlocks()` includes new tenant
- Regenerate types: `pnpm generate:types`
- Restart dev server

### Issue: CORS Errors

**Solution:**
- Verify domains are added to `middleware.ts`
- Check `CORS_ORIGINS` environment variable
- Ensure frontend is using correct CMS API URL
- Check browser console for specific CORS error

### Issue: Tenant Not Found

**Solution:**
- Verify tenant was created in CMS (check Tenants collection)
- Ensure tenant code matches exactly (case-sensitive)
- Check sync script output for errors

### Issue: Media Not Loading

**Solution:**
- Verify media files were uploaded during sync
- Check media collection in CMS
- Ensure media URLs are correct
- Verify CORS allows media domain

---

## Quick Reference Checklist

- [ ] Frontend site prepared with correct structure
- [ ] Sync pack extracted successfully
- [ ] Tenant blocks created and registered
- [ ] Tenant registry updated
- [ ] Types regenerated
- [ ] Site synced to CMS
- [ ] CORS configured
- [ ] Users created
- [ ] Admin access tested
- [ ] Frontend API access tested
- [ ] Production deployment completed

---

## Example: Complete Flow for "gymnastics-kefalonia"

```bash
# 1. Extract sync pack
pnpm extract:sync -- \
  --tenant gymnastics-kefalonia \
  --projectName "Gymnastics Kefalonia" \
  --domains "gymnastics-kefalonia.gr,www.gymnastics-kefalonia.gr" \
  --frontendPath "../Frontendsites/gymnastics-kefalonia-website"

# 2. Create blocks (manual file creation)
# ... create block files in src/tenants/gymnastics-kefalonia/

# 3. Register tenant (update files)
# ... update tenantRegistry.ts and tenantBlocksLoader.ts

# 4. Generate types
pnpm generate:types

# 5. Sync site
pnpm sync:site -- --tenant gymnastics-kefalonia

# 6. Configure CORS (update middleware.ts)
# ... add domains to allowedOrigins

# 7. Create users (via admin UI)
# ... navigate to /admin and create user

# 8. Test
# ... verify everything works
```

---

## Additional Notes

- **Tenant Code**: Must be lowercase, kebab-case (e.g., `gymnastics-kefalonia`)
- **Block Naming**: Always prefix with tenant code (e.g., `gymnastics-kefalonia.hero`)
- **Domain Format**: Include both www and non-www versions
- **Media Upload**: Large media files may take time during sync
- **Type Safety**: Always regenerate types after schema changes

---

## Related Documentation

- `sync-pack/README.md` - Sync pack extractor details
- `DEPLOYMENT.md` - Deployment instructions
- `CMS_HARDENING_README.md` - Security considerations
