import { orderBy, where } from 'firebase/firestore'
import { Modal, DataTable, CurrencyText } from '@/shared/components'
import type { DataTableColumn } from '@/shared/components'
import { useCollection } from '@/shared/hooks/useCollection'
import type { BankTransaction } from '@/shared/types/entities'
import { formatDateLong } from '@/shared/lib/dates'

type TxnWithId = BankTransaction & { id: string }

export function TransactionsModal({ open, onClose, bankAccountId, bankName }: { open: boolean; onClose: () => void; bankAccountId?: string; bankName?: string }) {
  const { data: transactions, loading } = useCollection<BankTransaction>(
    bankAccountId ? 'bank_transactions' : null,
    bankAccountId ? [where('bankAccountId', '==', bankAccountId), orderBy('date', 'desc')] : []
  )

  const columns: DataTableColumn<TxnWithId>[] = [
    { key: 'date', header: 'Date', render: (t) => formatDateLong(t.date) },
    { key: 'source', header: 'Source', render: (t) => t.source.replace(/_/g, ' ') },
    {
      key: 'amount',
      header: 'Amount',
      render: (t) => <CurrencyText amount={t.amount} tone={t.type === 'credit' ? 'positive' : 'negative'} />,
    },
    { key: 'balanceAfter', header: 'Balance After', render: (t) => <CurrencyText amount={t.balanceAfter} /> },
  ]

  return (
    <Modal open={open} onClose={onClose} title={`Transactions — ${bankName ?? ''}`} size="lg">
      <DataTable
        columns={columns}
        data={transactions}
        keyField={(t) => t.id}
        loading={loading}
        emptyTitle="No transactions yet"
        emptyDescription="This account's ledger will fill in automatically as payments, purchase orders, and cheques are processed elsewhere in the system."
      />
    </Modal>
  )
}
