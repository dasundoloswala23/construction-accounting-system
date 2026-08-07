import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { FieldWrapper, inputBaseClass } from './FieldWrapper'
import { cn } from '@/shared/lib/cn'

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, required, className, rows = 3, ...props }, ref) => (
    <FieldWrapper label={label} required={required} error={error}>
      <textarea ref={ref} rows={rows} className={cn(inputBaseClass, 'h-auto resize-y py-2', className)} {...props} />
    </FieldWrapper>
  )
)
TextareaField.displayName = 'TextareaField'
