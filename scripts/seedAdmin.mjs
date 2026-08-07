// One-time bootstrap for local development: creates the first Admin login
// directly in the Firebase Emulator Suite (Auth + Firestore). This is NOT
// business/demo data (no suppliers, POs, projects, etc.) - it only creates
// the account you need to sign in at all, since the app has no public
// sign-up screen (new users are meant to be provisioned by an Admin).
//
// Usage (with `firebase emulators:start` already running in another terminal):
//   npm run seed:admin
//   npm run seed:admin -- you@company.lk "SomePassword123"

import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const PROJECT_ID = 'demo-waterman-erp'
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099'
process.env.GCLOUD_PROJECT = PROJECT_ID

const email = process.argv[2] || 'admin@waterman.lk'
const password = process.argv[3] || 'Admin@12345'
const displayName = 'Admin User'

const app = initializeApp({ projectId: PROJECT_ID })
const auth = getAuth(app)
const db = getFirestore(app)

let userRecord
try {
  userRecord = await auth.getUserByEmail(email)
  console.log(`User already exists (${userRecord.uid}); updating role/claims.`)
} catch {
  userRecord = await auth.createUser({ email, password, displayName })
  console.log(`Created auth user ${userRecord.uid}.`)
}

await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' })

await db.doc(`users/${userRecord.uid}`).set(
  {
    displayName,
    email,
    role: 'admin',
    active: true,
    createdAt: Timestamp.now(),
  },
  { merge: true }
)

await db.doc('companies/main').set(
  {
    name: 'Waterman Construction (Pvt) Ltd',
    phone: '+94 11 234 5678',
    email: 'info@waterman.lk',
    tin: 'TIN-9876543',
    defaultVatPercent: 18,
    address: 'No. 45, Marine Drive, Colombo 3, Sri Lanka',
    currency: 'LKR',
  },
  { merge: true }
)

console.log('\nEmulator admin login ready:')
console.log(`  email:    ${email}`)
console.log(`  password: ${password}\n`)
process.exit(0)
