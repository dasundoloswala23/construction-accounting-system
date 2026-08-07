import { forwardRef, type InputHTMLAttributes } from 'react'

interface CheckboxFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(({ label, ...props }, ref) => (
  <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
    <input
      ref={ref}
      type="checkbox"
      className="h-4 w-4 rounded border-[var(--border-default)] text-brand-600 focus:ring-brand-500"
      {...props}
    />
    {label}
  </label>
))
CheckboxField.displayName = 'CheckboxField'
