import { doc, setDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/shared/lib/firebase'
import type { Company } from '@/shared/types/entities'
import type { Role } from '@/shared/lib/permissions'

export function updateCompany(data: Partial<Company>) {
  return setDoc(doc(db, 'companies/main'), data, { merge: true })
}

export interface CreateUserInput {
  email: string
  password: string
  displayName: string
  role: Role
  phone?: string
}

export async function createUser(input: CreateUserInput) {
  const fn = httpsCallable<CreateUserInput, { uid: string }>(functions, 'createUser')
  const { data } = await fn(input)
  return data
}

export async function setUserRole(uid: string, role: Role) {
  const fn = httpsCallable<{ uid: string; role: Role }, { ok: boolean }>(functions, 'setUserRole')
  await fn({ uid, role })
}

export async function setUserActive(uid: string, active: boolean) {
  const fn = httpsCallable<{ uid: string; active: boolean }, { ok: boolean }>(functions, 'setUserActive')
  await fn({ uid, active })
}
