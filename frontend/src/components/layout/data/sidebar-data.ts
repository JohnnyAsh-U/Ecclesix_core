import {
  LayoutDashboard,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
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
    teams: [
      {
        name: 'Shadcn Admin',
        logo: Command,
        plan: 'Vite + ShadcnUI',
      },
      {
        name: 'Acme Inc',
        logo: GalleryVerticalEnd,
        plan: 'Enterprise',
      },
      {
        name: 'Acme Corp.',
        logo: AudioWaveform,
        plan: 'Startup',
      },
    ],
    navGroups: [
      {
        title: 'General',
        items: [
          {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            title: 'Tenants',
            url: '/tenants',
            icon: Building2,
          },
          {
            title: 'Billing',
            url: '/billing',
            icon: CreditCard,
          },
          {
            title: 'Backups',
            url: '/backups',
            icon: HardDrive,
          },
          {
            title: 'Storage',
            url: '/storage',
            icon: Database,
          },
          {
            title: 'Support',
            url: '/support',
            icon: Mail,
          },
          {
            title: 'Metrics',
            url: '/metrics',
            icon: BarChart3,
          },
          {
            title: 'Security',
            url: '/security',
            icon: Shield,
          },
          {
            title: 'Automation',
            url: '/automation',
            icon: Zap,
          },
        ],
      },
    ],
  }
}

