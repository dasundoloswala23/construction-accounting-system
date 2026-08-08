import { doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import type { ChequeStatus } from '@/shared/types/entities'

export function updateChequeStatus(id: string, status: ChequeStatus, date: string, updatedBy: string) {
  return updateDoc(doc(db, 'cheques', id), {
    status,
    updatedBy,
    ...(status === 'cleared' ? { clearedDate: Timestamp.fromDate(new Date(date)) } : {}),
  })
}
