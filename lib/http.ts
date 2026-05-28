export async function readJsonResponse<T>(response: Response) {
  const text = await response.text()
  const data = text ? JSON.parse(text) as T & { error?: string } : null

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`)
  }

  if (!data) {
    throw new Error("Empty response body")
  }

  return data
}
