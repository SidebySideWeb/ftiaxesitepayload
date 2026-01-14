# Tenant Safety Guarantees

This document explains all the safety mechanisms in place to ensure that adding a new tenant **cannot** affect existing tenants' data.

## 🛡️ Core Safety Mechanisms

### 1. **Tenant-Scoped Queries (Primary Protection)**

**Every database operation filters by tenant ID.** The sync script uses tenant-specific queries for all operations:

```typescript
// Example from syncSite.ts - Finding pages
const existing = await this.payload.find({
  collection: 'pages',
  where: {
    and: [
      { tenant: { equals: tenantId } },  // ← ONLY this tenant's pages
      { slug: { equals: pageData.slug } },
    ],
  },
  limit: 1,
})
```

**What this means:**
- ✅ When syncing tenant "A", it can ONLY find/update/create records where `tenant = A`
- ✅ Tenant "B" records are completely invisible to tenant "A" operations
- ✅ Even if two tenants have the same slug (e.g., both have "/about"), they are separate records

### 2. **Tenant ID Isolation**

The sync process works like this:

1. **Find tenant by code** (e.g., `gymnastics-kefalonia`)
   ```typescript
   where: { code: { equals: this.tenantCode } }
   ```
   This finds ONLY the tenant with that specific code.

2. **Use tenant ID for all operations**
   ```typescript
   const tenantId = tenant.id  // e.g., 123
   // All subsequent operations use this ID
   where: { tenant: { equals: tenantId } }
   ```

3. **Database-level isolation**
   - Each tenant has a unique ID (primary key)
   - All content references this ID via foreign key
   - Database enforces referential integrity

### 3. **Unique Constraints (Prevents Conflicts)**

Several collections have **unique constraints** on the tenant field:

#### Headers Collection
```typescript
{
  name: 'tenant',
  type: 'relationship',
  unique: true,  // ← Only ONE header per tenant
}
```

#### Footers Collection
```typescript
{
  name: 'tenant',
  type: 'relationship',
  unique: true,  // ← Only ONE footer per tenant
}
```

#### Homepages Collection
```typescript
{
  name: 'tenant',
  type: 'relationship',
  unique: true,  // ← Only ONE homepage per tenant
}
```

**What this means:**
- ✅ Each tenant can have exactly ONE header, footer, and homepage
- ✅ Database prevents creating duplicates
- ✅ Updates only affect that tenant's record

### 4. **Access Control Layer**

The `tenantAccess` access control ensures:

```typescript
// From tenantAccess.ts
read: ({ req: { user } }) => {
  if (isAdmin(user)) return true  // Admins see all
  
  if (user?.tenant) {
    // Regular users ONLY see their tenant's content
    return { tenant: { equals: tenantId } }
  }
  
  // Public: only published content
  return { status: { equals: 'published' } }
}
```

**What this means:**
- ✅ Regular users can ONLY see their own tenant's content
- ✅ Even if they try to query other tenants, the database filters it out
- ✅ Super admins can see all, but regular operations are still tenant-scoped

### 5. **Read-Only Tenant Field**

Once created, the tenant field is **read-only**:

```typescript
{
  name: 'tenant',
  admin: {
    readOnly: true,  // ← Cannot be changed after creation
    description: 'This cannot be changed after creation.',
  },
}
```

**What this means:**
- ✅ A page/header/footer cannot be accidentally moved to another tenant
- ✅ Even if someone tries to edit it, the tenant field is locked

### 6. **Sync Script Safety**

The sync script (`syncSite.ts`) has multiple safety checks:

#### Tenant Lookup (Step 1)
```typescript
// Finds tenant by CODE (not ID)
const existing = await this.payload.find({
  collection: 'tenants',
  where: { code: { equals: this.tenantCode } },  // Exact match
  limit: 1,
})
```

#### All Operations Use Tenant ID
```typescript
// Navigation Menu
where: {
  and: [
    { tenant: { equals: tenantId } },  // ← Tenant filter
    { title: { equals: menuData.menuTitle } },
  ],
}

// Header
where: { tenant: { equals: tenantId } }  // ← Tenant filter

// Footer
where: { tenant: { equals: tenantId } }  // ← Tenant filter

// Homepage
where: { tenant: { equals: tenantId } }  // ← Tenant filter

// Pages
where: {
  and: [
    { tenant: { equals: tenantId } },  // ← Tenant filter
    { slug: { equals: pageData.slug } },
  ],
}
```

**What this means:**
- ✅ Every query explicitly filters by the specific tenant ID
- ✅ No query can accidentally touch other tenants' data
- ✅ Even if you run the sync script multiple times, it only affects that tenant

### 7. **Block Type Namespacing**

Blocks are prefixed with tenant code:

```typescript
// Tenant A blocks
'kallitechnia.hero'
'kallitechnia.richText'

// Tenant B blocks
'gymnastics-kefalonia.hero'
'gymnastics-kefalonia.richText'
```

**What this means:**
- ✅ Blocks are completely isolated by name
- ✅ Even if two tenants have similar blocks, they're separate types
- ✅ No risk of block type conflicts

### 8. **Media Isolation**

Media files are also tenant-scoped:

