import Tenants from '@/views/tenants'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/tenants/')({
  component: Tenants,
})
