import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Modal, Button } from '@/shared/components'
import { TextField, TextareaField, SelectField } from '@/shared/components/form'
import type { ConstructionSite } from '@/shared/types/entities'
import { formatDate } from '@/shared/lib/dates'
import { addSite, updateSite, type SiteFormInput } from '../api'

type SiteWithId = ConstructionSite & { id: string }

const empty: SiteFormInput = { name: '', location: '', client: '', description: '', startDate: '', endDate: '', budget: 0, status: 'planning' }

export function SiteFormModal({ open, onClose, site }: { open: boolean; onClose: () => void; site?: SiteWithId }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SiteFormInput>({ defaultValues: empty })

  useEffect(() => {
    if (open) {
      reset(
        site
          ? {
              name: site.name,
              location: site.location,
              client: site.client,
              description: site.description,
              startDate: formatDate(site.startDate),
              endDate: formatDate(site.endDate),
              budget: site.budget,
              status: site.status,
            }
          : empty
      )
    }
  }, [open, site, reset])

  async function onSubmit(values: SiteFormInput) {
    try {
      if (site) {
        await updateSite(site.id, values)
        toast.success('Site updated')
      } else {
        await addSite(values)
        toast.success('Site added')
      }
      onClose()
    } catch {
      toast.error('Could not save site')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={site ? 'Edit Site' : 'Add Construction Site'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {site ? 'Save' : 'Add Site'}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="Site Name"
          required
          placeholder="e.g. Colombo Tower"
          error={errors.name?.message}
          {...register('name', { required: 'Site name is required' })}
        />
        <TextField label="Location" placeholder="Address / area" {...register('location')} />
        <TextField label="Client" {...register('client')} />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Start Date" type="date" {...register('startDate')} />
          <TextField label="End Date" type="date" {...register('endDate')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Budget (LKR)" type="number" step="1000" {...register('budget')} />
          <SelectField
            label="Status"
            options={[
              { value: 'planning', label: 'Planning' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
            ]}
            {...register('status')}
          />
        </div>
        <TextareaField label="Description" {...register('description')} />
      </form>
    </Modal>
  )
}
