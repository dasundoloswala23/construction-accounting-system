import { addDoc, collection, doc, writeBatch, updateDoc, Timestamp, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import { nextFormattedNumber } from '@/shared/lib/sequence'
import { logTimelineEvent } from '@/shared/lib/timeline'
import type { Actor } from '@/features/pipeline/api'
import type { PaymentAttachment, Project, Company, ProjectDocumentType, PaymentAllocation } from '@/shared/types/entities'

export interface ReceivePaymentInput {
  amount: number
  paymentType: 'cash' | 'bank_transfer' | 'cheque' | 'card'
  date: string
  cashReceivedBy?: string
  bankAccountId?: string
  bankName?: string
  referenceNumber?: string
  chequeNumber?: string
  chequeDate?: string
  chequeDueDate?: string
  /** Empty when the project has no open invoices — the payment then applies to
   * the project as a whole, exactly as before this field existed. */
  allocations?: PaymentAllocation[]
}

export async function receivePayment(
  project: Project & { id: string },
  input: ReceivePaymentInput,
  attachments: PaymentAttachment[],
  actor: Actor
) {
  const batch = writeBatch(db)
  const paymentRef = doc(collection(db, 'project_payments'))
  const date = Timestamp.fromDate(new Date(input.date))

  const isCheque = input.paymentType === 'cheque'
  const status = isCheque ? 'pending_clearance' : 'completed'

  batch.set(paymentRef, {
    projectId: project.id,
    projectName: project.projectName,
    customerName: project.customer.companyName,
    date,
    amount: input.amount,
    paymentType: input.paymentType,
    cashReceivedBy: input.paymentType === 'cash' ? input.cashReceivedBy ?? '' : '',
    bankAccountId: input.paymentType === 'bank_transfer' ? input.bankAccountId ?? '' : '',
    referenceNumber: input.paymentType === 'bank_transfer' ? input.referenceNumber ?? '' : '',
    receivedBy: actor.uid,
    status,
    attachments,
    allocations: input.allocations ?? [],
    createdAt: Timestamp.now(),
  })

  if (input.paymentType === 'bank_transfer' && input.bankAccountId) {
    const txnRef = doc(collection(db, 'bank_transactions'))
    batch.set(txnRef, {
      bankAccountId: input.bankAccountId,
      type: 'credit',
      amount: input.amount,
      source: 'project_payment',
      sourceRef: paymentRef.id,
      date,
      balanceAfter: 0, // filled in by onBankTransactionWrite
      createdBy: actor.uid,
    })
  } else if (input.paymentType === 'cash') {
    const txnRef = doc(collection(db, 'cash_transactions'))
    batch.set(txnRef, {
      type: 'credit',
      amount: input.amount,
      source: 'project_payment',
      sourceRef: paymentRef.id,
      date,
      balanceAfter: 0, // filled in by onCashTransactionWrite
      createdBy: actor.uid,
    })
  }

  if (isCheque && input.chequeNumber) {
    const chequeRef = doc(collection(db, 'cheques'))
    batch.update(paymentRef, { chequeId: chequeRef.id })
    batch.set(chequeRef, {
      direction: 'incoming',
      sourceType: 'project_payment',
      sourceRef: paymentRef.id,
      party: project.customer.companyName,
      bank: input.bankName ?? '',
      bankAccountId: input.bankAccountId ?? '',
      chequeNumber: input.chequeNumber,
      chequeDate: Timestamp.fromDate(new Date(input.chequeDate || input.date)),
      dueDate: Timestamp.fromDate(new Date(input.chequeDueDate || input.date)),
      amount: input.amount,
      reference: project.quotationNumber,
      status: 'pending',
      updatedBy: actor.uid,
      createdAt: Timestamp.now(),
    })
  }

  await batch.commit()

  // Re-read the project instead of trusting the possibly-stale `project` prop
  // the modal was opened with — this is only a cosmetic timeline label
  // (advance/progress/final), never the money itself, which the
  // onProjectPaymentWrite trigger always recomputes from a fresh transactional
  // read regardless of what happens here.
  const freshProjectSnap = await getDoc(doc(db, 'projects', project.id))
  const freshProject = freshProjectSnap.data() as Project | undefined
  const currentReceived = freshProject?.receivedAmount ?? project.receivedAmount
  const willBeFullyPaid = currentReceived + input.amount >= project.contractValue
  const isFirstPayment = currentReceived === 0
  await logTimelineEvent(
    project.id,
    willBeFullyPaid ? 'final_payment' : isFirstPayment ? 'advance_received' : 'progress_payment',
    actor.uid,
    actor.name,
    { amount: input.amount }
  )

  return paymentRef.id
}

export interface UploadInvoiceInput {
  invoiceNumber: string
  invoiceDate: string
  invoiceAmount: number
  comments?: string
  downloadURL: string
  fileName: string
}

export async function uploadInvoice(projectId: string, input: UploadInvoiceInput, actor: Actor) {
  await addDoc(collection(db, 'project_documents'), {
    projectId,
    type: 'invoice',
    fileName: input.fileName,
    downloadURL: input.downloadURL,
    uploadedBy: actor.uid,
    uploadedAt: Timestamp.now(),
    comments: input.comments ?? '',
    invoiceNumber: input.invoiceNumber,
    invoiceDate: Timestamp.fromDate(new Date(input.invoiceDate)),
    invoiceAmount: input.invoiceAmount,
    receivedAmount: 0,
    outstandingAmount: input.invoiceAmount,
  })
  await logTimelineEvent(projectId, 'invoice_uploaded', actor.uid, actor.name, { invoiceNumber: input.invoiceNumber })
}

export async function uploadProjectDocument(
  projectId: string,
  type: ProjectDocumentType,
  downloadURL: string,
  fileName: string,
  actor: Actor,
  comments?: string
) {
  await addDoc(collection(db, 'project_documents'), {
    projectId,
    type,
    fileName,
    downloadURL,
    uploadedBy: actor.uid,
    uploadedAt: Timestamp.now(),
    comments: comments ?? '',
  })
  if (type === 'customerPO') await logTimelineEvent(projectId, 'po_uploaded', actor.uid, actor.name)
}

export function deleteProjectDocument(id: string) {
  return deleteDoc(doc(db, 'project_documents', id))
}

export async function generateReceipt(project: Project & { id: string }, paymentId: string, amount: number, method: string, reference: string, actor: Actor) {
  const companySnap = await getDoc(doc(db, 'companies/main'))
  const company = companySnap.data() as Company | undefined
  const receiptNo = await nextFormattedNumber('receipt', 'RCP')

  const receiptRef = await addDoc(collection(db, 'receipts'), {
    receiptNo,
    projectId: project.id,
    paymentId,
    customerName: project.customer.companyName,
    projectName: project.projectName,
    invoiceRef: project.quotationNumber,
    amount,
    method,
    reference,
    date: Timestamp.now(),
    companySnapshot: { name: company?.name ?? '', tin: company?.tin ?? '', address: company?.address ?? '' },
    createdAt: Timestamp.now(),
  })
  await logTimelineEvent(project.id, 'receipt_generated', actor.uid, actor.name, { receiptNo })
  return { id: receiptRef.id, receiptNo }
}

export function setProjectEngineer(projectId: string, engineer: string) {
  return updateDoc(doc(db, 'projects', projectId), { engineer })
}
