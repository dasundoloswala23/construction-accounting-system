import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Modal, Button, FileUpload } from '@/shared/components'
import { TextField, TextareaField } from '@/shared/components/form'
import { useFileUpload } from '@/shared/hooks/useFileUpload'
import { useAuth } from '@/app/providers/AuthProvider'
import type { Project } from '@/shared/types/entities'
import { todayInputValue } from '@/shared/lib/dates'
import { uploadInvoice } from '../api'

type ProjectWithId = Project & { id: string }

interface FormValues {
  invoiceNumber: string
  invoiceDate: string
  invoiceAmount: number
  comments?: string
}

export function UploadInvoiceModal({ open, onClose, project }: { open: boolean; onClose: () => void; project: ProjectWithId }) {
  const { user, appUser } = useAuth()
  const { uploadFile, uploading, progress } = useFileUpload()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues & { fileName?: string; downloadURL?: string }>({
    defaultValues: { invoiceNumber: '', invoiceDate: todayInputValue(), invoiceAmount: 0, comments: '' },
  })

  const fileName = watch('fileName')

  async function onFileSelected(file: File) {
    const { downloadURL, fileName } = await uploadFile(`projects/${project.id}/invoices`, file)
    setValue('downloadURL', downloadURL)
    setValue('fileName', fileName)
  }

  async function onSubmit(values: FormValues & { fileName?: string; downloadURL?: string }) {
    if (!values.downloadURL) {
      toast.error('Upload the invoice PDF first')
      return
    }
    try {
      await uploadInvoice(
        project.id,
        { ...values, downloadURL: values.downloadURL, fileName: values.fileName ?? 'invoice.pdf' },
        { uid: user?.uid ?? '', name: appUser?.displayName ?? 'Unknown' }
      )
      toast.success('Invoice uploaded')
      reset()
      onClose()
    } catch {
      toast.error('Could not upload invoice')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload Invoice"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            Save
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <TextField label="Invoice Number" required {...register('invoiceNumber')} />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Invoice Date" type="date" {...register('invoiceDate')} />
          <TextField label="Invoice Amount (LKR)" type="number" step="0.01" {...register('invoiceAmount', { valueAsNumber: true })} />
        </div>
        <FileUpload label="Upload PDF" fileName={fileName} progress={uploading ? progress : undefined} onFileSelected={onFileSelected} accept=".pdf" />
        <TextareaField label="Comments" {...register('comments')} />
      </form>
    </Modal>
  )
}
