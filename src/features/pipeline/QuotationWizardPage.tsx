import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Save, Send } from 'lucide-react'
import { Breadcrumb, Button, Tabs } from '@/shared/components'
import type { TabItem } from '@/shared/components'
import { useAuth } from '@/app/providers/AuthProvider'
import { useDocument } from '@/shared/hooks/useDocument'
import { useFileUpload } from '@/shared/hooks/useFileUpload'
import type { Quotation, QuotationDocument, QuotationDocumentType } from '@/shared/types/entities'
import { Timestamp } from 'firebase/firestore'
import { quotationFormSchema, defaultQuotationForm, type QuotationFormValues } from './schema'
import { createQuotation, updateQuotation } from './api'
import { ProjectTab } from './wizard/ProjectTab'
import { CustomerTab } from './wizard/CustomerTab'
import { WorkItemsTab } from './wizard/WorkItemsTab'
import { PricingTab } from './wizard/PricingTab'
import { MilestonesTab } from './wizard/MilestonesTab'
import { DocumentsTab } from './wizard/DocumentsTab'

const TABS: TabItem[] = [
  { key: 'project', label: 'Project' },
  { key: 'customer', label: 'Customer' },
  { key: 'workItems', label: 'Work Items' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'documents', label: 'Documents' },
]

function quotationToFormValues(q: Quotation): QuotationFormValues {
  return {
    projectName: q.projectName,
    category: q.category ?? '',
    constructionSiteId: q.constructionSiteId ?? '',
    validUntil: q.validUntil.toDate().toISOString().slice(0, 10),
    notes: q.notes ?? '',
    customerCompanyName: q.customer.companyName,
    customerContactName: q.customer.contactName ?? '',
    customerPhone: q.customer.phone ?? '',
    customerEmail: q.customer.email ?? '',
    customerAddress: q.customer.address ?? '',
    workItems: q.workItems.map((w) => ({ description: w.description, unit: w.unit, qty: w.qty, unitPrice: w.unitPrice })),
    vatEnabled: q.pricing.vatEnabled,
    vatPercent: q.pricing.vatPercent,
    advancePercent: q.pricing.advancePercent,
    milestones: q.milestones.map((m) => ({ label: m.label, percent: m.percent, dueDate: m.dueDate ? m.dueDate.toDate().toISOString().slice(0, 10) : '' })),
  }
}

export function QuotationWizardPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: existing, loading: loadingExisting } = useDocument<Quotation>(isEdit ? `quotations/${id}` : null)

  const [activeTab, setActiveTab] = useState('project')
  const [documents, setDocuments] = useState<QuotationDocument[]>([])
  const [uploadingType, setUploadingType] = useState<QuotationDocumentType | null>(null)
  const { uploadFile, progress } = useFileUpload()
  const draftId = useRef(existing ? id! : crypto.randomUUID())

  const {
    register,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: defaultQuotationForm,
  })

  useMemo(() => {
    if (existing) {
      reset(quotationToFormValues(existing))
      setDocuments(existing.documents ?? [])
    }
  }, [existing, reset])

  async function onUpload(type: QuotationDocumentType, file: File) {
    setUploadingType(type)
    try {
      const { downloadURL, fileName } = await uploadFile(`quotations/${draftId.current}/documents`, file)
      setDocuments((prev) => [
        ...prev.filter((d) => d.type !== type),
        { type, fileName, downloadURL, uploadedBy: user?.uid ?? '', uploadedAt: Timestamp.now() },
      ])
      toast.success('File uploaded')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploadingType(null)
    }
  }

  async function persist(status: 'draft' | 'submitted') {
    const values = watch()
    const parsed = status === 'submitted' ? quotationFormSchema.safeParse(values) : { success: true as const, data: values }
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Please check the form for errors')
      return
    }
    try {
      if (isEdit) {
        await updateQuotation(id!, values, status, user?.uid ?? '', documents)
      } else {
        await createQuotation(values, status, user?.uid ?? '', documents)
      }
      toast.success(status === 'submitted' ? 'Quotation submitted' : 'Draft saved')
      navigate('/business-pipeline')
    } catch {
      toast.error('Could not save quotation')
    }
  }

  if (isEdit && loadingExisting) return null

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Business Pipeline', to: '/business-pipeline' }, { label: isEdit ? 'Edit Quotation' : 'New Quotation' }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{isEdit ? 'Edit Quotation' : 'New Quotation'}</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/business-pipeline')}>
            Cancel
          </Button>
          <Button variant="outline" loading={isSubmitting} onClick={() => persist('draft')}>
            <Save className="h-4 w-4" /> Save Draft
          </Button>
          <Button loading={isSubmitting} onClick={() => persist('submitted')}>
            <Send className="h-4 w-4" /> Save & Submit
          </Button>
        </div>
      </div>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'project' && <ProjectTab register={register} errors={errors} />}
      {activeTab === 'customer' && <CustomerTab register={register} errors={errors} />}
      {activeTab === 'workItems' && <WorkItemsTab control={control} register={register} watch={watch} />}
      {activeTab === 'pricing' && <PricingTab register={register} watch={watch} />}
      {activeTab === 'milestones' && <MilestonesTab control={control} register={register} watch={watch} />}
      {activeTab === 'documents' && <DocumentsTab documents={documents} uploadingType={uploadingType} progress={progress} onUpload={onUpload} />}

      <div className="flex justify-between border-t border-[var(--border-default)] pt-4">
        <Button
          variant="outline"
          disabled={activeTab === TABS[0].key}
          onClick={() => setActiveTab(TABS[Math.max(0, TABS.findIndex((t) => t.key === activeTab) - 1)].key)}
        >
          Back
        </Button>
        {activeTab !== TABS[TABS.length - 1].key && (
          <Button onClick={() => setActiveTab(TABS[Math.min(TABS.length - 1, TABS.findIndex((t) => t.key === activeTab) + 1)].key)}>
            Next: {TABS[Math.min(TABS.length - 1, TABS.findIndex((t) => t.key === activeTab) + 1)].label}
          </Button>
        )}
      </div>
    </div>
  )
}
