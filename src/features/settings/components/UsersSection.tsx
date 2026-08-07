import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'
import { useCollection } from '@/shared/hooks/useCollection'
import { Card, CardHeader, CardBody, Button, DataTable, Modal, StatusBadge } from '@/shared/components'
import type { DataTableColumn } from '@/shared/components'
import { TextField, SelectField } from '@/shared/components/form'
import type { AppUser } from '@/shared/types/entities'
import { ROLE_LABELS, type Role } from '@/shared/lib/permissions'
import { useAuth } from '@/app/providers/AuthProvider'
import { createUser, setUserRole, setUserActive } from '../api'

const newUserSchema = z.object({
  displayName: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'accountant', 'manager']),
})
type NewUserForm = z.infer<typeof newUserSchema>

const roleOptions = (Object.keys(ROLE_LABELS) as Role[]).map((r) => ({ value: r, label: ROLE_LABELS[r] }))

export function UsersSection() {
  const { user: currentUser } = useAuth()
  const { data: users, loading } = useCollection<AppUser>('users')
  const [modalOpen, setModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewUserForm>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { displayName: '', email: '', password: '', phone: '', role: 'manager' },
  })

  async function onSubmit(values: NewUserForm) {
    try {
      await createUser(values)
      toast.success('User created')
      reset()
      setModalOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create user')
    }
  }

  async function onRoleChange(uid: string, role: Role) {
    try {
      await setUserRole(uid, role)
      toast.success('Role updated')
    } catch {
      toast.error('Could not update role')
    }
  }

  async function onToggleActive(u: AppUser & { id: string }) {
    try {
      await setUserActive(u.id, !u.active)
      toast.success(u.active ? 'User deactivated' : 'User activated')
    } catch {
      toast.error('Could not update user')
    }
  }

  const columns: DataTableColumn<AppUser & { id: string }>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (u) => (
        <div>
          <div className="font-medium">{u.displayName}</div>
          <div className="text-xs text-[var(--text-muted)]">{u.email}</div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (u) => u.phone || '—' },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <select
          value={u.role}
          disabled={u.id === currentUser?.uid}
          onChange={(e) => onRoleChange(u.id, e.target.value as Role)}
          className="h-8 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 text-sm disabled:opacity-60"
        >
          {roleOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => <StatusBadge tone={u.active ? 'success' : 'neutral'}>{u.active ? 'Active' : 'Inactive'}</StatusBadge>,
    },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <Button
          size="sm"
          variant="outline"
          disabled={u.id === currentUser?.uid}
          onClick={() => onToggleActive(u)}
        >
          {u.active ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader
        title="Users"
        subtitle={`${users.length} user${users.length === 1 ? '' : 's'}`}
        action={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add User
          </Button>
        }
      />
      <CardBody className="p-0">
        <DataTable columns={columns} data={users} keyField={(u) => u.id} loading={loading} emptyTitle="No users yet" />
      </CardBody>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New User" subtitle="Provision a new login for the team">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField label="Full Name" required error={errors.displayName?.message} {...register('displayName')} />
          <TextField label="Email" type="email" required error={errors.email?.message} {...register('email')} />
          <TextField label="Temporary Password" type="password" required error={errors.password?.message} {...register('password')} />
          <TextField label="Phone" {...register('phone')} />
          <SelectField label="Role" options={roleOptions} {...register('role')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  )
}
