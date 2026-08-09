import { doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import type { AppNotification } from '@/shared/types/entities'

export function markNotificationRead(id: string) {
  return updateDoc(doc(db, 'notifications', id), { read: true })
}

export function markAllRead(notifications: (AppNotification & { id: string })[]) {
  const batch = writeBatch(db)
  for (const n of notifications) {
    if (!n.read) batch.update(doc(db, 'notifications', n.id), { read: true })
  }
  return batch.commit()
}
