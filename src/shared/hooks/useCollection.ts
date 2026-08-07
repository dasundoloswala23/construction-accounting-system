import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, type QueryConstraint, type FirestoreError } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'

export interface CollectionResult<T> {
  data: (T & { id: string })[]
  loading: boolean
  error: FirestoreError | null
}

/**
 * Live-subscribes to a Firestore collection (or query) for the lifetime of the
 * component. Used throughout the app instead of one-shot fetches so every
 * screen reflects writes (including ones made by Cloud Function triggers)
 * without a manual refetch.
 */
export function useCollection<T>(path: string | null, constraints: QueryConstraint[] = []): CollectionResult<T> {
  const [data, setData] = useState<(T & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<FirestoreError | null>(null)

  // constraints are recreated every render by callers; serialize for a stable dep.
  const constraintsKey = JSON.stringify(
    constraints.map((c) => (c as unknown as { _op?: string; _field?: unknown; _value?: unknown; type?: string }))
  )

  useEffect(() => {
    if (!path) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = query(collection(db, path), ...constraints)
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setData(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as T) })))
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, constraintsKey])

  return { data, loading, error }
}
