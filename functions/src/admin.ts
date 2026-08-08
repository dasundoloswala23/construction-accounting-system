import { initializeApp, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Guards against double-initialization from ESM import ordering: whichever
// file imports this module first runs initializeApp() exactly once, and
// every other file gets the same already-initialized Auth/Firestore handles.
if (getApps().length === 0) {
  initializeApp()
}

export const auth = getAuth()
export const db = getFirestore()
