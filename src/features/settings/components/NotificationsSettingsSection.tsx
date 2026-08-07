import { useState } from 'react'
import toast from 'react-hot-toast'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import { useAuth } from '@/app/providers/AuthProvider'
import { Card, CardHeader, CardBody, Button } from '@/shared/components'
import { CheckboxField } from '@/shared/components/form'

const CATEGORIES: { key: string; label: string; description: string }[] = [
  { key: 'chequeDue', label: 'Cheque due alerts', description: 'Notify when payable/receivable cheques are due' },
  { key: 'creditDue', label: 'Credit due alerts', description: 'Notify when supplier credit terms are due' },
  { key: 'receivable', label: 'Receivable alerts', description: 'Notify when customer payments are received' },
  { key: 'overdue', label: 'Overdue alerts', description: 'Notify when a payment becomes overdue' },
]

export function NotificationsSettingsSection() {
  const { appUser, user } = useAuth()
  const prefs = (appUser as unknown as { notificationPrefs?: Record<string, boolean> })?.notificationPrefs ?? {}
  const [local, setLocal] = useState<Record<string, boolean>>(prefs)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!user) return
    setSaving(true)
    try {
      await updateDoc(doc(db, `users/${user.uid}`), { notificationPrefs: local })
      toast.success('Notification preferences saved')
    } catch {
      toast.error('Could not save preferences')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Notification Preferences" subtitle="Choose what you get alerted about" />
      <CardBody className="space-y-3">
        {CATEGORIES.map((c) => (
          <div key={c.key}>
            <CheckboxField
              label={c.label}
              checked={local[c.key] ?? true}
              onChange={(e) => setLocal((prev) => ({ ...prev, [c.key]: e.target.checked }))}
            />
            <p className="ml-6 text-xs text-[var(--text-muted)]">{c.description}</p>
          </div>
        ))}
        <Button onClick={save} loading={saving} className="mt-2">
          Save Preferences
        </Button>
      </CardBody>
    </Card>
  )
}
