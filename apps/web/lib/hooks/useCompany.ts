'use client'

import useSWR from 'swr'
import { useAuth } from '@clerk/nextjs'

export function useCompany() {
  const { getToken, orgId, userId } = useAuth()

  const { data, isLoading, error } = useSWR(
    userId ? '/api/v1/companies' : null,
    async (url: string) => {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch companies')
      return res.json() as Promise<{ id: string; name: string }[]>
    }
  )

  const company = data?.[0] ?? null

  return {
    companyId: company?.id ?? null,
    companyName: company?.name ?? null,
    isLoading,
    error,
  }
}
