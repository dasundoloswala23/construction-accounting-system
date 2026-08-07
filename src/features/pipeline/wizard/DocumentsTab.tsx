import { Card, CardHeader, CardBody, FileUpload } from '@/shared/components'
import type { QuotationDocument, QuotationDocumentType } from '@/shared/types/entities'

const SLOTS: { type: QuotationDocumentType; label: string; hint: string }[] = [
  { type: 'boq', label: 'Quotation Reference Documents', hint: 'BOQ, drawings, scope documents' },
  { type: 'clientPO', label: 'Client Purchase Order', hint: 'PO received from client' },
  { type: 'siteSurvey', label: 'Site Survey Report', hint: 'Survey or site assessment' },
  { type: 'other', label: 'Other Attachments', hint: 'Any other relevant files' },
]

export function DocumentsTab({
  documents,
  uploadingType,
  progress,
  onUpload,
}: {
  documents: QuotationDocument[]
  uploadingType: QuotationDocumentType | null
  progress: number
  onUpload: (type: QuotationDocumentType, file: File) => void
}) {
  return (
    <Card>
      <CardHeader title="Supporting Documents" />
      <CardBody className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {SLOTS.map((slot) => {
          const existing = documents.find((d) => d.type === slot.type)
          return (
            <FileUpload
              key={slot.type}
              label={slot.label}
              hint={slot.hint + ' — PDF, JPG, XLSX up to 10MB'}
              fileName={existing?.fileName}
              progress={uploadingType === slot.type ? progress : undefined}
              onFileSelected={(file) => onUpload(slot.type, file)}
            />
          )
        })}
      </CardBody>
    </Card>
  )
}
