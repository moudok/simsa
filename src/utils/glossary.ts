// @ts-ignore — YAML imported via custom Vite plugin
import glossaryData from '../../glossary.yaml'

export interface GlossaryEntry {
  latin: string
  hangul: string
}

const data = glossaryData as { terms: GlossaryEntry[] }
export const GLOSSARY: GlossaryEntry[] = data.terms

/**
 * Search glossary entries matching a query in either latin or hangul.
 * Returns entries sorted by relevance (starts-with first, then includes).
 */
export function searchGlossary(query: string, limit = 6): GlossaryEntry[] {
  if (!query || query.length === 0) return []
  const q = query.toLowerCase()
  const startsWithLatin: GlossaryEntry[] = []
  const startsWithHangul: GlossaryEntry[] = []
  const includesLatin: GlossaryEntry[] = []
  const includesHangul: GlossaryEntry[] = []

  for (const entry of GLOSSARY) {
    const latin = entry.latin.toLowerCase()
    const hangul = entry.hangul
    if (latin.startsWith(q)) startsWithLatin.push(entry)
    else if (hangul.startsWith(q)) startsWithHangul.push(entry)
    else if (latin.includes(q)) includesLatin.push(entry)
    else if (hangul.includes(q)) includesHangul.push(entry)
  }

  return [...startsWithLatin, ...startsWithHangul, ...includesLatin, ...includesHangul].slice(0, limit)
}
