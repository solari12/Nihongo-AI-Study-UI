const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small"

export function embeddingModel() {
  return process.env.OPENAI_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL
}

function embeddingDimensions() {
  const raw = process.env.OPENAI_EMBEDDING_DIMENSIONS
  if (!raw) return 1536
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : 1536
}

export function hasEmbeddingProvider() {
  return Boolean(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY)
}

function embeddingEndpoint() {
  if (process.env.OPENAI_EMBEDDING_BASE_URL) return process.env.OPENAI_EMBEDDING_BASE_URL
  if (process.env.OPENROUTER_API_KEY) return "https://openrouter.ai/api/v1/embeddings"
  return "https://api.openai.com/v1/embeddings"
}

export function isEmbeddingVector(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  )
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (!a.length || !b.length || a.length !== b.length) return 0

  let dot = 0
  let normA = 0
  let normB = 0

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index]
    normA += a[index] * a[index]
    normB += b[index] * b[index]
  }

  if (!normA || !normB) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function createEmbedding(input: string) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY or OPENAI_API_KEY is not configured for embedding generation")
  }

  const response = await fetch(embeddingEndpoint(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: embeddingModel(),
      input,
      dimensions: embeddingDimensions(),
      encoding_format: "float",
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(`Embedding request failed: ${response.status} ${detail}`)
  }

  const payload = await response.json() as {
    data?: Array<{
      embedding?: unknown
    }>
  }
  const embedding = payload.data?.[0]?.embedding

  if (!isEmbeddingVector(embedding)) {
    throw new Error(`Embedding response did not contain a numeric vector: ${JSON.stringify(payload).slice(0, 800)}`)
  }

  return embedding
}
