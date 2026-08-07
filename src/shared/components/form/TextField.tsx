import { forwardRef, type InputHTMLAttributes } from 'react'
import { FieldWrapper, inputBaseClass } from './FieldWrapper'
import { cn } from '@/shared/lib/cn'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, required, className, ...props }, ref) => (
    <FieldWrapper label={label} required={required} error={error}>
      <input ref={ref} className={cn(inputBaseClass, className)} {...props} />
    </FieldWrapper>
  )
)
TextField.displayName = 'TextField'
