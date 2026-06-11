'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface FormState {
  name: string
  industry: string
  country: string
  reportingYear: string
}

export function CompanyStep() {
  const { getToken } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState<FormState>({ name: '', industry: '', country: '', reportingYear: String(new Date().getFullYear()) })
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    try {
      const token = await getToken()
      const res = await apiFetch('/api/v1/companies', token!, {
        method: 'POST',
        body: JSON.stringify({ ...form, reportingYear: Number(form.reportingYear) }),
      })
      if (!res.ok) throw new Error('Failed')
      router.push('/emissions')
    } catch {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md">
      {(['name', 'industry', 'country'] as const).map((field) => (
        <div key={field}>
          <label className="block text-sm font-medium capitalize">{field}</label>
          <input value={form[field]} onChange={(e) => update(field, e.target.value)} required className="mt-1 block w-full border rounded p-2" />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium">Reporting Year</label>
        <input type="number" value={form.reportingYear} onChange={(e) => update('reportingYear', e.target.value)} required className="mt-1 block w-full border rounded p-2" />
      </div>
      <button type="submit" disabled={status === 'saving'} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
        {status === 'saving' ? 'Saving…' : 'Create Company'}
      </button>
      {status === 'error' && <p className="text-red-600 text-sm">Failed to create company. Try again.</p>}
    </form>
  )
}
