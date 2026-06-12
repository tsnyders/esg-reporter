import { createMiddleware } from 'hono/factory'
import { verifyToken } from '@clerk/backend'
import { db } from '@/lib/db/client'
import { tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export type TenantVar = { tenantId: string; clerkOrgId: string }

export const tenantMiddleware = createMiddleware<{ Variables: TenantVar }>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! })
    const clerkOrgId = (payload.org_id ?? payload.sub) as string

    const existing = await db.select().from(tenants).where(eq(tenants.clerkOrgId, clerkOrgId)).limit(1)
    let tenantId: string

    if (existing.length > 0) {
      tenantId = existing[0].id
    } else {
      const id = crypto.randomUUID()
      await db.insert(tenants).values({ id, clerkOrgId, name: clerkOrgId })
      tenantId = id
    }

    c.set('tenantId', tenantId)
    c.set('clerkOrgId', clerkOrgId)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})
