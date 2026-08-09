import * as XLSX from 'xlsx'
import pdfMake from 'pdfmake/build/pdfmake'
import vfsFonts from 'pdfmake/build/vfs_fonts'
import type { TDocumentDefinitions } from 'pdfmake/interfaces'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import { format } from 'date-fns'

let fontsRegistered = false
function ensureFonts() {
  if (fontsRegistered) return
  pdfMake.addVirtualFileSystem(vfsFonts as unknown as Record<string, string>)
  pdfMake.fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf',
    },
  }
  fontsRegistered = true
}

async function companyName(): Promise<string> {
  try {
    const snap = await getDoc(doc(db, 'companies/main'))
    return (snap.data()?.name as string) ?? 'Waterman Construction'
  } catch {
    return 'Waterman Construction'
  }
}

export function exportToExcel(fileName: string, sheetName: string, rows: Record<string, unknown>[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31))
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

export async function exportTableToPdf(fileName: string, title: string, headers: string[], rows: (string | number)[][]) {
  ensureFonts()
  const name = await companyName()
  const docDefinition: TDocumentDefinitions = {
    pageOrientation: 'landscape',
    header: { text: name, style: 'companyHeader', margin: [24, 16, 24, 0] },
    footer: (currentPage: number, pageCount: number) => ({
      text: `Page ${currentPage} of ${pageCount}`,
      alignment: 'right',
      style: 'footer',
      margin: [24, 0, 24, 12],
    }),
    content: [
      { text: title, style: 'header' },
      { text: `Generated on ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, style: 'subheader' },
      rows.length === 0
        ? { text: 'No records in this range.', italics: true, color: '#64748b', margin: [0, 8, 0, 0] }
        : {
            table: {
              headerRows: 1,
              widths: headers.map(() => '*'),
              body: [headers.map((h) => ({ text: h, style: 'tableHeader' })), ...rows.map((row) => row.map((cell) => String(cell)))],
            },
            layout: { fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f1f5f9' : rowIndex % 2 === 0 ? '#f8fafc' : null) },
          },
    ],
    styles: {
      companyHeader: { fontSize: 10, bold: true, color: '#0f1e3d' },
      header: { fontSize: 16, bold: true, margin: [0, 4, 0, 2] },
      subheader: { fontSize: 9, color: '#64748b', margin: [0, 0, 0, 12] },
      tableHeader: { bold: true, fillColor: '#f1f5f9' },
      footer: { fontSize: 8, color: '#94a3b8' },
    },
    defaultStyle: { fontSize: 9 },
  }
  pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`)
}
