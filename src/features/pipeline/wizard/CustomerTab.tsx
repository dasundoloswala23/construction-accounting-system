import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { Card, CardHeader, CardBody } from '@/shared/components'
import { TextField, TextareaField } from '@/shared/components/form'
import type { QuotationFormValues } from '../schema'

export function CustomerTab({ register, errors }: { register: UseFormRegister<QuotationFormValues>; errors: FieldErrors<QuotationFormValues> }) {
  return (
    <Card>
      <CardHeader title="Customer Details" />
      <CardBody className="space-y-5">
        <TextField
          label="Company / Customer Name"
          required
          placeholder="Client company name"
          error={errors.customerCompanyName?.message}
          {...register('customerCompanyName')}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Contact Person" placeholder="Mr./Ms. Full Name" {...register('customerContactName')} />
          <TextField label="Phone" placeholder="+94 7x xxx xxxx" {...register('customerPhone')} />
        </div>
        <TextField label="Email" type="email" placeholder="client@company.lk" {...register('customerEmail')} />
        <TextareaField label="Address" placeholder="Street, City, Postal Code" {...register('customerAddress')} />
      </CardBody>
    </Card>
  )
}