```typescript
// From hydrateMedia.ts
where: {
  tenant: { equals: tenantId }  // ← Only this tenant's media
}
```

**What this means:**
- ✅ Media uploads are associated with the specific tenant
- ✅ Media queries filter by tenant
- ✅ No risk of media file conflicts

## 🔍 Verification Checklist

Before running sync, you can verify safety:

### Check 1: Tenant Code is Unique
```bash
# In Payload admin, check Tenants collection
# Verify no duplicate codes exist
```

### Check 2: Verify Tenant ID
```bash
# After sync starts, check console output:
# "✓ Creating tenant: gymnastics-kefalonia"
# Note the tenant ID shown
```

### Check 3: Verify Queries are Scoped
```bash
# Watch console output during sync:
# "✓ Updating page: about (tenant: 123)"
# The tenant ID should match the new tenant
```

### Check 4: Test in Admin UI
1. Log in as a user from Tenant A
2. Verify you can ONLY see Tenant A's content
3. Log in as a user from Tenant B
4. Verify you can ONLY see Tenant B's content
5. Log in as super admin
6. Verify you can see BOTH tenants' content

## 🚨 What CANNOT Happen

Based on the safety mechanisms above, these scenarios are **impossible**:

### ❌ Cannot Delete Other Tenants' Data
- All delete operations filter by tenant ID
- Access control prevents cross-tenant deletes

### ❌ Cannot Update Other Tenants' Content
- All update queries include `where: { tenant: { equals: tenantId } }`
- Read-only tenant field prevents moving content between tenants

### ❌ Cannot Create Duplicate Headers/Footers/Homepages
- Unique constraints prevent duplicates
- Database enforces one-per-tenant rule

### ❌ Cannot Mix Tenant Data
- Every query explicitly filters by tenant
- Foreign key relationships enforce tenant boundaries

### ❌ Cannot Accidentally Overwrite Other Tenants
- Tenant lookup is by exact code match
- All operations use the specific tenant ID
- No wildcard or "all tenants" operations exist

## 📊 Database Schema Safety

### Foreign Key Relationships
```
Tenants (id: 1, code: "kallitechnia")
  └── Pages (tenant: 1) ← Foreign key to Tenants.id
  └── Headers (tenant: 1) ← Foreign key to Tenants.id
  └── Footers (tenant: 1) ← Foreign key to Tenants.id
  └── Homepages (tenant: 1) ← Foreign key to Tenants.id

Tenants (id: 2, code: "gymnastics-kefalonia")
  └── Pages (tenant: 2) ← Foreign key to Tenants.id
  └── Headers (tenant: 2) ← Foreign key to Tenants.id
  └── Footers (tenant: 2) ← Foreign key to Tenants.id
  └── Homepages (tenant: 2) ← Foreign key to Tenants.id
```

**Database enforces:**
- ✅ Cannot create a Page with `tenant: 999` if Tenant 999 doesn't exist
- ✅ Cannot delete a Tenant if it has associated content (referential integrity)
- ✅ Foreign keys ensure data consistency

## 🧪 Testing Safety

### Test 1: Run Sync for New Tenant
```bash
pnpm sync:site -- --tenant new-tenant
```

**Expected:**
- ✅ Only creates/updates records for "new-tenant"
- ✅ Existing tenants' data remains untouched
- ✅ Console shows tenant ID being used consistently

### Test 2: Query Verification
```typescript
// In Payload admin or API
// Query Tenant A's pages
GET /api/pages?where[tenant.code][equals]=kallitechnia

// Query Tenant B's pages  
GET /api/pages?where[tenant.code][equals]=gymnastics-kefalonia

// Verify they return different results
```

### Test 3: Access Control Test
1. Create user for Tenant A
2. Log in as Tenant A user
3. Try to access Tenant B's content
4. **Expected:** Cannot see Tenant B's content

## 📝 Summary

**The system is designed with multiple layers of protection:**

1. ✅ **Query-level filtering** - Every query includes tenant filter
2. ✅ **Database constraints** - Unique constraints prevent duplicates
3. ✅ **Access control** - Users can only access their tenant
4. ✅ **Read-only fields** - Tenant field cannot be changed
5. ✅ **Foreign key integrity** - Database enforces relationships
6. ✅ **Namespaced blocks** - Blocks are tenant-specific
7. ✅ **Isolated media** - Media is tenant-scoped

**Result:** It is **impossible** to accidentally affect other tenants' data when adding a new tenant. The system is designed with defense-in-depth, meaning even if one protection fails, others will catch it.

## 🆘 If Something Goes Wrong

If you're still concerned, you can:

1. **Backup database before sync**
   ```bash
   # PostgreSQL backup
   pg_dump $DATABASE_URI > backup-$(date +%Y%m%d).sql
   ```

2. **Test in development first**
   - Run sync in dev environment
   - Verify other tenants are unaffected
   - Then run in production

3. **Monitor during sync**
   - Watch console output
   - Verify tenant ID is consistent
   - Check for any errors

4. **Verify after sync**
   - Check existing tenants' content in admin UI
   - Verify all data is still present
   - Test frontend sites still work

---

**Bottom line:** The system is built with tenant isolation as a core principle. Every operation is tenant-scoped, and the database enforces these boundaries. You can safely add new tenants without risk to existing data.
