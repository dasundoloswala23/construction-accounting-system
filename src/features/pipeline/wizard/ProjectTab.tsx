import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { orderBy } from 'firebase/firestore'
import { Card, CardHeader, CardBody } from '@/shared/components'
import { TextField, SelectField, TextareaField } from '@/shared/components/form'
import { useCollection } from '@/shared/hooks/useCollection'
import type { ConstructionSite } from '@/shared/types/entities'
import { QUOTATION_CATEGORIES, type QuotationFormValues } from '../schema'

export function ProjectTab({ register, errors }: { register: UseFormRegister<QuotationFormValues>; errors: FieldErrors<QuotationFormValues> }) {
  const { data: sites } = useCollection<ConstructionSite>('construction_sites', [orderBy('name')])

  return (
    <Card>
      <CardHeader title="Project Details" />
      <CardBody className="space-y-5">
        <TextField
          label="Project Name"
          required
          placeholder="Descriptive project title"
          error={errors.projectName?.message}
          {...register('projectName')}
        />
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Category"
            placeholder="Select category…"
            options={QUOTATION_CATEGORIES.map((c) => ({ value: c, label: c }))}
            {...register('category')}
          />
          <SelectField
            label="Construction Site"
            placeholder="Select site…"
            options={sites.map((s) => ({ value: s.id, label: s.name }))}
            {...register('constructionSiteId')}
          />
        </div>
        <TextField label="Valid Until" type="date" required error={errors.validUntil?.message} {...register('validUntil')} />
        <TextareaField label="Project Notes / Scope Summary" placeholder="Describe the scope of work…" rows={4} {...register('notes')} />
      </CardBody>
    </Card>
  )
}
