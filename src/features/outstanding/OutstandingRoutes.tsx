import { Routes, Route } from 'react-router'
import { OutstandingPage } from './OutstandingPage'
import { ProjectDetailPage } from './project/ProjectDetailPage'

export function OutstandingRoutes() {
  return (
    <Routes>
      <Route index element={<OutstandingPage />} />
      <Route path="projects/:id" element={<ProjectDetailPage />} />
    </Routes>
  )
}
