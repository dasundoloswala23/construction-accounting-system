import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { TimelineEventType } from '@/shared/types/entities'

export function logTimelineEvent(
  projectId: string,
  type: TimelineEventType,
  actorUid: string,
  actorName: string,
  meta?: Record<string, string | number>
) {
  return addDoc(collection(db, 'timeline'), {
    projectId,
    type,
    actorUid,
    actorName,
    timestamp: serverTimestamp(),
    meta: meta ?? {},
  })
}
