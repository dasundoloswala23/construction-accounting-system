import { forwardRef, type SelectHTMLAttributes } from 'react'
import { FieldWrapper, inputBaseClass } from './FieldWrapper'
import { cn } from '@/shared/lib/cn'

interface Option {
  value: string
  label: string
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Option[]
  placeholder?: string
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, required, className, options, placeholder, ...props }, ref) => (
    <FieldWrapper label={label} required={required} error={error}>
      <select ref={ref} className={cn(inputBaseClass, 'appearance-none', className)} {...props}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
)
SelectField.displayName = 'SelectField'
