import { FieldValue, Timestamp, type Transaction } from 'firebase-admin/firestore'
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions'
import { db } from './admin.js'

/**
 * Every trigger below exists for one reason: the client is never allowed to
 * write outstandingAmount / receivedAmount / currentBalance / outstandingBalance /
 * spentToDate / totalPaidAllTime directly (see firestore.rules) — these are the
 * only code paths that can. Client code only ever writes the *event* docs
 * (a payment, a cheque status change, a PO, a labour payment); these triggers
 * fold those events into the running totals.
 */

// --- Project payments -> projects.receivedAmount / outstandingAmount ----------

export const onProjectPaymentWrite = onDocumentWritten('project_payments/{paymentId}', async (event) => {
  const before = event.data?.before.data()
  const after = event.data?.after.data()
  if (!after) return // deletes are not un-applied; payments are treated as append-only

  const justCompleted = after.status === 'completed' && before?.status !== 'completed'
  if (!justCompleted || !after.projectId) return // unassociated Income entries have no project to update

  const projectRef = db.doc(`projects/${after.projectId}`)
  // Empty on a project with no open invoices yet — the payment then applies to
  // the project as a whole exactly as it always has, and creditBalance never
  // moves. Only projects using per-invoice allocation take the extra branch below.
  const allocations: { invoiceId: string; amount: number }[] = after.allocations ?? []

  await db.runTransaction(async (tx: Transaction) => {
    const projectSnap = await tx.get(projectRef)
    if (!projectSnap.exists) return
    const project = projectSnap.data()!

    const invoiceRefs = allocations.map((a) => db.doc(`project_documents/${a.invoiceId}`))
    const invoiceSnaps = await Promise.all(invoiceRefs.map((ref) => tx.get(ref)))

    const receivedAmount = (project.receivedAmount ?? 0) + after.amount
    const outstandingAmount = Math.max(project.contractValue - receivedAmount, 0)
    const allocatedTotal = allocations.reduce((sum, a) => sum + a.amount, 0)
    const unallocated = allocations.length > 0 ? Math.max(after.amount - allocatedTotal, 0) : 0
    const creditBalance = (project.creditBalance ?? 0) + unallocated

    tx.update(projectRef, { receivedAmount, outstandingAmount, creditBalance, updatedAt: Timestamp.now() })

    allocations.forEach((alloc, i) => {
      const invoiceSnap = invoiceSnaps[i]
      if (!invoiceSnap.exists) return
      const invoice = invoiceSnap.data()!
      const invReceived = (invoice.receivedAmount ?? 0) + alloc.amount
      const invOutstanding = Math.max((invoice.invoiceAmount ?? 0) - invReceived, 0)
      tx.update(invoiceRefs[i], { receivedAmount: invReceived, outstandingAmount: invOutstanding })
    })
  })
})

// --- Cheque clearance -> bank ledger + source doc status -----------------------

export const onChequeStatusChange = onDocumentWritten('cheques/{chequeId}', async (event) => {
  const before = event.data?.before.data()
  const after = event.data?.after.data()
  if (!after) return

  const justCleared = after.status === 'cleared' && before?.status !== 'cleared'
  if (!justCleared) return

  if (after.bankAccountId) {
    await db.collection('bank_transactions').add({
      bankAccountId: after.bankAccountId,
      type: after.direction === 'incoming' ? 'credit' : 'debit',
      amount: after.amount,
      source: 'cheque_clearance',
      sourceRef: event.params.chequeId,
      date: Timestamp.now(),
      balanceAfter: 0, // filled in by onBankTransactionWrite
      createdBy: after.updatedBy ?? 'system',
    })
  }

  if (after.sourceType === 'purchase_order') {
    await db.doc(`purchase_orders/${after.sourceRef}`).update({ status: 'paid' })
  } else if (after.sourceType === 'project_payment') {
    await db.doc(`project_payments/${after.sourceRef}`).update({ status: 'completed' })
  }
})

// --- Bank ledger -> bank_accounts.currentBalance --------------------------------

export const onBankTransactionWrite = onDocumentCreated('bank_transactions/{txnId}', async (event) => {
  const txn = event.data?.data()
  if (!txn) return

  const accountRef = db.doc(`bank_accounts/${txn.bankAccountId}`)
  await db.runTransaction(async (tx: Transaction) => {
    const snap = await tx.get(accountRef)
    if (!snap.exists) return
    const current = snap.data()!.currentBalance ?? 0
    const balanceAfter = txn.type === 'credit' ? current + txn.amount : current - txn.amount
    tx.update(accountRef, { currentBalance: balanceAfter })
    tx.update(event.data!.ref, { balanceAfter })
  })
})

