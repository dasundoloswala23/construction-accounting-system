import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Modal, Button } from '@/shared/components'
import { TextField, TextareaField, CheckboxField } from '@/shared/components/form'
import type { Supplier } from '@/shared/types/entities'
import { addSupplier, updateSupplier, type NewSupplierInput } from '../api'

type SupplierWithId = Supplier & { id: string }

const emptyValues: NewSupplierInput = {
  companyName: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  tin: '',
  vatRegistered: false,
  comments: '',
}

export function SupplierFormModal({ open, onClose, supplier }: { open: boolean; onClose: () => void; supplier?: SupplierWithId }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewSupplierInput>({ defaultValues: emptyValues })

  useEffect(() => {
    if (open) reset(supplier ?? emptyValues)
  }, [open, supplier, reset])

  async function onSubmit(values: NewSupplierInput) {
    try {
      if (supplier) {
        await updateSupplier(supplier.id, values)
        toast.success('Supplier updated')
      } else {
        await addSupplier(values)
        toast.success('Supplier added')
      }
      onClose()
    } catch {
      toast.error('Could not save supplier')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={supplier ? 'Edit Supplier' : 'Add New Supplier'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {supplier ? 'Save Changes' : 'Add Supplier'}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Contact Name"
            required
            placeholder="Full name"
            error={errors.contactName?.message}
            {...register('contactName', { required: 'Contact name is required' })}
          />
          <TextField
            label="Company Name"
            required
            placeholder="Company"
            error={errors.companyName?.message}
            {...register('companyName', { required: 'Company name is required' })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Phone" placeholder="+94 77 xxx xxxx" {...register('phone')} />
          <TextField label="Email" type="email" placeholder="email@company.lk" {...register('email')} />
        </div>
        <TextField label="Address" placeholder="Street, City" {...register('address')} />
        <div className="grid grid-cols-[1fr_auto] items-end gap-4">
          <TextField label="TIN Number" placeholder="TIN-xxxxxxx" {...register('tin')} />
          <CheckboxField label="VAT Registered" {...register('vatRegistered')} />
        </div>
        <TextareaField label="Comments" placeholder="Additional notes…" {...register('comments')} />
      </form>
    </Modal>
  )
}
