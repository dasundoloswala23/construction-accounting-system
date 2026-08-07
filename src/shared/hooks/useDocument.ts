import { useEffect, useState } from 'react'
import { doc, onSnapshot, type FirestoreError } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'

export interface DocumentResult<T> {
  data: (T & { id: string }) | null
  loading: boolean
  error: FirestoreError | null
}

/** Live-subscribes to a single Firestore document. */
export function useDocument<T>(path: string | null): DocumentResult<T> {
  const [data, setData] = useState<(T & { id: string }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<FirestoreError | null>(null)

  useEffect(() => {
    if (!path) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = onSnapshot(
      doc(db, path),
      (snapshot) => {
        setData(snapshot.exists() ? ({ id: snapshot.id, ...(snapshot.data() as T) }) : null)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
    return unsubscribe
  }, [path])

  return { data, loading, error }
}
