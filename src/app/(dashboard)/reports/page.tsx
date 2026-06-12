'use client'

import { useAuth } from '@clerk/nextjs'
import { useCompany } from '@/lib/hooks/useCompany'

export default function ReportsPage() {
  const { getToken } = useAuth()
  const { companyId } = useCompany()

  async function generate(format: 'pdf' | 'csv') {
    if (!companyId) return
    const token = await getToken()
    const res = await fetch(`/api/v1/reports/export?companyId=${companyId}&format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <div className="flex gap-4">
        <button onClick={() => generate('pdf')} className="px-4 py-2 bg-blue-600 text-white rounded">
          Generate PDF
        </button>
        <button onClick={() => generate('csv')} className="px-4 py-2 bg-green-600 text-white rounded">
          Generate CSV
        </button>
      </div>
    </main>
  )
}
