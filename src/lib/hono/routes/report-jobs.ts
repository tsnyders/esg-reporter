import { Hono } from 'hono'
import { db } from '@/lib/db/client'
import { reportJobs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getOwnedCompany } from '@/lib/db/utils'
import type { TenantVar } from '@/lib/hono/middleware/tenant'

const reportJobsRouter = new Hono<{ Variables: TenantVar }>()

reportJobsRouter.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const companyId = c.req.query('companyId')
  if (!companyId) return c.json({ error: 'companyId required' }, 400)
  if (!await getOwnedCompany(companyId, tenantId)) return c.json({ error: 'Not found' }, 404)
  const jobs = await db.select().from(reportJobs).where(eq(reportJobs.companyId, companyId))
  return c.json(jobs)
})

reportJobsRouter.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const body = await c.req.json<{ companyId: string; reportType: string }>()
  if (!await getOwnedCompany(body.companyId, tenantId)) return c.json({ error: 'Not found' }, 404)
  const id = crypto.randomUUID()
  await db.insert(reportJobs).values({ id, companyId: body.companyId, reportType: body.reportType })
  const [job] = await db.select().from(reportJobs).where(eq(reportJobs.id, id))
  return c.json(job, 201)
})

export default reportJobsRouter
