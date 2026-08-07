import { Routes, Route } from 'react-router'
import { PipelinePage } from './PipelinePage'
import { QuotationWizardPage } from './QuotationWizardPage'

export function PipelineRoutes() {
  return (
    <Routes>
      <Route index element={<PipelinePage />} />
      <Route path="new" element={<QuotationWizardPage />} />
      <Route path=":id/edit" element={<QuotationWizardPage />} />
    </Routes>
  )
}
