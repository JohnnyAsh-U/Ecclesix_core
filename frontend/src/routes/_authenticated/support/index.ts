import Support from '@/views/support'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/support/')({
  component: Support,
})
