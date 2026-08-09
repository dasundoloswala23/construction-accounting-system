import { collection, deleteDoc, doc, updateDoc, writeBatch, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import type { Labour } from '@/shared/types/entities'

export interface LabourFormInput {
  fullName: string
  phone?: string
  role: string
  constructionSiteId?: string
  siteName?: string
}

export function addLabour(input: LabourFormInput) {
  return addDoc(collection(db, 'labour'), {
    ...input,
    outstandingBalance: 0,
    totalPaidAllTime: 0,
  })
}

export function updateLabour(id: string, input: LabourFormInput) {
  return updateDoc(doc(db, 'labour', id), { ...input })
}

export function deleteLabour(id: string) {
  return deleteDoc(doc(db, 'labour', id))
}

export interface PayLabourInput {
  workerId: string
  amount: number
  constructionSiteId?: string
  notes: string
  paymentMethod: 'cash' | 'bank_transfer'
  bankAccountId?: string
  createdBy: string
}

export async function payLabour(input: PayLabourInput) {
  const batch = writeBatch(db)
  const date = Timestamp.now()
  const paymentRef = doc(collection(db, 'labour_payments'))
  batch.set(paymentRef, {
    workerId: input.workerId,
    amount: input.amount,
    date,
    constructionSiteId: input.constructionSiteId ?? '',
    notes: input.notes,
    createdBy: input.createdBy,
  })

  if (input.paymentMethod === 'bank_transfer' && input.bankAccountId) {
    batch.set(doc(collection(db, 'bank_transactions')), {
      bankAccountId: input.bankAccountId,
      type: 'debit',
      amount: input.amount,
      source: 'labour_payment',
      sourceRef: paymentRef.id,
      date,
      balanceAfter: 0, // filled in by onBankTransactionWrite
      createdBy: input.createdBy,
    })
  } else {
    batch.set(doc(collection(db, 'cash_transactions')), {
      type: 'debit',
      amount: input.amount,
      source: 'labour_payment',
      sourceRef: paymentRef.id,
      date,
      balanceAfter: 0, // filled in by onCashTransactionWrite
      createdBy: input.createdBy,
    })
  }

  await batch.commit()
  return paymentRef.id
}

export type { Labour }
