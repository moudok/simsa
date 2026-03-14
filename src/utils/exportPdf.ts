import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Eleve, Epreuve, Note, JuryVerdict } from '@/types'
import { GRADE_ORDER } from '@/types'

interface ExportOptions {
  eleves: Eleve[]
  epreuves: Epreuve[]
  notes: Note[]
  verdicts: Record<number, 'pending' | 'passed' | 'failed'>
  juryVerdicts: JuryVerdict[]
  getEpreuveLabel: (id: number) => string
  getGradeLabel: (grade: string) => string
  verdictLabel: string
}

function drawCheck(doc: jsPDF, cx: number, cy: number, size: number, color: [number, number, number] = [56, 142, 60]) {
  doc.setDrawColor(...color)
  doc.setLineWidth(0.6)
  const s = size / 2
  doc.line(cx - s * 0.5, cy, cx - s * 0.1, cy + s * 0.5)
  doc.line(cx - s * 0.1, cy + s * 0.5, cx + s * 0.6, cy - s * 0.5)
}

function drawCross(doc: jsPDF, cx: number, cy: number, size: number, color: [number, number, number] = [198, 40, 40]) {
  doc.setDrawColor(...color)
  doc.setLineWidth(0.6)
  const s = size / 2 * 0.5
  doc.line(cx - s, cy - s, cx + s, cy + s)
  doc.line(cx + s, cy - s, cx - s, cy + s)
}

