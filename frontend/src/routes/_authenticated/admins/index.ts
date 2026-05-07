import Admins from '@/views/admins'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admins/')({
  component: Admins,
})
