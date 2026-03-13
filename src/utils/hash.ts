/**
 * Compute a deterministic hash from student IDs and epreuve IDs.
 * Used to verify data consistency between jury export and master import.
 */
export function computeDataHash(eleveIds: number[], epreuveIds: number[]): string {
  const str = JSON.stringify({
    e: [...eleveIds].sort((a, b) => a - b),
    p: [...epreuveIds].sort((a, b) => a - b),
  })
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0
  }
  return (h >>> 0).toString(36)
}
