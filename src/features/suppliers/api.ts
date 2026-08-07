import { addDoc, collection, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import type { Supplier } from '@/shared/types/entities'

export type NewSupplierInput = Omit<Supplier, 'outstandingBalance' | 'createdAt'>

export function addSupplier(data: NewSupplierInput) {
  return addDoc(collection(db, 'suppliers'), { ...data, outstandingBalance: 0, createdAt: Timestamp.now() })
}

export function updateSupplier(id: string, data: Partial<NewSupplierInput>) {
  return updateDoc(doc(db, 'suppliers', id), data)
}

export function deleteSupplier(id: string) {
  return deleteDoc(doc(db, 'suppliers', id))
}
