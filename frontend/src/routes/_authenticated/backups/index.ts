import Backup from '@/views/backups'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/backups/')({
  component: Backup,
})
