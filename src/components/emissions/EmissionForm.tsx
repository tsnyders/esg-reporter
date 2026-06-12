'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useCompany } from '@/lib/hooks/useCompany'
import { apiFetch } from '@/lib/api-client'

interface FormState {
  scope: '1' | '2' | '3'
  category: string
  activityData: string
  activityUnit: string
  emissionFactor: string
  dataSource: string
  periodStart: string
  periodEnd: string
}

const INITIAL: FormState = {
  scope: '1',
  category: '',
  activityData: '',
  activityUnit: 'kWh',
  emissionFactor: '',
  dataSource: 'DEFRA',
  periodStart: '',
  periodEnd: '',
}

export function EmissionForm() {
  const { getToken } = useAuth()
  const { companyId } = useCompany()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!companyId) return
    setStatus('saving')
    try {
      const token = await getToken()
      const res = await apiFetch('/api/v1/emission-records', token!, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          companyId,
          activityData: Number(form.activityData),
          emissionFactor: Number(form.emissionFactor),
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      setStatus('success')
      setForm(INITIAL)
    } catch {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium">Scope</label>
        <select
          value={form.scope}
          onChange={(e) => update('scope', e.target.value as '1' | '2' | '3')}
          className="mt-1 block w-full border rounded p-2"
        >
          <option value="1">Scope 1 — Direct</option>
          <option value="2">Scope 2 — Indirect energy</option>
          <option value="3">Scope 3 — Value chain</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Category</label>
        <input value={form.category} onChange={(e) => update('category', e.target.value)} required className="mt-1 block w-full border rounded p-2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Activity Data</label>
          <input type="number" value={form.activityData} onChange={(e) => update('activityData', e.target.value)} required className="mt-1 block w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Unit</label>
          <input value={form.activityUnit} onChange={(e) => update('activityUnit', e.target.value)} required className="mt-1 block w-full border rounded p-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Emission Factor</label>
        <input type="number" step="0.0001" value={form.emissionFactor} onChange={(e) => update('emissionFactor', e.target.value)} required className="mt-1 block w-full border rounded p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Data Source</label>
        <input value={form.dataSource} onChange={(e) => update('dataSource', e.target.value)} className="mt-1 block w-full border rounded p-2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Period Start</label>
          <input type="date" value={form.periodStart} onChange={(e) => update('periodStart', e.target.value)} required className="mt-1 block w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Period End</label>
          <input type="date" value={form.periodEnd} onChange={(e) => update('periodEnd', e.target.value)} required className="mt-1 block w-full border rounded p-2" />
        </div>
      </div>
      <button type="submit" disabled={status === 'saving'} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
        {status === 'saving' ? 'Saving…' : 'Add Record'}
      </button>
      {status === 'success' && <p className="text-green-600 text-sm">Record saved.</p>}
      {status === 'error' && <p className="text-red-600 text-sm">Save failed. Try again.</p>}
    </form>
  )
}