export function exportResultsPdf(options: ExportOptions) {
  const { eleves, epreuves, notes, verdicts, juryVerdicts, getEpreuveLabel, getGradeLabel, verdictLabel } = options

  // Sort students: grade ascending, then alphabetical (prenom, nom)
  const sorted = [...eleves].sort((a, b) => {
    const ga = GRADE_ORDER.indexOf(a.grade)
    const gb = GRADE_ORDER.indexOf(b.grade)
    if (ga !== gb) return ga - gb
    const prenomCmp = a.prenom.localeCompare(b.prenom)
    if (prenomCmp !== 0) return prenomCmp
    return a.nom.localeCompare(b.nom)
  })

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Table headers — French labels only
  const head: string[][] = [[
    'Prénom', 'Nom', 'Année', 'Grade',
    ...epreuves.map(e => getEpreuveLabel(e.id)),
    verdictLabel,
  ]]

  // Helper: get distinct jury names that have notes or verdicts for a student
  function getJuriesForEleve(eleveId: number): string[] {
    const names = new Set<string>()
    for (const n of notes) {
      if (n.eleveId === eleveId && (n.plus > 0 || n.moins > 0)) names.add(n.jury)
    }
    for (const v of juryVerdicts) {
      if (v.eleveId === eleveId) names.add(v.jury)
    }
    return [...names]
  }

  // Track which rows are jury sub-rows (for styling)
  const juryRowIndices = new Set<number>()
  const mainRowIndices = new Set<number>()
  // Map row index → student index (for alternating colors per student)
  const rowStudentIndex = new Map<number, number>()

  // Table body — main rows + jury sub-rows
  const body: string[][] = []
  let studentIdx = 0
  for (const eleve of sorted) {
    mainRowIndices.add(body.length)
    rowStudentIndex.set(body.length, studentIdx)
    // Main row
    const row: string[] = [
      eleve.prenom,
      eleve.nom,
      String(eleve.anneeNaissance),
      getGradeLabel(eleve.grade),
    ]
    for (const ep of epreuves) {
      const eleveNotes = notes.filter(n => n.eleveId === eleve.id && n.epreuveId === ep.id)
      const plus = eleveNotes.reduce((s, n) => s + n.plus, 0)
      const moins = eleveNotes.reduce((s, n) => s + n.moins, 0)
      row.push(`${plus}|${moins}`)
    }
    const v = verdicts[eleve.id] ?? 'pending'
    row.push(v === 'passed' ? 'V' : v === 'failed' ? 'X' : '')
    body.push(row)

    // Jury sub-rows (skip "Maître" — already in the main row)
    const juries = getJuriesForEleve(eleve.id).filter(j => j !== 'Maître')
    for (const jury of juries) {
      juryRowIndices.add(body.length)
      rowStudentIndex.set(body.length, studentIdx)
      const juryRow: string[] = [jury, '', '', '']
      for (const ep of epreuves) {
        const note = notes.find(
          n => n.jury === jury && n.eleveId === eleve.id && n.epreuveId === ep.id,
        )
        const plus = note ? note.plus : 0
        const moins = note ? note.moins : 0
        juryRow.push(`${plus}|${moins}`)
      }
      const jv = juryVerdicts.find(jv => jv.jury === jury && jv.eleveId === eleve.id)
      juryRow.push(jv ? (jv.valide ? 'V' : 'X') : '')
      body.push(juryRow)
    }
    studentIdx++
  }

  // Total rows count for bottom border
  const totalRows = body.length

  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  const firstEpreuveCol = 4
  const verdictCol = firstEpreuveCol + epreuves.length
  const verdictColWidth = 15
  const fixedColsWidth = 25 + 25 + 10 + 18 + verdictColWidth
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginH = 14 * 2
  const epreuveColWidth = epreuves.length > 0
    ? (pageWidth - marginH - fixedColsWidth) / epreuves.length
    : 20

  const colStyles: Record<number, { cellWidth: number; halign?: 'left' | 'center' | 'right' }> = {
    0: { cellWidth: 25 },
    1: { cellWidth: 25 },
    2: { cellWidth: 10, halign: 'center' },
    3: { cellWidth: 18 },
  }
  for (let i = 0; i < epreuves.length; i++) {
    colStyles[firstEpreuveCol + i] = { cellWidth: epreuveColWidth }
  }
  colStyles[verdictCol] = { cellWidth: verdictColWidth, halign: 'center' }

  autoTable(doc, {
    head,
    body,
    startY: 10,
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      lineWidth: 0,
    },
    headStyles: {
      fillColor: [60, 60, 60],
      fontSize: 6,
      halign: 'center',
    },
    columnStyles: colStyles,
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0,
    didParseCell: (data) => {
      if (data.section !== 'body') return
      // Alternate fill color per student (not per row)
      const sIdx = rowStudentIndex.get(data.row.index) ?? 0
      data.cell.styles.fillColor = sIdx % 2 === 0 ? [240, 240, 240] : [255, 255, 255]
      // Suppress autoTable text for custom-drawn cells
      const col = data.column.index
      const isJury = juryRowIndices.has(data.row.index)
      if (col >= firstEpreuveCol || (isJury && col === 0)) {
        data.cell.text = ['']
      }
    },
    didDrawPage: () => {},
    didDrawCell: (data) => {
      const col = data.column.index
      const x = data.cell.x
      const y = data.cell.y
      const w = data.cell.width
      const h = data.cell.height
      const rowIdx = data.row.index
      const isJuryRow = juryRowIndices.has(rowIdx)

      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.15)

      if (col === 0) {
        doc.line(x, y, x, y + h)
      }

      if (col >= 2) {
        doc.line(x + w, y, x + w, y + h)
      }

      if (data.section === 'body' && rowIdx === totalRows - 1) {
        doc.line(x, y + h, x + w, y + h)
      }

      if (data.section !== 'body') return

      // Jury sub-row: first cell (jury name) styling
      if (isJuryRow && col === 0) {
        doc.setFontSize(5.5)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(120, 120, 120)
        doc.text('  ' + (data.cell.raw as string), x + 2, y + h / 2 + 1)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        return
      }

      if (col < firstEpreuveCol) return

      const fontSize = isJuryRow ? 5.5 : 7
      const greyColor: [number, number, number] = [150, 150, 150]

      // Verdict column
      if (col === verdictCol) {
        const raw = (data.cell.raw as string)

        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.15)
        doc.line(x + w, y, x + w, y + h)

        if (raw === 'V') {
          const iconColor = isJuryRow ? greyColor : [56, 142, 60] as [number, number, number]
          drawCheck(doc, x + w / 2, y + h / 2, isJuryRow ? h * 0.4 : h * 0.6, iconColor)
        } else if (raw === 'X') {
          const iconColor = isJuryRow ? greyColor : [198, 40, 40] as [number, number, number]
          drawCross(doc, x + w / 2, y + h / 2, isJuryRow ? h * 0.4 : h * 0.6, iconColor)
        }
        return
      }

      // Epreuve columns
      const raw = data.cell.raw as string
      const [plusStr, moinsStr] = raw.split('|')
      const plus = parseInt(plusStr)
      const moins = parseInt(moinsStr)

      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.15)
      doc.line(x + w, y, x + w, y + h)
      if (col === firstEpreuveCol) {
        doc.line(x, y, x, y + h)
      }

      const textY = y + h / 2 + 1.5
      doc.setFontSize(fontSize)
      if (isJuryRow) doc.setTextColor(120, 120, 120)
      else doc.setTextColor(0, 0, 0)

      if (plus > 0) {
        doc.setFont('helvetica', isJuryRow ? 'normal' : 'bold')
        doc.text(`${plus}+`, x + 2, textY)
      }

      if (moins > 0) {
        doc.setFont('helvetica', 'normal')
        doc.text(`${moins}-`, x + w - 2, textY, { align: 'right' })
      }

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
    },
    margin: { top: 15, bottom: 15 },
  })

  // Footer on every page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pH = doc.internal.pageSize.getHeight()
    const pW = doc.internal.pageSize.getWidth()
    doc.setFontSize(8)
    doc.text(dateStr, 14, pH - 7)
    doc.text('Simsa — Résultats', pW / 2, pH - 7, { align: 'center' })
    doc.text(`${i} / ${pageCount}`, pW - 14, pH - 7, { align: 'right' })
  }

  const now = new Date()
  const fileDate = now.getFullYear().toString()
    + (now.getMonth() + 1).toString().padStart(2, '0')
    + now.getDate().toString().padStart(2, '0')
  doc.save(`simsa-resultats-${fileDate}.pdf`)
}
