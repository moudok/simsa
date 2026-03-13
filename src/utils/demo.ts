import type { Eleve, Grade, Genre } from '@/types'
import { GRADE_ORDER } from '@/types'

// French first names
const PRENOMS_FR_H = [
  'Jean', 'Pierre', 'Louis', 'Michel', 'François', 'Thomas', 'Nicolas', 'Antoine',
  'Mathieu', 'Lucas', 'Hugo', 'Raphaël', 'Léo', 'Gabriel', 'Arthur', 'Julien',
  'Maxime', 'Alexandre', 'Étienne', 'Clément', 'Théo', 'Adrien', 'Bastien', 'Romain',
  'Yann', 'Erwan', 'Tristan', 'Florian', 'Quentin', 'Valentin',
]
const PRENOMS_FR_F = [
  'Marie', 'Sophie', 'Camille', 'Julie', 'Léa', 'Manon', 'Chloé', 'Emma',
  'Sarah', 'Inès', 'Clara', 'Alice', 'Louise', 'Jade', 'Zoé', 'Charlotte',
  'Juliette', 'Margaux', 'Anaïs', 'Élise', 'Océane', 'Mathilde', 'Pauline', 'Laura',
  'Aurélie', 'Élodie', 'Marine', 'Nathalie', 'Céline', 'Lucie',
]

// Korean first names
const PRENOMS_KO_H = [
  'Minho', 'Jinhyuk', 'Seojun', 'Dohyun', 'Jiho', 'Hyunwoo', 'Taeyang', 'Junhee',
  'Sungmin', 'Wonsik', 'Youngho', 'Dongwook', 'Kyungho', 'Jaemin', 'Siwoo', 'Hajun',
  'Yejun', 'Eunwoo', 'Dokyun', 'Sungjin',
]
const PRENOMS_KO_F = [
  'Jiyeon', 'Minji', 'Soyeon', 'Yuna', 'Hayeon', 'Eunji', 'Dahee', 'Soojin',
  'Nayoung', 'Hyejin', 'Yerin', 'Chaewon', 'Seoyeon', 'Jiwoo', 'Subin', 'Yujin',
  'Haeun', 'Sieun', 'Minseo', 'Jihye',
]

// French surnames
const NOMS_FR = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Richard', 'Durand',
  'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David',
  'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Mercier',
  'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez', 'Legrand',
]

// Korean surnames
const NOMS_KO = [
  'Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon',
  'Jang', 'Lim', 'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang',
  'Ahn', 'Song', 'Yoo', 'Hong',
]

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Gaussian random using Box-Muller transform
function gaussianYear(meanAge: number, stddev: number, minAge: number, maxAge: number): number {
  const currentYear = new Date().getFullYear()
  let age: number
  do {
    const u1 = Math.random()
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    age = Math.round(meanAge + z * stddev)
  } while (age < minAge || age > maxAge)
  return currentYear - age
}

function randomName(genre: Genre): { prenom: string; nom: string } {
  const isKorean = Math.random() < 0.3
  let prenom: string
  if (genre === 'homme') {
    prenom = isKorean ? pick(PRENOMS_KO_H) : pick(PRENOMS_FR_H)
  } else {
    prenom = isKorean ? pick(PRENOMS_KO_F) : pick(PRENOMS_FR_F)
  }
  const nom = isKorean ? pick(NOMS_KO) : pick(NOMS_FR)
  return { prenom, nom }
}

const TOTAL_DEMO_STUDENTS = 32

function makeStudent(grade: Grade): Omit<Eleve, 'id'> {
  const genre: Genre = Math.random() < 0.5 ? 'homme' : 'femme'
  const { prenom, nom } = randomName(genre)
  const anneeNaissance = gaussianYear(25, 12, 6, 70)
  return { prenom, nom, grade, anneeNaissance, genre, consentementRGPD: true }
}

export function generateDemoStudents(): Omit<Eleve, 'id'>[] {
  const grades: Grade[] = GRADE_ORDER

  // Distribute slots: at least 2 per grade, then randomly add remaining
  const counts = grades.map(() => 2)
  let remaining = TOTAL_DEMO_STUDENTS - grades.length * 2
  while (remaining > 0) {
    const idx = Math.floor(Math.random() * grades.length)
    counts[idx]++
    remaining--
  }

  const students: Omit<Eleve, 'id'>[] = []
  for (let g = 0; g < grades.length; g++) {
    for (let i = 0; i < counts[g]; i++) {
      students.push(makeStudent(grades[g]))
    }
  }

  // Randomly assign binomes (~30% chance) among same grade + same genre
  const paired = new Set<number>()
  for (let i = 0; i < students.length; i++) {
    if (paired.has(i) || Math.random() > 0.3) continue
    const s = students[i]
    const candidates = students
      .map((c, idx) => ({ c, idx }))
      .filter(({ c, idx }) => idx !== i && !paired.has(idx) && c.grade === s.grade && c.genre === s.genre)
    if (candidates.length === 0) continue
    const { c: partner, idx: pi } = pick(candidates)
    // Reciprocal request
    s.binomePrenom = partner.prenom
    s.binomeNom = partner.nom
    partner.binomePrenom = s.prenom
    partner.binomeNom = s.nom
    paired.add(i)
    paired.add(pi)
  }

  return students
}
