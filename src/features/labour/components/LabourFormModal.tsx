import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { orderBy } from 'firebase/firestore'
import { Modal, Button } from '@/shared/components'
import { TextField, SelectField } from '@/shared/components/form'
import { useCollection } from '@/shared/hooks/useCollection'
import type { ConstructionSite, Labour } from '@/shared/types/entities'
import { addLabour, updateLabour, type LabourFormInput } from '../api'

type LabourWithId = Labour & { id: string }

const empty: LabourFormInput = { fullName: '', phone: '', role: '', constructionSiteId: '' }

export function LabourFormModal({ open, onClose, worker }: { open: boolean; onClose: () => void; worker?: LabourWithId }) {
  const { data: sites } = useCollection<ConstructionSite>('construction_sites', [orderBy('name')])
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LabourFormInput>({ defaultValues: empty })

  useEffect(() => {
    if (open) {
      reset(worker ? { fullName: worker.fullName, phone: worker.phone, role: worker.role, constructionSiteId: worker.constructionSiteId } : empty)
    }
  }, [open, worker, reset])

  async function onSubmit(values: LabourFormInput) {
    const site = sites.find((s) => s.id === values.constructionSiteId)
    const payload = { ...values, siteName: site?.name ?? '' }
    try {
      if (worker) {
        await updateLabour(worker.id, payload)
        toast.success('Worker updated')
      } else {
        await addLabour(payload)
        toast.success('Worker added')
      }
      onClose()
    } catch {
      toast.error('Could not save worker')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={worker ? 'Edit Labour' : 'Add Labour'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {worker ? 'Save' : 'Add Labour'}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="Full Name"
          required
          placeholder="Worker name"
          error={errors.fullName?.message}
          {...register('fullName', { required: 'Name is required' })}
        />
        <TextField label="Phone" placeholder="+94 7x xxx xxxx" {...register('phone')} />
        <TextField label="Role" placeholder="Mason, Carpenter, etc." required {...register('role', { required: 'Role is required' })} />
        <SelectField
          label="Construction Site"
          placeholder="Select site…"
          options={sites.map((s) => ({ value: s.id, label: s.name }))}
          {...register('constructionSiteId')}
        />
      </form>
    </Modal>
  )
}
