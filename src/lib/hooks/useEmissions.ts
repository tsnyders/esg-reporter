'use client'

import useSWR from 'swr'
import { useAuth } from '@clerk/nextjs'

export interface EmissionRecord {
  id: string
  scope: '1' | '2' | '3'
  category: string
  activityData: number
  activityUnit: string
  emissionFactor: number
  co2eKg: number
  dataSource: string
  periodStart: string
  periodEnd: string
  createdAt: string
}

export function useEmissions(companyId: string | null) {
  const { getToken } = useAuth()

  return useSWR<EmissionRecord[]>(
    companyId ? `/api/v1/emission-records?companyId=${companyId}` : null,
    async (url: string) => {
      const token = await getToken()
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch emission records')
      return res.json()
    }
  )
}
