import { Hono } from 'hono'
import { db } from '@/lib/db/client'
import { emissionRecords } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getOwnedCompany } from '@/lib/db/utils'
import type { TenantVar } from '@/lib/hono/middleware/tenant'

const reportsRouter = new Hono<{ Variables: TenantVar }>()

reportsRouter.get('/export', async (c) => {
  const tenantId = c.get('tenantId')
  const companyId = c.req.query('companyId')
  const format = c.req.query('format') as 'pdf' | 'csv' | undefined

  if (!companyId || !format) return c.json({ error: 'companyId and format required' }, 400)
  if (!['pdf', 'csv'].includes(format)) return c.json({ error: 'format must be pdf or csv' }, 400)
  if (!await getOwnedCompany(companyId, tenantId)) return c.json({ error: 'Not found' }, 404)

  const records = await db.select().from(emissionRecords).where(eq(emissionRecords.companyId, companyId))

  if (format === 'csv') {
    const header = 'id,scope,category,activityData,activityUnit,emissionFactor,co2eKg,dataSource,periodStart,periodEnd\n'
    const rows = records.map((r) =>
      [r.id, r.scope, r.category, r.activityData, r.activityUnit, r.emissionFactor, r.co2eKg, r.dataSource, r.periodStart, r.periodEnd].join(',')
    ).join('\n')
    return new Response(header + rows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="report-${companyId}.csv"`,
      },
    })
  }

  return new Response(Buffer.from('%PDF-1.4 stub'), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-${companyId}.pdf"`,
    },
  })
})

export default reportsRouter
