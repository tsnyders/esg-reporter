import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { logger } from 'hono/logger'
import { tenantMiddleware } from '@/lib/hono/middleware/tenant'
import health from '@/lib/hono/routes/health'
import companiesRouter from '@/lib/hono/routes/companies'
import emissionsRouter from '@/lib/hono/routes/emissions'
import reportJobsRouter from '@/lib/hono/routes/report-jobs'
import reportsRouter from '@/lib/hono/routes/reports'

export const runtime = 'nodejs'

const app = new Hono().basePath('/api')

app.use('*', logger())

app.route('/v1/health', health)

const v1 = new Hono()
v1.use('*', tenantMiddleware)
v1.route('/companies', companiesRouter)
v1.route('/emission-records', emissionsRouter)
v1.route('/report-jobs', reportJobsRouter)
v1.route('/reports', reportsRouter)

app.route('/v1', v1)

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const PATCH = handle(app)
