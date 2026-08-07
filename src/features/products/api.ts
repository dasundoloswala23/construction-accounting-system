import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import type { Product } from '@/shared/types/entities'

export function addProduct(data: Product) {
  return addDoc(collection(db, 'products'), data)
}

export function updateProduct(id: string, data: Partial<Product>) {
  return updateDoc(doc(db, 'products', id), data)
}

export function deleteProduct(id: string) {
  return deleteDoc(doc(db, 'products', id))
}

export const PRODUCT_CATEGORIES = ['Steel', 'Cement', 'Aggregate', 'Sand', 'Masonry', 'Wood', 'Electrical', 'Plumbing', 'Paint', 'Other']
export const PRODUCT_UNITS = ['Kg', 'Bag', 'Cube', 'Nos', 'Sheet', 'Litre', 'Roll', 'Box', 'Meter']
