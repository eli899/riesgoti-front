/** Archivos generados en memoria para adjuntarlos desde el selector de archivos, como haría una persona. */
export interface UploadFile {
  name: string
  mimeType: string
  buffer: Buffer
}

// PNG válido de 1×1 px (captura de pantalla mínima).
const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

export const screenshotPng = (name = 'captura-error.png'): UploadFile => ({
  name,
  mimeType: 'image/png',
  buffer: Buffer.from(PNG_1X1, 'base64'),
})

export const textLog = (name: string, content: string): UploadFile => ({
  name,
  mimeType: 'text/plain',
  buffer: Buffer.from(content, 'utf8'),
})

const escapePdfText = (text: string) => text.replace(/[\\()]/g, (c) => `\\${c}`)

/**
 * PDF de una página con texto extraíble (Helvetica, ASCII), con las tablas xref calculadas. Sirve para el pipeline
 * real PyMuPDF4LLM -> chunks -> FAISS; incluir un texto único evita el rechazo por hash duplicado.
 */
export function normativePdf(name: string, lines: string[]): UploadFile {
  const content = ['BT', '/F1 12 Tf', '14 TL', '72 760 Td', ...lines.map((l) => `(${escapePdfText(l)}) Tj T*`), 'ET'].join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'))
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`
  })
  const xrefAt = Buffer.byteLength(pdf, 'latin1')
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`
  return { name, mimeType: 'application/pdf', buffer: Buffer.from(pdf, 'latin1') }
}
