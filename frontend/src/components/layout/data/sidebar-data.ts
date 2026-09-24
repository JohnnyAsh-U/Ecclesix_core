import {
  // LayoutDashboard,
  Building2,
  CreditCard,
  HardDrive,
  Database,
  // Mail,
  // BarChart3,
  Shield,
  DatabaseIcon,
} from 'lucide-react'
import { type SidebarData } from '../types'
import { useAuthStore } from '@/stores/auth.store'

export const sidebarData = (t: any): SidebarData => {
  return {
    user: {
      name: useAuthStore().user?.username || '',
      email: useAuthStore().user?.email || '',
      avatar: '/avatars/shadcn.jpg',
    },
    navGroups: [
      {
        title: t('sidebar.general'),
        items: [
          // {
          //   title: t('sidebar.dashboard'),
          //   url: '/dashboard',
          //   icon: LayoutDashboard,
          // },
          {
            title: t('sidebar.tenants'),
            url: '/tenants',
            icon: Building2,
          },
          {
            title: t('sidebar.billings'),
            url: '/billings',
            icon: CreditCard,
          },
          {
            title: t('sidebar.migrations'),
            url: '/migrations',
            icon: DatabaseIcon,
          },
          {
            title: t('sidebar.backups'),
            url: '/backups',
            icon: HardDrive,
          },
          {
            title: t('sidebar.storage'),
            url: '/storage',
            icon: Database,
          },
          // {
          //   title: t('sidebar.support'),
          //   url: '/support',
          //   icon: Mail,
          // },
          // {
          //   title: t('sidebar.metrics'),
          //   url: '/metrics',
          //   icon: BarChart3,
          // },
          {
            title: t('sidebar.admins'),
            url: '/admins',
            icon: Shield,
          },
        ],
      },
    ],
  }
}

