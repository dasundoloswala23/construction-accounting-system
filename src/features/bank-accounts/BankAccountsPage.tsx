import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Landmark, TrendingUp, TrendingDown, Pencil, Trash2, Wallet, ArrowLeftRight } from 'lucide-react'
import { orderBy, where, Timestamp } from 'firebase/firestore'
import { startOfMonth } from 'date-fns'
import { useCollection } from '@/shared/hooks/useCollection'
import { useDocument } from '@/shared/hooks/useDocument'
import { Card, Button, StatusBadge, Breadcrumb, ConfirmDialog, EmptyState, LoadingBlock } from '@/shared/components'
import type { BankAccount, BankTransaction, CashAccount } from '@/shared/types/entities'
import { formatCurrency, formatPercent } from '@/shared/lib/currency'
import { canEdit } from '@/shared/lib/permissions'
import { useAuth } from '@/app/providers/AuthProvider'
import { BankAccountFormModal } from './components/BankAccountFormModal'
import { TransactionsModal } from './components/TransactionsModal'
import { CashTransactionsModal } from './components/CashTransactionsModal'
import { TransferFundsModal } from './components/TransferFundsModal'
import { deleteBankAccount } from './api'

type AccountWithId = BankAccount & { id: string }

export function BankAccountsPage() {
  const { appUser } = useAuth()
  const editable = canEdit(appUser?.role ?? 'manager', 'bankAccounts')
  const { data: accounts, loading } = useCollection<BankAccount>('bank_accounts', [orderBy('bankName')])
  const { data: monthTxns } = useCollection<BankTransaction>('bank_transactions', [where('date', '>=', Timestamp.fromDate(startOfMonth(new Date())))])
  const { data: cashAccount } = useDocument<CashAccount>('cash_accounts/main')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AccountWithId | undefined>(undefined)
  const [deleting, setDeleting] = useState<AccountWithId | undefined>(undefined)
  const [viewingTxns, setViewingTxns] = useState<AccountWithId | undefined>(undefined)
  const [viewingCashTxns, setViewingCashTxns] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0)
  const inflow = useMemo(() => monthTxns.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0), [monthTxns])
  const outflow = useMemo(() => monthTxns.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0), [monthTxns])

  async function onDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await deleteBankAccount(deleting.id)
      toast.success('Bank account deleted')
      setDeleting(undefined)
    } catch {
      toast.error('Could not delete bank account')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, { label: 'Bank Accounts' }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Bank Accounts</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Total balance: <span className="font-semibold text-accent-600">{formatCurrency(totalBalance)}</span>
          </p>
        </div>
        {editable && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setTransferOpen(true)}>
              <ArrowLeftRight className="h-4 w-4" /> Transfer Funds
            </Button>
            <Button
              onClick={() => {
                setEditing(undefined)
                setFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4" /> Add Account
            </Button>
          </div>
        )}
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <button className="flex items-center gap-3 text-left" onClick={() => setViewingCashTxns(true)}>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--bg-surface-muted)] text-[var(--text-primary)]">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Cash Account</div>
            <div className="text-xl font-semibold text-[var(--text-primary)]">{formatCurrency(cashAccount?.currentBalance ?? 0)}</div>
          </div>
        </button>
      </Card>

      <Card className="flex flex-wrap items-center gap-8 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Total Bank Balance</div>
            <div className="text-xl font-semibold text-[var(--text-primary)]">{formatCurrency(totalBalance)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-accent-600" />
          <span className="text-[var(--text-muted)]">This Month Inflow</span>
          <span className="font-semibold text-accent-600">{formatCurrency(inflow)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingDown className="h-4 w-4 text-danger-500" />
          <span className="text-[var(--text-muted)]">This Month Outflow</span>
          <span className="font-semibold text-danger-500">{formatCurrency(outflow)}</span>
        </div>
        <div className="text-sm text-[var(--text-muted)]">{accounts.filter((a) => a.status === 'active').length} active accounts</div>
      </Card>

      {loading ? (
        <LoadingBlock />
      ) : accounts.length === 0 ? (
        <EmptyState title="No bank accounts yet" description="Add your company's bank accounts to start tracking balances." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {accounts.map((acc) => {
            const change = acc.openingBalance > 0 ? ((acc.currentBalance - acc.openingBalance) / acc.openingBalance) * 100 : 0
            return (
              <Card key={acc.id} className="border-t-4 border-t-accent-500 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white">
                      {acc.bankName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">{acc.bankName}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {acc.accountNumber}
                        {acc.branch && ` · ${acc.branch}`}
                      </div>
                    </div>
                  </div>
                  <StatusBadge tone={acc.status === 'active' ? 'success' : 'neutral'}>{acc.status}</StatusBadge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[var(--text-muted)]">Current Balance</div>
                    <div className="text-lg font-semibold text-[var(--text-primary)]">{formatCurrency(acc.currentBalance)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)]">Opening Balance</div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {formatCurrency(acc.openingBalance)}
                      {change !== 0 && (
                        <span className={change > 0 ? 'ml-1 text-accent-600' : 'ml-1 text-danger-500'}>
                          {change > 0 ? '+' : ''}
                          {formatPercent(change, 1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {acc.description && <p className="mt-2 text-xs text-[var(--text-muted)]">{acc.description}</p>}

                <div className="mt-4 flex items-center gap-1 border-t border-[var(--border-default)] pt-3 text-sm">
                  <button
                    onClick={() => setViewingTxns(acc)}
                    className="rounded-md px-2 py-1 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]"
                  >
                    Transactions
                  </button>
                  {editable && (
                    <>
                      <button
                        onClick={() => {
                          setEditing(acc)
                          setFormOpen(true)
                        }}
                        className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-muted)]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleting(acc)} className="ml-auto rounded-md p-1.5 text-danger-500 hover:bg-danger-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <BankAccountFormModal open={formOpen} onClose={() => setFormOpen(false)} account={editing} />
      <TransactionsModal open={!!viewingTxns} onClose={() => setViewingTxns(undefined)} bankAccountId={viewingTxns?.id} bankName={viewingTxns?.bankName} />
      <CashTransactionsModal open={viewingCashTxns} onClose={() => setViewingCashTxns(false)} />
      <TransferFundsModal open={transferOpen} onClose={() => setTransferOpen(false)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        onConfirm={onDelete}
        loading={busy}
        title="Delete bank account?"
        description={`This will permanently remove "${deleting?.bankName}".`}
      />
    </div>
  )
}
