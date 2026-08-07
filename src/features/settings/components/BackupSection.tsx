import { useState } from 'react'
import toast from 'react-hot-toast'
import { collection, getDocs } from 'firebase/firestore'
import { Download } from 'lucide-react'
import { db } from '@/shared/lib/firebase'
import { Card, CardHeader, CardBody, Button } from '@/shared/components'
import { formatDate } from '@/shared/lib/dates'

const COLLECTIONS = [
  'companies',
  'users',
  'suppliers',
  'products',
  'construction_sites',
  'quotations',
  'projects',
  'project_payments',
  'project_documents',
  'receipts',
  'timeline',
  'purchase_orders',
  'bank_accounts',
  'bank_transactions',
  'labour',
  'labour_payments',
  'cheques',
  'vat_invoices',
  'notifications',
]

export function BackupSection() {
  const [exporting, setExporting] = useState(false)

  async function exportAll() {
    setExporting(true)
    try {
      const dump: Record<string, unknown[]> = {}
      for (const name of COLLECTIONS) {
        const snap = await getDocs(collection(db, name))
        dump[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      }
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `waterman-erp-backup-${formatDate(new Date())}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Backup downloaded')
    } catch {
      toast.error('Backup failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Backup" subtitle="Download a full JSON export of every collection" />
      <CardBody>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Exports every record in the system (suppliers, products, quotations, purchase orders, payments, etc.) as a single
          JSON file you can archive offline.
        </p>
        <Button onClick={exportAll} loading={exporting}>
          <Download className="h-4 w-4" /> Download Full Backup
        </Button>
      </CardBody>
    </Card>
  )
}
