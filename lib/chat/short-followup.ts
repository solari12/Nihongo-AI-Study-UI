function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function isShortFollowUpReply(message: string) {
  return new Set(["co", "coa", "ok", "oke", "u", "uh", "tiep", "tiep di", "yes", "yep"]).has(normalize(message))
}