// --- Cash ledger -> cash_accounts/main.currentBalance ---------------------------

export const onCashTransactionWrite = onDocumentCreated('cash_transactions/{txnId}', async (event) => {
  const txn = event.data?.data()
  if (!txn) return

  const accountRef = db.doc('cash_accounts/main')
  await db.runTransaction(async (tx: Transaction) => {
    const snap = await tx.get(accountRef)
    const current = snap.exists ? (snap.data()!.currentBalance ?? 0) : 0
    const balanceAfter = txn.type === 'credit' ? current + txn.amount : current - txn.amount
    tx.set(accountRef, { currentBalance: balanceAfter }, { merge: true })
    tx.update(event.data!.ref, { balanceAfter })
  })
})

// --- Purchase orders -> supplier payables + site spend --------------------------

export const onPurchaseOrderWrite = onDocumentWritten('purchase_orders/{poId}', async (event) => {
  const before = event.data?.before.data()
  const after = event.data?.after.data()

  // Created
  if (after && !before) {
    const updates = [
      db.doc(`construction_sites/${after.constructionSiteId}`).update({ spentToDate: FieldValue.increment(after.grandTotal) }).catch(() => undefined),
    ]
    // A PO created already 'paid' (cash / bank transfer) settled in the same
    // batch that created it, so it never becomes a payable. Only the "Marked
    // paid" branch below reverses a payable, and it cannot fire for a PO that
    // was born paid — so the payable must never be added in the first place.
    if (after.status !== 'paid') {
      updates.push(
        db.doc(`suppliers/${after.supplierId}`).update({ outstandingBalance: FieldValue.increment(after.grandTotal) }).catch(() => undefined)
      )
    }
    await Promise.all(updates)
    return
  }

  // Marked paid
  if (before && after && before.status !== 'paid' && after.status === 'paid') {
    await db.doc(`suppliers/${after.supplierId}`).update({ outstandingBalance: FieldValue.increment(-after.grandTotal) }).catch(() => undefined)
    return
  }

  // Deleted - reverse the original commitment (and the payable if it was never paid)
  if (before && !after) {
    const updates = [db.doc(`construction_sites/${before.constructionSiteId}`).update({ spentToDate: FieldValue.increment(-before.grandTotal) }).catch(() => undefined)]
    if (before.status !== 'paid') {
      updates.push(db.doc(`suppliers/${before.supplierId}`).update({ outstandingBalance: FieldValue.increment(-before.grandTotal) }).catch(() => undefined))
    }
    await Promise.all(updates)
  }
})

// --- Labour payments -> labour balances -----------------------------------------

export const onLabourPaymentWrite = onDocumentCreated('labour_payments/{paymentId}', async (event) => {
  const payment = event.data?.data()
  if (!payment) return

  await db.doc(`labour/${payment.workerId}`).update({
    outstandingBalance: FieldValue.increment(-payment.amount),
    totalPaidAllTime: FieldValue.increment(payment.amount),
  })
})

// --- Daily overdue scan ------------------------------------------------------------

export const scanOverdue = onSchedule({ schedule: 'every day 06:00', timeZone: 'Asia/Colombo' }, async () => {
  const now = Timestamp.now()
  let flagged = 0

  const overdueCheques = await db.collection('cheques').where('status', 'in', ['pending', 'post_dated']).where('dueDate', '<', now).get()
  for (const doc of overdueCheques.docs) {
    const cheque = doc.data()
    await doc.ref.update({ status: 'overdue' })
    await db.collection('notifications').add({
      type: 'overdue',
      title: 'Cheque Overdue',
      description: `${cheque.party} — Cheque #${cheque.chequeNumber}`,
      amount: cheque.amount,
      refType: 'cheque',
      refId: doc.id,
      read: false,
      createdAt: now,
      actionType: 'None',
    })
    flagged++
  }

  const overduePayments = await db
    .collection('project_payments')
    .where('status', 'in', ['pending_clearance'])
    .where('expectedDate', '<', now)
    .get()
  for (const doc of overduePayments.docs) {
    const payment = doc.data()
    await doc.ref.update({ status: 'overdue' })
    await db.collection('notifications').add({
      type: 'overdue',
      title: 'Payment Overdue',
      description: `${payment.customerName ?? 'Customer'} — expected payment not received`,
      amount: payment.amount,
      refType: 'project_payment',
      refId: doc.id,
      read: false,
      createdAt: now,
      actionType: 'None',
    })
    flagged++
  }

  logger.info(`scanOverdue: flagged ${flagged} overdue item(s)`)
})
