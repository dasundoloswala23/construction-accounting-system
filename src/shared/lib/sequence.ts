import { doc, runTransaction } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Gap-free, collision-free sequence numbers (quotation/PO/receipt numbers)
 * via a Firestore transaction on `counters/{name}` — atomicity comes from
 * the transaction itself, not from running server-side, so this is safe
 * to call directly from the client for what is ultimately just a display
 * reference number (not a money-bearing derived field).
 */
export async function getNextSequence(name: string): Promise<number> {
  const ref = doc(db, 'counters', name)
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const next = (snap.data()?.value ?? 0) + 1
    tx.set(ref, { value: next }, { merge: true })
    return next
  })
}

export async function nextFormattedNumber(counterName: string, prefix: string): Promise<string> {
  const year = new Date().getFullYear()
  const seq = await getNextSequence(`${counterName}_${year}`)
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`
}
