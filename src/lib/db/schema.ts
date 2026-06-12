import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  clerkOrgId: text('clerk_org_id').unique().notNull(),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const companies = sqliteTable('companies', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  industry: text('industry').notNull(),
  country: text('country').notNull(),
  reportingYear: integer('reporting_year').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const emissionRecords = sqliteTable('emission_records', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text('company_id').references(() => companies.id).notNull(),
  scope: text('scope', { enum: ['1', '2', '3'] }).notNull(),
  category: text('category').notNull(),
  activityData: real('activity_data').notNull(),
  activityUnit: text('activity_unit').notNull(),
  emissionFactor: real('emission_factor').notNull(),
  co2eKg: real('co2e_kg').notNull(),
  dataSource: text('data_source').notNull(),
  periodStart: text('period_start').notNull(),
  periodEnd: text('period_end').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const reportJobs = sqliteTable('report_jobs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text('company_id').references(() => companies.id).notNull(),
  status: text('status', { enum: ['pending', 'processing', 'done', 'failed'] }).notNull().default('pending'),
  reportType: text('report_type').notNull(),
  outputUrl: text('output_url'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  completedAt: text('completed_at'),
})
