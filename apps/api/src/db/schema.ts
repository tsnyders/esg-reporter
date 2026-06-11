import { pgTable, text, integer, numeric, timestamp, uuid } from 'drizzle-orm/pg-core'

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkOrgId: text('clerk_org_id').unique().notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  industry: text('industry').notNull(),
  country: text('country').notNull(),
  reportingYear: integer('reporting_year').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const emissionRecords = pgTable('emission_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  scope: text('scope', { enum: ['1', '2', '3'] }).notNull(),
  category: text('category').notNull(),
  activityData: numeric('activity_data', { precision: 20, scale: 6 }).notNull(),
  activityUnit: text('activity_unit').notNull(),
  emissionFactor: numeric('emission_factor', { precision: 20, scale: 8 }).notNull(),
  co2eKg: numeric('co2e_kg', { precision: 20, scale: 6 }).notNull(),
  dataSource: text('data_source').notNull(),
  periodStart: text('period_start').notNull(),
  periodEnd: text('period_end').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const reportJobs = pgTable('report_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  status: text('status', { enum: ['pending', 'processing', 'done', 'failed'] }).notNull().default('pending'),
  reportType: text('report_type').notNull(),
  outputUrl: text('output_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
})
