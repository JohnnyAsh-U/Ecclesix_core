import {
  LayoutDashboard,
  Building2,
  CreditCard,
  HardDrive,
  Database,
  Mail,
  BarChart3,
  Shield,
  Zap,
} from 'lucide-react'
import { type SidebarData } from '../types'
import { useAuthStore } from '@/stores/auth.store'

export const sidebarData = (): SidebarData => {
  return {
    user: {
      name: useAuthStore().user?.username || '',
      email: useAuthStore().user?.email || '',
      avatar: '/avatars/shadcn.jpg',
    },
    navGroups: [
      {
        title: 'Général',
        items: [
          {
            title: 'Tableau de bord',
            url: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            title: 'Clients',
            url: '/tenants',
            icon: Building2,
          },
          {
            title: 'Facturation',
            url: '/billing',
            icon: CreditCard,
          },
          {
            title: 'Sauvegardes',
            url: '/backups',
            icon: HardDrive,
          },
          {
            title: 'Stockage',
            url: '/storage',
            icon: Database,
          },
          {
            title: 'Assistance',
            url: '/support',
            icon: Mail,
          },
          {
            title: 'Statistiques',
            url: '/metrics',
            icon: BarChart3,
          },
          {
            title: 'Sécurité',
            url: '/security',
            icon: Shield,
          },
          {
            title: 'Automatisation',
            url: '/automation',
            icon: Zap,
          },
        ],
      },
    ],
  }
}

