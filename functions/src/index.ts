import { Timestamp } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { auth, db } from './admin.js'

export {
  onProjectPaymentWrite,
  onChequeStatusChange,
  onBankTransactionWrite,
  onPurchaseOrderWrite,
  onLabourPaymentWrite,
  scanOverdue,
} from './triggers.js'

type Role = 'admin' | 'accountant' | 'manager'

async function assertCallerIsAdmin(callerUid: string | undefined): Promise<void> {
  if (!callerUid) throw new HttpsError('unauthenticated', 'Sign in required.')
  const callerDoc = await db.doc(`users/${callerUid}`).get()
  const caller = callerDoc.data()
  if (!caller || caller.role !== 'admin' || caller.active === false) {
    throw new HttpsError('permission-denied', 'Only an active Admin can perform this action.')
  }
}

/** Provisions a brand new login: creates the Auth account, sets the role custom
 *  claim, and writes the users/{uid} profile doc. Only callable by an Admin —
 *  there is no public sign-up screen in this app by design. */
export const createUser = onCall(async (request) => {
  await assertCallerIsAdmin(request.auth?.uid)

  const { email, password, displayName, role, phone } = request.data as {
    email: string
    password: string
    displayName: string
    role: Role
    phone?: string
  }

  if (!email || !password || !displayName || !role) {
    throw new HttpsError('invalid-argument', 'email, password, displayName and role are required.')
  }

  const userRecord = await auth.createUser({ email, password, displayName })
  await auth.setCustomUserClaims(userRecord.uid, { role })

  await db.doc(`users/${userRecord.uid}`).set({
    displayName,
    email,
    role,
    phone: phone ?? '',
    active: true,
    createdAt: Timestamp.now(),
  })

  return { uid: userRecord.uid }
})

/** Changes an existing user's role: keeps the Auth custom claim (enforced by
 *  Security Rules) and the Firestore profile doc (read by the UI) in sync. */
export const setUserRole = onCall(async (request) => {
  await assertCallerIsAdmin(request.auth?.uid)

  const { uid, role } = request.data as { uid: string; role: Role }
  if (!uid || !role) throw new HttpsError('invalid-argument', 'uid and role are required.')

  await auth.setCustomUserClaims(uid, { role })
  await db.doc(`users/${uid}`).update({ role })

  return { ok: true }
})

/** Activates/deactivates a login: disables the Auth account outright (blocks
 *  sign-in entirely) in addition to flipping the Firestore `active` flag. */
export const setUserActive = onCall(async (request) => {
  await assertCallerIsAdmin(request.auth?.uid)

  const { uid, active } = request.data as { uid: string; active: boolean }
  if (!uid || typeof active !== 'boolean') throw new HttpsError('invalid-argument', 'uid and active are required.')

  await auth.updateUser(uid, { disabled: !active })
  await db.doc(`users/${uid}`).update({ active })

  return { ok: true }
})
