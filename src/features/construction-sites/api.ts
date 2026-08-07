import { addDoc, collection, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import type { ConstructionSite } from '@/shared/types/entities'

export type SiteFormInput = {
  name: string
  location: string
  client: string
  description?: string
  startDate: string
  endDate: string
  budget: number
  status: ConstructionSite['status']
}

export function addSite(input: SiteFormInput) {
  return addDoc(collection(db, 'construction_sites'), {
    name: input.name,
    location: input.location,
    client: input.client,
    description: input.description ?? '',
    startDate: Timestamp.fromDate(new Date(input.startDate)),
    endDate: Timestamp.fromDate(new Date(input.endDate)),
    budget: Number(input.budget),
    spentToDate: 0,
    status: input.status,
  })
}

export function updateSite(id: string, input: SiteFormInput) {
  return updateDoc(doc(db, 'construction_sites', id), {
    name: input.name,
    location: input.location,
    client: input.client,
    description: input.description ?? '',
    startDate: Timestamp.fromDate(new Date(input.startDate)),
    endDate: Timestamp.fromDate(new Date(input.endDate)),
    budget: Number(input.budget),
    status: input.status,
  })
}

export function deleteSite(id: string) {
  return deleteDoc(doc(db, 'construction_sites', id))
}
