import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Building2, Upload } from 'lucide-react'
import { useDocument } from '@/shared/hooks/useDocument'
import { useFileUpload } from '@/shared/hooks/useFileUpload'
import { Card, CardHeader, CardBody, Button } from '@/shared/components'
import { TextField, TextareaField } from '@/shared/components/form'
import type { Company } from '@/shared/types/entities'
import { updateCompany } from '../api'

type CompanyForm = Pick<Company, 'name' | 'phone' | 'email' | 'tin' | 'defaultVatPercent' | 'address'> & {
  logoURL?: string
}

export function CompanySection() {
  const { data: company, loading } = useDocument<Company>('companies/main')
  const { uploadFile, uploading, progress } = useFileUpload()

  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm<CompanyForm>({
    defaultValues: { name: '', phone: '', email: '', tin: '', defaultVatPercent: 18, address: '', logoURL: '' },
  })

  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        phone: company.phone,
        email: company.email,
        tin: company.tin,
        defaultVatPercent: company.defaultVatPercent,
        address: company.address,
        logoURL: company.logoURL,
      })
    }
  }, [company, reset])

  const logoURL = watch('logoURL')

  async function onSubmit(values: CompanyForm) {
    try {
      await updateCompany({ ...values, defaultVatPercent: Number(values.defaultVatPercent), currency: 'LKR' })
      toast.success('Company details saved')
    } catch {
      toast.error('Could not save company details')
    }
  }

  async function onLogoSelected(file: File) {
    const { downloadURL } = await uploadFile('company/logo', file)
    setValue('logoURL', downloadURL)
  }

  if (loading) return null

  return (
    <Card>
      <CardHeader title="Company Information" />
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg-surface-muted)]">
              {logoURL ? (
                <img src={logoURL} alt="Company logo" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-7 w-7 text-[var(--text-muted)]" />
              )}
            </div>
            <label className="cursor-pointer">
              <Button type="button" variant="outline" size="sm" loading={uploading}>
                <Upload className="h-4 w-4" /> Upload Logo
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void onLogoSelected(file)
                }}
              />
            </label>
            {uploading && <span className="text-xs text-[var(--text-muted)]">{progress}%</span>}
          </div>

          <TextField label="Company Name" required {...register('name')} />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField label="Phone" {...register('phone')} />
            <TextField label="Email" type="email" {...register('email')} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField label="TIN Number" {...register('tin')} />
            <TextField label="VAT Percentage (%)" type="number" step="0.1" {...register('defaultVatPercent')} />
          </div>

          <TextareaField label="Address" {...register('address')} />

          <div className="flex gap-3">
            <Button type="submit" loading={isSubmitting}>
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={() => company && reset(company)}>
              Reset
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
