import { Info } from 'lucide-react'
import { Card, CardBody } from '@/shared/components'

export function AboutSection() {
  return (
    <Card>
      <CardBody>
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Info className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Waterman Construction ERP</h3>
          <p className="text-sm text-[var(--text-muted)]">Version 2.0</p>
          <p className="text-sm text-[var(--text-muted)]">
            Built with React + TypeScript + Firebase
            <br />© 2026 Waterman Construction (Pvt) Ltd
          </p>
        </div>
      </CardBody>
    </Card>
  )
}
