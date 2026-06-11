import { Hono } from 'hono'
import { db } from '../db/client'
import { companies, emissionRecords, reportJobs } from '../db/schema'
import { and, eq } from 'drizzle-orm'
import type { TenantVar } from '../middleware/tenant'

const reportsRouter = new Hono<{ Variables: TenantVar }>()

async function getOwnedCompany(companyId: string, tenantId: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)))
    .limit(1)
  return company ?? null
}

reportsRouter.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const companyId = c.req.query('companyId')
  if (!companyId) return c.json({ error: 'companyId required' }, 400)
  const company = await getOwnedCompany(companyId, tenantId)
  if (!company) return c.json({ error: 'Not found' }, 404)
  const jobs = await db.select().from(reportJobs).where(eq(reportJobs.companyId, companyId))
  return c.json(jobs)
})

reportsRouter.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const body = await c.req.json<{ companyId: string; reportType: string }>()
  const company = await getOwnedCompany(body.companyId, tenantId)
  if (!company) return c.json({ error: 'Not found' }, 404)
  const [job] = await db.insert(reportJobs).values({ companyId: body.companyId, reportType: body.reportType }).returning()
  return c.json(job, 201)
})

// Phase 2: GET /api/v1/reports/export?companyId=&format=pdf|csv
reportsRouter.get('/export', async (c) => {
  const tenantId = c.get('tenantId')
  const companyId = c.req.query('companyId')
  const format = c.req.query('format') as 'pdf' | 'csv' | undefined

  if (!companyId || !format) return c.json({ error: 'companyId and format required' }, 400)
  if (!['pdf', 'csv'].includes(format)) return c.json({ error: 'format must be pdf or csv' }, 400)

  const company = await getOwnedCompany(companyId, tenantId)
  if (!company) return c.json({ error: 'Not found' }, 404)

  const records = await db.select().from(emissionRecords).where(eq(emissionRecords.companyId, companyId))

  if (format === 'csv') {
    const header = 'id,scope,category,activityData,activityUnit,emissionFactor,co2eKg,dataSource,periodStart,periodEnd\n'
    const rows = records.map((r) =>
      [r.id, r.scope, r.category, r.activityData, r.activityUnit, r.emissionFactor, r.co2eKg, r.dataSource, r.periodStart, r.periodEnd].join(',')
    ).join('\n')
    return new Response(header + rows, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="report-${companyId}.csv"` } })
  }

  // PDF stub — Phase 2 full implementation
  return new Response(Buffer.from('%PDF-1.4 stub'), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="report-${companyId}.pdf"` },
  })
})

export default reportsRouter
