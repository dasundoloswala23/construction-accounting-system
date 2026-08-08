import * as XLSX from 'xlsx'
import pdfMake from 'pdfmake/build/pdfmake'
import vfsFonts from 'pdfmake/build/vfs_fonts'
import type { TDocumentDefinitions } from 'pdfmake/interfaces'

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

export function exportToExcel(fileName: string, sheetName: string, rows: Record<string, unknown>[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

export function exportTableToPdf(fileName: string, title: string, headers: string[], rows: (string | number)[][]) {
  ensureFonts()
  const docDefinition: TDocumentDefinitions = {
    pageOrientation: 'landscape',
    content: [
      { text: title, style: 'header' },
      {
        table: {
          headerRows: 1,
          widths: headers.map(() => '*'),
          body: [headers.map((h) => ({ text: h, style: 'tableHeader' })), ...rows.map((row) => row.map((cell) => String(cell)))],
        },
      },
    ],
    styles: {
      header: { fontSize: 16, bold: true, margin: [0, 0, 0, 12] },
      tableHeader: { bold: true, fillColor: '#f1f5f9' },
    },
    defaultStyle: { fontSize: 9 },
  }
  pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`)
}
