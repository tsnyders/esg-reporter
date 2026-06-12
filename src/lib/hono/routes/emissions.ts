import { Hono } from 'hono'
import { db } from '@/lib/db/client'
import { emissionRecords } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getOwnedCompany } from '@/lib/db/utils'
import type { TenantVar } from '@/lib/hono/middleware/tenant'

const emissionsRouter = new Hono<{ Variables: TenantVar }>()

emissionsRouter.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const companyId = c.req.query('companyId')
  if (!companyId) return c.json({ error: 'companyId required' }, 400)
  if (!await getOwnedCompany(companyId, tenantId)) return c.json({ error: 'Not found' }, 404)
  const records = await db.select().from(emissionRecords).where(eq(emissionRecords.companyId, companyId))
  return c.json(records)
})

emissionsRouter.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const body = await c.req.json<{
    companyId: string
    scope: '1' | '2' | '3'
    category: string
    activityData: number
    activityUnit: string
    emissionFactor: number
    dataSource: string
    periodStart: string
    periodEnd: string
  }>()

  if (!await getOwnedCompany(body.companyId, tenantId)) return c.json({ error: 'Not found' }, 404)

  const id = crypto.randomUUID()
  const co2eKg = body.activityData * body.emissionFactor
  await db.insert(emissionRecords).values({ id, ...body, co2eKg })
  const [created] = await db.select().from(emissionRecords).where(eq(emissionRecords.id, id))
  return c.json(created, 201)
})

export default emissionsRouter
