export type Genre = 'homme' | 'femme' | 'autre' | 'non_renseigne'

export type Grade =
  | 'blanc'
  | 'jaune' | 'jaune+'
  | 'vert'  | 'vert+'
  | 'bleu'  | 'bleu+'
  | 'rouge' | 'rouge+' | 'rouge++'
  | 'noir'

export type Role = 'eleve' | 'maitre'

export type CodeLangue = string

export interface ConfigLangue {
  code: CodeLangue
  label: string
}

export interface Epreuve {
  id: number
  labels: Record<CodeLangue, string>
}

export interface Config {
  langues: ConfigLangue[]
  langueActive: CodeLangue
  epreuves: Epreuve[]
  dureesChrono: number[]
  elevesParLigne: number
}

export interface Eleve {
  id: number
  prenom: string
  nom: string
  grade: Grade
  anneeNaissance: number
  genre: Genre
  binomePrenom?: string
  binomeNom?: string
  consentementRGPD: boolean
}

export interface Note {
  jury: string
  eleveId: number
  epreuveId: number
  plus: number
  moins: number
}

export interface Session {
  id: string
  nom: string
  date: string
  eleves: Eleve[]
  notes: Note[]
  membres: string[]
  maitre: string
}

// Jury verdict (imported from jury QR)
export interface JuryVerdict {
  jury: string
  eleveId: number
  valide: boolean
}

// QR payload envelope
export interface QRPayload {
  v: string
  type: 'inscription' | 'config' | 'notes' | 'params' | 'results' | 'students'
  data: ElevePayload | ConfigPayload | NotesPayload | ParamsPayload | ResultsPayload | StudentsPayload
}

export type ElevePayload = Omit<Eleve, 'id'>

export interface ConfigPayload {
  epreuves: Epreuve[]
  eleves: Eleve[]
}

export interface NotesPayload {
  jury: string
  notes: Note[]
}

export interface ParamsPayload {
  epreuves: Epreuve[]
  dureesChrono: number[]
  elevesParLigne: number
  eleves?: Eleve[]
}

export interface StudentsPayload {
  eleves: Eleve[]
}

export interface ResultsPayload {
  jury: string
  notes: { eleveId: number, epreuveId: number, plus: number, moins: number }[]
  verdicts: { eleveId: number, valide: boolean }[]
  hash: string
  eleveIds: number[]
  epreuveIds: number[]
}

// Ordered list of belt grades
export const GRADE_ORDER: Grade[] = [
  'blanc',
  'jaune', 'jaune+',
  'vert', 'vert+',
  'bleu', 'bleu+',
  'rouge', 'rouge+', 'rouge++',
  'noir',
]

// Default epreuves
export const EPREUVES_DEFAUT: Epreuve[] = [
  { id: 1, labels: { fr: 'Théorie',          ko: '이론' } },
  { id: 2, labels: { fr: 'Kibon',            ko: '기본' } },
  { id: 3, labels: { fr: 'Poomsé',           ko: '품새' } },
  { id: 4, labels: { fr: 'Ho Shin Sool',     ko: '호신술' } },
  { id: 5, labels: { fr: 'Han Bon Kyorugi',  ko: '한번겨루기' } },
  { id: 6, labels: { fr: 'Casse',            ko: '격파' } },
  { id: 7, labels: { fr: 'Kyorugi (combat)', ko: '겨루기' } },
]

// Default config values
export const CONFIG_DEFAUT: Config = {
  langues: [
    { code: 'fr', label: 'Français' },
    { code: 'ko', label: '한국어' },
  ],
  langueActive: 'fr',
  epreuves: EPREUVES_DEFAUT,
  dureesChrono: [30, 60, 90, 120],
  elevesParLigne: 4,
}
