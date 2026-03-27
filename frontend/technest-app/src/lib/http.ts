type RawTextResponse = {
  _raw: string
}

export async function parseJsonSafe(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') || ''

  if (res.status === 204) {
    return null
  }

  if (!contentType.includes('application/json')) {
    const text = await res.text()
    const rawTextResponse: RawTextResponse | null = text ? { _raw: text } : null
    return rawTextResponse
  }

  try {
    return await res.json()
  } catch {
    return null
  }
}
