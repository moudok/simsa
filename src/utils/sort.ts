import type { Eleve, Grade } from '@/types'
import { GRADE_ORDER } from '@/types'

export interface SortedEntry {
  students: Eleve[] // 1 for solo, 2 for pair
  explicit: boolean // true if pair was explicitly requested
}

export interface SortedGroup {
  grade: Grade
  entries: SortedEntry[]
}

// Check if student A requested student B as partner
function requestsPartner(a: Eleve, b: Eleve): boolean {
  if (!a.binomePrenom || !a.binomeNom) return false
  return (
    a.binomePrenom.trim().toLowerCase() === b.prenom.trim().toLowerCase() &&
    a.binomeNom.trim().toLowerCase() === b.nom.trim().toLowerCase()
  )
}

// Step 1: Find explicit pairs (reciprocal requests, can cross grades)
function findExplicitPairs(students: Eleve[]): {
  pairs: { pair: [Eleve, Eleve]; grade: Grade }[]
  unpaired: Eleve[]
} {
  const paired = new Set<number>()
  const pairs: { pair: [Eleve, Eleve]; grade: Grade }[] = []

  for (const a of students) {
    if (paired.has(a.id) || !a.binomePrenom) continue

    const b = students.find(
      s => !paired.has(s.id) && s.id !== a.id && requestsPartner(a, s),
    )

    if (b && requestsPartner(b, a)) {
      // Reciprocal match — place in the lower grade
      const gradeA = GRADE_ORDER.indexOf(a.grade)
      const gradeB = GRADE_ORDER.indexOf(b.grade)
      const grade = gradeA <= gradeB ? a.grade : b.grade
      pairs.push({ pair: [a, b], grade })
      paired.add(a.id)
      paired.add(b.id)
    }
  }

  return { pairs, unpaired: students.filter(s => !paired.has(s.id)) }
}

// Step 2: Create implicit pairs from unpaired students within a grade
function createImplicitPairs(students: Eleve[]): {
  pairs: [Eleve, Eleve][]
  solos: Eleve[]
} {
  const available = [...students]
  const pairs: [Eleve, Eleve][] = []

  while (available.length >= 2) {
    const a = available.shift()!
    let bestIdx = -1
    let bestScore = -Infinity

    for (let i = 0; i < available.length; i++) {
      const b = available[i]
      const ageGap = Math.abs(a.anneeNaissance - b.anneeNaissance)
      let score = 0

      if (ageGap <= 10) {
        // Prefer same gender, then smaller age gap
        score = (a.genre === b.genre ? 100 : 50) - ageGap
      } else {
        // Large age gap — prefer closer age regardless of gender
        score = -ageGap
      }

      if (score > bestScore) {
        bestScore = score
        bestIdx = i
      }
    }

    if (bestIdx >= 0) {
      pairs.push([a, available.splice(bestIdx, 1)[0]])
    }
  }

  return { pairs, solos: available }
}

// Sort key for a single entry
function entrySortKey(entry: SortedEntry): { oldestBirthYear: number; name: string } {
  const oldestBirthYear = Math.min(...entry.students.map(s => s.anneeNaissance))
  const names = entry.students.map(s => `${s.nom}\0${s.prenom}`).sort()
  return { oldestBirthYear, name: names[0] }
}

// Step 3: Sort entries and apply cohesion (avoid isolated solos between pairs)
function sortAndApplyCohesion(entries: SortedEntry[]): SortedEntry[] {
  entries.sort((a, b) => {
    const ka = entrySortKey(a)
    const kb = entrySortKey(b)
    // Oldest first = smallest birth year first
    if (ka.oldestBirthYear !== kb.oldestBirthYear) return ka.oldestBirthYear - kb.oldestBirthYear
    return ka.name.localeCompare(kb.name)
  })

  if (entries.length <= 2) return entries

  // Move isolated solos (between two pairs) to end of pairs block
  const result: SortedEntry[] = []
  const deferred: SortedEntry[] = []

  for (let i = 0; i < entries.length; i++) {
    const prev = i > 0 ? entries[i - 1] : null
    const next = i < entries.length - 1 ? entries[i + 1] : null
    const curr = entries[i]
    const isSolo = curr.students.length === 1
    const prevIsPair = prev && prev.students.length === 2
    const nextIsPair = next && next.students.length === 2

    if (isSolo && prevIsPair && nextIsPair) {
      deferred.push(curr)
    } else {
      result.push(curr)
    }
  }

  result.push(...deferred)
  return result
}

// Main sorting function: returns students grouped by grade with pair info
export function sortStudents(students: Eleve[]): SortedGroup[] {
  const { pairs: explicitPairs, unpaired } = findExplicitPairs(students)
  const groups: SortedGroup[] = []

  for (const grade of GRADE_ORDER) {
    const gradePairs: SortedEntry[] = explicitPairs
      .filter(p => p.grade === grade)
      .map(p => ({ students: [...p.pair], explicit: true }))

    const gradeUnpaired = unpaired.filter(s => s.grade === grade)

    if (gradePairs.length === 0 && gradeUnpaired.length === 0) continue

    const { pairs: implicitPairList, solos } = createImplicitPairs(gradeUnpaired)

    const implicitPairs: SortedEntry[] = implicitPairList.map(p => ({
      students: [...p],
      explicit: false,
    }))

    const soloEntries: SortedEntry[] = solos.map(s => ({
      students: [s],
      explicit: false,
    }))

    const allEntries = [...gradePairs, ...implicitPairs, ...soloEntries]
    const sorted = sortAndApplyCohesion(allEntries)

    groups.push({ grade, entries: sorted })
  }

  return groups
}

// Flatten sorted groups into a simple ordered list
export function flattenSortedGroups(groups: SortedGroup[]): Eleve[] {
  return groups.flatMap(g => g.entries.flatMap(e => e.students))
}

// Find students who requested a partner that is not enrolled
export function findUnmatchedRequests(students: Eleve[]): Eleve[] {
  return students.filter(s => {
    if (!s.binomePrenom || !s.binomeNom) return false
    return !students.find(p => p.id !== s.id && requestsPartner(s, p))
  })
}
