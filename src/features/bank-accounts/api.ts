import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import type { BankAccount } from '@/shared/types/entities'

export type BankAccountFormInput = {
  bankName: string
  accountNumber: string
  branch?: string
  openingBalance: number
  description?: string
  status: BankAccount['status']
}

export function addBankAccount(input: BankAccountFormInput) {
  return addDoc(collection(db, 'bank_accounts'), {
    bankName: input.bankName,
    accountNumber: input.accountNumber,
    branch: input.branch ?? '',
    openingBalance: Number(input.openingBalance),
    // Seed value only — once bank_transactions start flowing (Income/PO/Cheque
    // modules), currentBalance is exclusively Cloud-Function maintained; the
    // Firestore rules block any client `update` from touching this field.
    currentBalance: Number(input.openingBalance),
    description: input.description ?? '',
    status: input.status,
  })
}

export function updateBankAccount(id: string, input: BankAccountFormInput) {
  return updateDoc(doc(db, 'bank_accounts', id), {
    bankName: input.bankName,
    accountNumber: input.accountNumber,
    branch: input.branch ?? '',
    openingBalance: Number(input.openingBalance),
    description: input.description ?? '',
    status: input.status,
  })
}

export function deleteBankAccount(id: string) {
  return deleteDoc(doc(db, 'bank_accounts', id))
}
