// One-time bootstrap for the LIVE Firebase project: creates the first Admin
// login using a service-account key you generate yourself (Firebase Console ->
// Project Settings -> Service Accounts -> Generate new private key). Run this
// once, then delete the key file — it is never read by the running app.
//
// Usage:
//   node scripts/seedProdAdmin.mjs <path-to-service-account.json> <email> <password> ["Display Name"]
//
// Example:
//   node scripts/seedProdAdmin.mjs ./secrets/watermansystem-key.json admin@waterman.lk "Str0ng!Passw0rd"

import { readFileSync } from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const [, , keyPath, email, password, displayName = 'Admin User'] = process.argv

if (!keyPath || !email || !password) {
  console.error('Usage: node scripts/seedProdAdmin.mjs <path-to-service-account.json> <email> <password> ["Display Name"]')
  process.exit(1)
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))

const app = initializeApp({ credential: cert(serviceAccount) })
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

// Only seed placeholder company details if nothing real has been entered yet.
const companyDoc = await db.doc('companies/main').get()
if (!companyDoc.exists) {
  await db.doc('companies/main').set({
    name: 'Waterman Construction (Pvt) Ltd',
    phone: '',
    email: '',
    tin: '',
    defaultVatPercent: 18,
    address: '',
    currency: 'LKR',
  })
}

console.log('\nProduction admin login ready:')
console.log(`  email: ${email}`)
console.log('  (password is whatever you passed in — not printed here)\n')
console.log('Delete the service-account key file now if you no longer need it for anything else.')
process.exit(0)
