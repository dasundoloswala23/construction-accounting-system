import { addDoc, collection, deleteDoc, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore'
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

export interface TransferFundsInput {
  fromAccountId: string
  toAccountId: string
  amount: number
  date: string
  reference?: string
}

/** Writes both sides of a bank-to-bank transfer as one atomic batch, sharing a
 * transferId. Each side is an ordinary bank_transactions doc — the existing
 * onBankTransactionWrite trigger rebalances each account independently, so no
 * new trigger is needed; the batch is what keeps the two writes atomic. */
export function transferBetweenBanks(input: TransferFundsInput, createdBy: string) {
  const batch = writeBatch(db)
  const transferRef = doc(collection(db, 'bank_transactions'))
  const transferId = transferRef.id
  const date = Timestamp.fromDate(new Date(input.date))

  batch.set(transferRef, {
    bankAccountId: input.fromAccountId,
    type: 'debit',
    amount: input.amount,
    source: 'bank_transfer',
    sourceRef: input.reference ?? '',
    transferId,
    date,
    balanceAfter: 0, // filled in by onBankTransactionWrite
    createdBy,
  })
  batch.set(doc(collection(db, 'bank_transactions')), {
    bankAccountId: input.toAccountId,
    type: 'credit',
    amount: input.amount,
    source: 'bank_transfer',
    sourceRef: input.reference ?? '',
    transferId,
    date,
    balanceAfter: 0, // filled in by onBankTransactionWrite
    createdBy,
  })

  return batch.commit()
}
