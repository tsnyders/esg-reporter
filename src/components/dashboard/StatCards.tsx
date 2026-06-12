'use client'

import { useCompany } from '@/lib/hooks/useCompany'
import { useEmissions } from '@/lib/hooks/useEmissions'

export function StatCards() {
  const { companyId } = useCompany()
  const { data: records, isLoading } = useEmissions(companyId)

  const totalCo2e = records?.reduce((sum, r) => sum + r.co2eKg, 0) ?? 0
  const totalTco2e = (totalCo2e / 1000).toFixed(2)

  const byScope = (scope: '1' | '2' | '3') =>
    (records?.filter((r) => r.scope === scope).reduce((s, r) => s + r.co2eKg, 0) ?? 0) / 1000

  if (isLoading) return <div className="animate-pulse">Loading stats...</div>

  return (
    <div className="grid grid-cols-4 gap-4">
      {[
        { label: 'Total tCO₂e', value: totalTco2e },
        { label: 'Scope 1', value: byScope('1').toFixed(2) },
        { label: 'Scope 2', value: byScope('2').toFixed(2) },
        { label: 'Scope 3', value: byScope('3').toFixed(2) },
      ].map(({ label, value }) => (
        <div key={label} className="rounded-xl border p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
      ))}
    </div>
  )
}
