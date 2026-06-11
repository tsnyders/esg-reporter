import { createMiddleware } from 'hono/factory'
import { createClerkClient } from '@clerk/backend'
import { db } from '../db/client'
import { tenants } from '../db/schema'
import { eq } from 'drizzle-orm'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })

export type TenantVar = { tenantId: string; clerkOrgId: string }

export const tenantMiddleware = createMiddleware<{ Variables: TenantVar }>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const payload = await clerk.verifyToken(token)
    const clerkOrgId = (payload.org_id ?? payload.sub) as string

    // Upsert tenant
    const existing = await db.select().from(tenants).where(eq(tenants.clerkOrgId, clerkOrgId)).limit(1)
    let tenantId: string

    if (existing.length > 0) {
      tenantId = existing[0].id
    } else {
      const [newTenant] = await db.insert(tenants).values({ clerkOrgId, name: clerkOrgId }).returning()
      tenantId = newTenant.id
    }

    c.set('tenantId', tenantId)
    c.set('clerkOrgId', clerkOrgId)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})
