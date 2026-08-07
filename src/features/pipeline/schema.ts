import { z } from 'zod'

export const workItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  unit: z.string().min(1),
  qty: z.number().min(0),
  unitPrice: z.number().min(0),
})

export const milestoneSchema = z.object({
  label: z.string().min(1, 'Milestone label is required'),
  percent: z.number().min(0).max(100),
  dueDate: z.string().optional(),
})

export const quotationFormSchema = z
  .object({
    projectName: z.string().min(1, 'Project name is required'),
    category: z.string().optional(),
    constructionSiteId: z.string().optional(),
    validUntil: z.string().min(1, 'Valid-until date is required'),
    notes: z.string().optional(),

    customerCompanyName: z.string().min(1, 'Company / customer name is required'),
    customerContactName: z.string().optional(),
    customerPhone: z.string().optional(),
    customerEmail: z.string().optional(),
    customerAddress: z.string().optional(),

    workItems: z.array(workItemSchema).min(1, 'Add at least one work item'),

    vatEnabled: z.boolean(),
    vatPercent: z.number().min(0).max(100),
    advancePercent: z.number().min(0).max(100),

    milestones: z.array(milestoneSchema),
  })
  .refine(
    (data) => {
      const total = data.milestones.reduce((sum, m) => sum + (m.percent || 0), 0)
      return data.milestones.length === 0 || Math.abs(total - 100) < 0.01
    },
    { message: 'Milestones must total 100%', path: ['milestones'] }
  )

export type QuotationFormValues = z.infer<typeof quotationFormSchema>

export const defaultQuotationForm: QuotationFormValues = {
  projectName: '',
  category: '',
  constructionSiteId: '',
  validUntil: '',
  notes: '',
  customerCompanyName: '',
  customerContactName: '',
  customerPhone: '',
  customerEmail: '',
  customerAddress: '',
  workItems: [{ description: '', unit: 'SqFt', qty: 1, unitPrice: 0 }],
  vatEnabled: true,
  vatPercent: 18,
  advancePercent: 20,
  milestones: [
    { label: 'Advance Payment', percent: 20, dueDate: '' },
    { label: 'Mid-Progress', percent: 40, dueDate: '' },
    { label: 'Completion', percent: 40, dueDate: '' },
  ],
}

export const QUOTATION_CATEGORIES = ['Residential', 'Commercial', 'Industrial', 'Interior', 'Government', 'Infrastructure']

export function computePricing(values: Pick<QuotationFormValues, 'workItems' | 'vatEnabled' | 'vatPercent' | 'advancePercent'>) {
  const subtotal = values.workItems.reduce((sum, item) => sum + (item.qty || 0) * (item.unitPrice || 0), 0)
  const vatAmount = values.vatEnabled ? (subtotal * (values.vatPercent || 0)) / 100 : 0
  const grandTotal = subtotal + vatAmount
  const advanceRequired = (grandTotal * (values.advancePercent || 0)) / 100
  return { subtotal, vatAmount, grandTotal, advanceRequired }
}
