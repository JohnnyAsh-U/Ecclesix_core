import Billings from '@/views/billings'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/billings/')({
  component: Billings,
})

