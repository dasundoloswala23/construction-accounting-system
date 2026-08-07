import { addDoc, collection, deleteDoc, doc, updateDoc, Timestamp, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import { nextFormattedNumber } from '@/shared/lib/sequence'
import type { Quotation, QuotationDocument, Project, PipelineStage } from '@/shared/types/entities'
import { PIPELINE_STAGES } from '@/shared/types/entities'
import { computePricing, type QuotationFormValues } from './schema'

export type QuotationStatus = Quotation['status']

function toQuotationDoc(values: QuotationFormValues, status: QuotationStatus, quotationNumber: string, createdBy: string) {
  const pricing = computePricing(values)
  return {
    quotationNumber,
    projectName: values.projectName,
    category: values.category ?? '',
    constructionSiteId: values.constructionSiteId ?? '',
    validUntil: Timestamp.fromDate(new Date(values.validUntil)),
    notes: values.notes ?? '',
    status,
    customer: {
      companyName: values.customerCompanyName,
      contactName: values.customerContactName ?? '',
      phone: values.customerPhone ?? '',
      email: values.customerEmail ?? '',
      address: values.customerAddress ?? '',
    },
    workItems: values.workItems.map((w) => ({ ...w, total: w.qty * w.unitPrice })),
    pricing: {
      vatEnabled: values.vatEnabled,
      vatPercent: values.vatPercent,
      subtotal: pricing.subtotal,
      vatAmount: pricing.vatAmount,
      advancePercent: values.advancePercent,
      advanceRequired: pricing.advanceRequired,
      grandTotal: pricing.grandTotal,
    },
    milestones: values.milestones.map((m) => ({
      label: m.label,
      percent: m.percent,
      dueDate: m.dueDate ? Timestamp.fromDate(new Date(m.dueDate)) : null,
      amount: (pricing.grandTotal * m.percent) / 100,
    })),
    documents: [] as QuotationDocument[],
    createdBy,
    updatedAt: serverTimestamp(),
  }
}

export async function createQuotation(values: QuotationFormValues, status: QuotationStatus, createdBy: string, documents: QuotationDocument[] = []) {
  const quotationNumber = await nextFormattedNumber('quotation', 'QTN')
  const payload = { ...toQuotationDoc(values, status, quotationNumber, createdBy), documents, createdAt: serverTimestamp() }
  const ref = await addDoc(collection(db, 'quotations'), payload)
  return ref.id
}

export async function updateQuotation(
  id: string,
  values: QuotationFormValues,
  status: QuotationStatus,
  createdBy: string,
  documents: QuotationDocument[]
) {
  const existing = await getDoc(doc(db, 'quotations', id))
  const quotationNumber = existing.data()?.quotationNumber ?? (await nextFormattedNumber('quotation', 'QTN'))
  const payload = { ...toQuotationDoc(values, status, quotationNumber, createdBy), documents }
  await updateDoc(doc(db, 'quotations', id), payload)
}

export function deleteQuotation(id: string) {
  return deleteDoc(doc(db, 'quotations', id))
}

export function submitQuotation(id: string) {
  return updateDoc(doc(db, 'quotations', id), { status: 'submitted', updatedAt: serverTimestamp() })
}

export function rejectQuotation(id: string) {
  return updateDoc(doc(db, 'quotations', id), { status: 'rejected', updatedAt: serverTimestamp() })
}

/** Approves the quotation and spawns the shared `projects` entity that the
 * Outstanding module and the rest of the pipeline board read/write from here on. */
export async function approveQuotation(quotationId: string) {
  const snap = await getDoc(doc(db, 'quotations', quotationId))
  const quotation = snap.data() as Quotation | undefined
  if (!quotation) throw new Error('Quotation not found')

  await updateDoc(doc(db, 'quotations', quotationId), { status: 'approved', updatedAt: serverTimestamp() })

  const project: Omit<Project, 'closedAt'> = {
    quotationId,
    quotationNumber: quotation.quotationNumber,
    projectName: quotation.projectName,
    poNumber: '',
    constructionSiteId: quotation.constructionSiteId ?? '',
    customer: quotation.customer,
    engineer: '',
    contractValue: quotation.pricing.grandTotal,
    advanceRequiredAmount: quotation.pricing.advanceRequired,
    vatPercent: quotation.pricing.vatPercent,
    pipelineStage: 'approved',
    receivedAmount: 0,
    outstandingAmount: quotation.pricing.grandTotal,
    overdueAmount: 0,
    status: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }
  const ref = await addDoc(collection(db, 'projects'), project)
  return ref.id
}

const STAGE_ORDER: PipelineStage[] = PIPELINE_STAGES.map((s) => s.key)

export function nextPipelineStage(current: PipelineStage): PipelineStage | null {
  const idx = STAGE_ORDER.indexOf(current)
  return idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null
}

export function advanceProjectStage(projectId: string, toStage: PipelineStage) {
  return updateDoc(doc(db, 'projects', projectId), { pipelineStage: toStage, updatedAt: serverTimestamp() })
}

export function setProjectPoNumber(projectId: string, poNumber: string) {
  return updateDoc(doc(db, 'projects', projectId), { poNumber, updatedAt: serverTimestamp() })
}

export function closeProject(projectId: string) {
  return updateDoc(doc(db, 'projects', projectId), { status: 'completed', closedAt: serverTimestamp(), updatedAt: serverTimestamp() })
}
