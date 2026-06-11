import { auth } from '@clerk/nextjs/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3141'

/** Server-side authenticated fetch */
export async function apiFetchServer(path: string, init?: RequestInit) {
  const { getToken } = await auth()
  const token = await getToken()
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })
}

/** Client-side authenticated fetch — token must be passed in */
export async function apiFetch(path: string, token: string, init?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })
}
