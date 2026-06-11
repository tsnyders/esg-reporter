import { Hono } from 'hono'
import { db } from '../db/client'
import { companies } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { TenantVar } from '../middleware/tenant'

const companiesRouter = new Hono<{ Variables: TenantVar }>()

companiesRouter.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const rows = await db.select().from(companies).where(eq(companies.tenantId, tenantId))
  return c.json(rows)
})

companiesRouter.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const body = await c.req.json<{ name: string; industry: string; country: string; reportingYear: number }>()
  const [created] = await db.insert(companies).values({ ...body, tenantId }).returning()
  return c.json(created, 201)
})

export default companiesRouter
