import { Hono } from 'hono'
import { db } from '../db/client'
import { companies, emissionRecords } from '../db/schema'
import { and, eq } from 'drizzle-orm'
import type { TenantVar } from '../middleware/tenant'

const emissionsRouter = new Hono<{ Variables: TenantVar }>()

async function getOwnedCompany(companyId: string, tenantId: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)))
    .limit(1)
  return company ?? null
}

emissionsRouter.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const companyId = c.req.query('companyId')
  if (!companyId) return c.json({ error: 'companyId required' }, 400)

  const company = await getOwnedCompany(companyId, tenantId)
  if (!company) return c.json({ error: 'Not found' }, 404)

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

  const company = await getOwnedCompany(body.companyId, tenantId)
  if (!company) return c.json({ error: 'Not found' }, 404)

  const co2eKg = (body.activityData * body.emissionFactor).toFixed(6)
  const [created] = await db
    .insert(emissionRecords)
    .values({
      ...body,
      activityData: String(body.activityData),
      emissionFactor: String(body.emissionFactor),
      co2eKg,
    })
    .returning()

  return c.json(created, 201)
})

export default emissionsRouter
