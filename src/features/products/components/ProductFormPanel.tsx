import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { SidePanel, Button } from '@/shared/components'
import { TextField, SelectField, TextareaField } from '@/shared/components/form'
import type { Product } from '@/shared/types/entities'
import { addProduct, updateProduct, PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../api'

interface ProductWithId extends Product {
  id: string
}

export function ProductFormPanel({
  open,
  onClose,
  product,
}: {
  open: boolean
  onClose: () => void
  product?: ProductWithId
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Product>({
    defaultValues: { code: '', name: '', category: '', unit: '', description: '', status: 'active' },
  })

  useEffect(() => {
    if (open) reset(product ?? { code: '', name: '', category: '', unit: '', description: '', status: 'active' })
  }, [open, product, reset])

  async function onSubmit(values: Product) {
    try {
      if (product) {
        await updateProduct(product.id, values)
        toast.success('Product updated')
      } else {
        await addProduct(values)
        toast.success('Product added')
      }
      onClose()
    } catch {
      toast.error('Could not save product')
    }
  }

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Product'}
      subtitle="Product catalog entry"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {product ? 'Save Changes' : 'Add Product'}
          </Button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="Product Code"
          required
          placeholder="e.g. STL-001"
          error={errors.code?.message}
          {...register('code', { required: 'Product code is required' })}
        />
        <TextField
          label="Product Name"
          required
          placeholder="Full product name"
          error={errors.name?.message}
          {...register('name', { required: 'Product name is required' })}
        />
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Category"
            placeholder="Select…"
            options={PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }))}
            {...register('category')}
          />
          <SelectField label="Unit" placeholder="Select…" options={PRODUCT_UNITS.map((u) => ({ value: u, label: u }))} {...register('unit')} />
        </div>
        <TextareaField label="Description" placeholder="Product description…" {...register('description')} />
        <SelectField
          label="Status"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          {...register('status')}
        />
      </form>
    </SidePanel>
  )
}
