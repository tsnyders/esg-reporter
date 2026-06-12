import { db } from './client'
import { companies } from './schema'
import { and, eq } from 'drizzle-orm'

/**
 * Returns the company row only if it belongs to the given tenant.
 * Use before every emission-record or report-job operation.
 */
export async function getOwnedCompany(companyId: string, tenantId: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)))
    .limit(1)
  return company ?? null
}
