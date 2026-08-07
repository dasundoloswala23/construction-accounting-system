import { useState } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '@/shared/lib/firebase'

export interface UploadedFile {
  downloadURL: string
  fileName: string
}

export function useFileUpload() {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  function uploadFile(path: string, file: File): Promise<UploadedFile> {
    setUploading(true)
    setProgress(0)
    const storageRef = ref(storage, `${path}/${Date.now()}-${file.name}`)
    const task = uploadBytesResumable(storageRef, file)

    return new Promise((resolve, reject) => {
      task.on(
        'state_changed',
        (snapshot) => setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
        (error) => {
          setUploading(false)
          reject(error)
        },
        async () => {
          const downloadURL = await getDownloadURL(task.snapshot.ref)
          setUploading(false)
          resolve({ downloadURL, fileName: file.name })
        }
      )
    })
  }

  return { uploadFile, progress, uploading }
}
