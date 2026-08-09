import { orderBy } from 'firebase/firestore'
import { Modal, DataTable, CurrencyText } from '@/shared/components'
import type { DataTableColumn } from '@/shared/components'
import { useCollection } from '@/shared/hooks/useCollection'
import type { CashTransaction } from '@/shared/types/entities'
import { formatDateLong } from '@/shared/lib/dates'

type TxnWithId = CashTransaction & { id: string }

export function CashTransactionsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: transactions, loading } = useCollection<CashTransaction>(open ? 'cash_transactions' : null, [orderBy('date', 'desc')])

  const columns: DataTableColumn<TxnWithId>[] = [
    { key: 'date', header: 'Date', render: (t) => formatDateLong(t.date) },
    { key: 'source', header: 'Source', render: (t) => t.source.replace(/_/g, ' ') },
    { key: 'amount', header: 'Amount', render: (t) => <CurrencyText amount={t.amount} tone={t.type === 'credit' ? 'positive' : 'negative'} /> },
    { key: 'balanceAfter', header: 'Balance After', render: (t) => <CurrencyText amount={t.balanceAfter} /> },
  ]

  return (
    <Modal open={open} onClose={onClose} title="Cash Account — Transactions" size="lg">
      <DataTable
        columns={columns}
        data={transactions}
        keyField={(t) => t.id}
        loading={loading}
        emptyTitle="No cash transactions yet"
        emptyDescription="Cash received or paid out elsewhere in the system shows up here automatically."
      />
    </Modal>
  )
}
