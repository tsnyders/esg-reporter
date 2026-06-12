import { Hono } from 'hono'
import { db } from '@/lib/db/client'
import { companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { TenantVar } from '@/lib/hono/middleware/tenant'

const companiesRouter = new Hono<{ Variables: TenantVar }>()

companiesRouter.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const rows = await db.select().from(companies).where(eq(companies.tenantId, tenantId))
  return c.json(rows)
})

companiesRouter.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const body = await c.req.json<{ name: string; industry: string; country: string; reportingYear: number }>()
  const id = crypto.randomUUID()
  await db.insert(companies).values({ id, ...body, tenantId })
  const [created] = await db.select().from(companies).where(eq(companies.id, id))
  return c.json(created, 201)
})

export default companiesRouter
