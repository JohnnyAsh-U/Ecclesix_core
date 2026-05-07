import Storage from '@/views/storage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/storage/')({
  component: Storage,
})
