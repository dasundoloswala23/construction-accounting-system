import { addDoc, collection, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore'
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

export function payLabour(workerId: string, amount: number, constructionSiteId: string | undefined, notes: string, createdBy: string) {
  return addDoc(collection(db, 'labour_payments'), {
    workerId,
    amount,
    date: Timestamp.now(),
    constructionSiteId: constructionSiteId ?? '',
    notes,
    createdBy,
  })
}

export type { Labour }
