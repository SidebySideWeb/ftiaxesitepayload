# Next Steps: al-anastasiou Frontend Integration

## Current Status ✅

**CMS Side (Complete):**
- ✅ Tenant created in CMS
- ✅ Blocks extracted and synced
- ✅ Navigation menu created
- ✅ Pages created with content blocks
- ✅ CORS configured for `al-anastasiou.gr` domains

**Frontend Side (Needs Work):**
- ⚠️ Frontend is currently **static** (hardcoded content)
- ⚠️ No CMS API integration
- ⚠️ No environment variables configured

---

## What Needs to Happen Before Deployment

### 1. **Connect Frontend to CMS API** (Required)

The frontend needs to fetch data from the CMS instead of using hardcoded content.

**Steps:**

1. **Create API client** (`src/lib/api.ts`)
   - Copy from `frontend-kallitechnia/src/lib/api.ts`
   - Update `TENANT_CODE` to `'al-anastasiou'`
   - Update `CMS_API_URL` to your CMS URL

2. **Update pages to fetch from CMS**
   - Homepage: Fetch from `/api/homepages`
   - Other pages: Fetch from `/api/pages?where[slug][equals]=...`
   - Use `SafeSections` component to render blocks

3. **Create section renderers**
   - Create `src/tenants/al-anastasiou/sections/` directory
   - Create renderers for each block type:
     - `hero.tsx`
     - `richText.tsx`
     - `cta.tsx`
     - `imageGallery.tsx`
     - `genericSection.tsx`

4. **Update layout to fetch navigation/footer**
   - Fetch header/navigation from CMS
   - Fetch footer from CMS

---

## Step-by-Step Integration Guide

### Step 1: Set Up Environment Variables

Create `.env.local` in the frontend project:

```bash
# CMS API URL (update with your production URL)
NEXT_PUBLIC_CMS_URL=https://cms.ftiaxesite.gr

# Or for local development:
# NEXT_PUBLIC_CMS_URL=http://localhost:3000
```

### Step 2: Install Dependencies (if needed)

```bash
cd ../Frontendsites/al-anastasiou
pnpm install
```

### Step 3: Create API Client

Copy the API client from kallitechnia and adapt it:

```typescript
// src/lib/api.ts
const CMS_API_URL = process.env.NEXT_PUBLIC_CMS_URL || 'https://cms.ftiaxesite.gr'
const TENANT_CODE = 'al-anastasiou'

// ... rest of the API functions
```

### Step 4: Update Pages

**Example: Homepage (`app/page.tsx`)**

```tsx
import { getHomepageData } from '@/lib/api'
import SafeSections from '@/lib/SafeSections'

export default async function HomePage() {
  const homepageData = await getHomepageData()
  const sections = homepageData?.sections || []

  return (
    <div>
      <SafeSections
        sections={sections}
        tenantCode="al-anastasiou"
      />
    </div>
  )
}
```

**Example: Dynamic Page (`app/services/page.tsx`)**

```tsx
import { getTenant, getPageBySlug } from '@/lib/api'
import SafeSections from '@/lib/SafeSections'

export default async function ServicesPage() {
  const tenant = await getTenant('al-anastasiou')
  if (!tenant) return <div>Tenant not found</div>

  const page = await getPageBySlug('services', tenant.id)
  const sections = page?.sections || []

  return (
    <div>
      <SafeSections
        sections={sections}
        tenantCode="al-anastasiou"
      />
    </div>
  )
}
```

### Step 5: Create Section Renderers

Create `src/tenants/al-anastasiou/sections/` and implement renderers for each block type.

**Example: `hero.tsx`**

```tsx
import type { AlAnastasiouHeroBlock } from '@/payload-types'

export function AlAnastasiouHeroRenderer({ data }: { data: AlAnastasiouHeroBlock }) {
  return (
    <section className="relative h-[90vh] flex items-center">
      {data.backgroundImage && (
        <img 
          src={typeof data.backgroundImage === 'string' 
            ? data.backgroundImage 
            : data.backgroundImage.url} 
          alt={data.title || ''}
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
      )}
      <div className="relative max-w-7xl mx-auto px-4">
        <h1>{data.title}</h1>
        {data.subtitle && <p>{data.subtitle}</p>}
        {/* ... render CTAs, etc. */}
      </div>
    </section>
  )
}
```

### Step 6: Update Next.js Config

Add CMS domain to `next.config.js`:

```javascript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cms.ftiaxesite.gr', // Your CMS domain
      },
    ],
  },
}
```

---

## Deployment Checklist

### Before Deploying Frontend:

- [ ] API client created and configured
- [ ] Environment variables set (`NEXT_PUBLIC_CMS_URL`)
- [ ] Pages updated to fetch from CMS
- [ ] Section renderers created
- [ ] Navigation/Footer fetch from CMS
- [ ] Test locally with CMS API
- [ ] Next.js config updated for image domains

### Before Deploying CMS:

- [ ] CMS deployed and accessible
- [ ] CORS configured for frontend domain
- [ ] Environment variables set in production
- [ ] Database connected
- [ ] Test CMS API endpoints

### Deployment Steps:

1. **Deploy CMS first**
   - Ensure it's accessible at your production URL
   - Test API endpoints work
   - Verify CORS allows frontend domain

2. **Update frontend environment**
   - Set `NEXT_PUBLIC_CMS_URL` to production CMS URL
   - Commit and push to git

3. **Deploy frontend**
   - Push to git
   - Deploy to Vercel/Netlify/etc.
   - Verify it connects to CMS

---

## Quick Start: Minimal Integration

If you want to deploy quickly with minimal changes:

1. **Keep static content for now**
   - Frontend can stay static initially
   - Deploy as-is

2. **Add CMS integration later**
   - Gradually migrate pages to CMS
   - Start with homepage, then other pages

3. **Hybrid approach**
   - Use CMS for content that changes frequently
   - Keep static content for pages that rarely change

---

## Testing Locally

1. **Start CMS locally:**
   ```bash
   cd cmsftiaxesite
   pnpm dev
   # CMS runs on http://localhost:3000
   ```

2. **Start frontend locally:**
   ```bash
   cd ../Frontendsites/al-anastasiou
   # Create .env.local with:
   # NEXT_PUBLIC_CMS_URL=http://localhost:3000
   pnpm dev
   # Frontend runs on http://localhost:3001
   ```

3. **Test API connection:**
   - Visit `http://localhost:3001`
   - Check browser console for API calls
   - Verify data loads from CMS

---

## Recommended Approach

**Option A: Full Integration (Recommended)**
- Connect frontend to CMS completely
- All content managed in CMS
- More flexible, easier to update

**Option B: Gradual Migration**
- Deploy static frontend first
- Gradually migrate pages to CMS
- Less risky, incremental changes

**Option C: Hybrid**
- CMS for dynamic content (homepage, news, etc.)
- Static for rarely-changing pages (legal, etc.)
- Best of both worlds

---

## Need Help?

If you want me to help set up the frontend integration, I can:
1. Create the API client
2. Update pages to fetch from CMS
3. Create section renderers
4. Set up environment variables

Just let me know which approach you prefer!
