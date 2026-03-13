import QRCode from 'qrcode'
import LZString from 'lz-string'
import { APP_VERSION } from '@/utils/version'
import type { QRPayload } from '@/types'

// Compress a QR payload and generate a data URL image
export async function generateQRDataURL(payload: QRPayload): Promise<string> {
  const json = JSON.stringify(payload)
  const compressed = LZString.compressToBase64(json)
  return QRCode.toDataURL(compressed, {
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 2,
  })
}

// Decompress a QR string back into a payload
export function decodeQRPayload(data: string): QRPayload {
  const json = LZString.decompressFromBase64(data)
  if (!json) throw new Error('Failed to decompress QR data')
  return JSON.parse(json) as QRPayload
}

// Build an inscription QR payload from student form data
export function buildInscriptionPayload(data: QRPayload['data']): QRPayload {
  return {
    v: APP_VERSION,
    type: 'inscription',
    data,
  }
}

// --- Chunked QR codes for large payloads ---

const CHUNK_SIZE = 200 // max base64 chars per chunk (keeps QR very small)

export interface QRChunk {
  i: number  // 0-based index
  n: number  // total number of chunks
  d: string  // data fragment
}

// Split a payload into chunks
export function splitPayload(payload: QRPayload): string[] {
  const json = JSON.stringify(payload)
  const compressed = LZString.compressToBase64(json)
  const chunks: string[] = []
  const n = Math.ceil(compressed.length / CHUNK_SIZE)
  for (let i = 0; i < n; i++) {
    const fragment = compressed.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    chunks.push(JSON.stringify({ i, n, d: fragment }))
  }
  return chunks
}

// Generate QR data URLs for each chunk
export async function generateChunkedQRs(payload: QRPayload): Promise<string[]> {
  const chunkStrings = splitPayload(payload)
  return Promise.all(
    chunkStrings.map(s => QRCode.toDataURL(s, {
      errorCorrectionLevel: 'M',
      width: 300,
      margin: 2,
    })),
  )
}

// Parse a scanned string as a chunk (returns null if not a chunk)
export function parseChunk(data: string): QRChunk | null {
  try {
    const obj = JSON.parse(data)
    if (typeof obj.i === 'number' && typeof obj.n === 'number' && typeof obj.d === 'string') {
      return obj as QRChunk
    }
  } catch { /* not a chunk */ }
  return null
}

// Reassemble chunks into a QRPayload
export function reassembleChunks(chunks: Map<number, string>, total: number): QRPayload {
  let compressed = ''
  for (let i = 0; i < total; i++) {
    compressed += chunks.get(i) ?? ''
  }
  const json = LZString.decompressFromBase64(compressed)
  if (!json) throw new Error('Failed to decompress reassembled QR data')
  return JSON.parse(json) as QRPayload
}
