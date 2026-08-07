import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Upload, FileText } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export function FileUpload({
  label,
  hint = 'PDF, JPG, XLSX up to 10MB',
  accept = '.pdf,.jpg,.jpeg,.png,.xlsx',
  onFileSelected,
  fileName,
  progress,
}: {
  label: string
  hint?: string
  accept?: string
  onFileSelected: (file: File) => void
  fileName?: string
  progress?: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFileSelected(file)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFileSelected(file)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
          dragOver ? 'border-brand-500 bg-brand-50' : 'border-[var(--border-default)] hover:bg-[var(--bg-surface-muted)]'
        )}
      >
        {fileName ? (
          <>
            <FileText className="h-6 w-6 text-brand-600" />
            <p className="text-sm text-[var(--text-primary)]">{fileName}</p>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-secondary)]">{hint}</p>
          </>
        )}
        {typeof progress === 'number' && progress > 0 && progress < 100 && (
          <div className="h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-[var(--bg-surface-muted)]">
            <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
      </div>
    </div>
  )
}
