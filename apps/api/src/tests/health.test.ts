import { describe, it, expect } from 'vitest'
import app from '../index'

describe('GET /api/v1/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await app.request('/api/v1/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
  })
})
