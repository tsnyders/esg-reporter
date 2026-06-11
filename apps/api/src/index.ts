import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { tenantMiddleware } from './middleware/tenant'
import health from './routes/health'
import companiesRouter from './routes/companies'
import emissionsRouter from './routes/emissions'
import reportsRouter from './routes/reports'

const app = new Hono()

app.use('*', logger())
app.use('/api/*', cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' }))

app.route('/api/v1/health', health)

// All routes below require tenant auth
const api = new Hono()
api.use('*', tenantMiddleware)
api.route('/companies', companiesRouter)
api.route('/emission-records', emissionsRouter)
api.route('/report-jobs', reportsRouter)
api.route('/reports', reportsRouter)

app.route('/api/v1', api)

const PORT = Number(process.env.PORT ?? 3141)
console.log(`ESG Reporter API listening on :${PORT}`)

serve({ fetch: app.fetch, port: PORT })

export default app
