'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Coffee, 
  BarChart3, 
  Settings,
  Menu as MenuIcon,
  ShoppingCart,
  Package,
  Star,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  userRole: 'admin' | 'cafeteria'
  onNavigate: (path: string) => void
}

export function MobileNav({ userRole, onNavigate }: MobileNavProps) {
  const pathname = usePathname()

  const adminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Users', path: '/admin/user-management' },
    { icon: Coffee, label: 'Cafeterias', path: '/admin/cafeteria-approvals' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ]

  const cafeteriaNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/cafeteria/dashboard' },
    { icon: MenuIcon, label: 'Menu', path: '/cafeteria/menu' },
    { icon: ShoppingCart, label: 'Orders', path: '/cafeteria/orders' },
    { icon: Package, label: 'Inventory', path: '/cafeteria/inventory' },
    { icon: BarChart3, label: 'Analytics', path: '/cafeteria/analytics' },
  ]

  const navItems = userRole === 'admin' ? adminNavItems : cafeteriaNavItems

  const isActive = (path: string) => pathname === path

  const roleColors = {
    admin: {
      active: 'text-orange-400 bg-orange-500/20',
      inactive: 'text-slate-400'
    },
    cafeteria: {
      active: 'text-emerald-400 bg-emerald-500/20',
      inactive: 'text-slate-400'
    }
  }

  const colors = roleColors[userRole]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 nav-modern border-t border-white/10 bg-[#0f1424]/95 backdrop-blur-md">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item, index) => {
          const Icon = item.icon
          const active = isActive(item.path)
          
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative group",
                active ? colors.active : colors.inactive,
                "hover:text-white hover:bg-white/5 rounded-lg mx-1"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={cn(
                "p-2 rounded-lg transition-all duration-300",
                active ? "scale-110" : "group-hover:scale-105"
              )}>
                <Icon size={20} />
              </div>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
              
              {/* Active indicator */}
              {active && (
                <div className={cn(
                  "absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full",
                  userRole === 'admin' ? 'bg-orange-500' : 'bg-emerald-500',
                  "animate-pulse"
                )} />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// Breadcrumb component for better navigation
interface BreadcrumbProps {
  items: Array<{
    label: string
    path?: string
  }>
  onNavigate?: (path: string) => void
}

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-400 mb-4 animate-slide-in-up">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-slate-600">/</span>}
          {item.path && onNavigate ? (
            <button
              onClick={() => onNavigate(item.path!)}
              className="hover:text-white transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className={index === items.length - 1 ? 'text-white font-medium' : ''}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
