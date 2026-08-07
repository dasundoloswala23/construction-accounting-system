import { Construction } from 'lucide-react'
import { EmptyState } from './EmptyState'

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <EmptyState icon={Construction} title={title} description="This module is being built next." />
    </div>
  )
}
