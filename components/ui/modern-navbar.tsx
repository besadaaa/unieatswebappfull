'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Bell, Search, User, Menu, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ModernNavbarProps {
  title: string
  subtitle?: string
  userRole: 'admin' | 'cafeteria'
  userName?: string
  userAvatar?: string
  onMenuToggle?: () => void
  onSearch?: (query: string) => void
  onNotificationClick?: () => void
  onProfileClick?: () => void
  onLogout?: () => void
  notificationCount?: number
}

export function ModernNavbar({
  title,
  subtitle,
  userRole,
  userName = 'User',
  userAvatar,
  onMenuToggle,
  onSearch,
  onNotificationClick,
  onProfileClick,
  onLogout,
  notificationCount = 0
}: ModernNavbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch?.(query)
  }

  const roleColors = {
    admin: {
      gradient: 'from-orange-500 to-amber-500',
      accent: 'text-orange-400',
      bg: 'bg-orange-500/10'
    },
    cafeteria: {
      gradient: 'from-emerald-500 to-teal-500',
      accent: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    }
  }

  const colors = roleColors[userRole]

  return (
    <nav className="nav-modern sticky top-0 z-40 w-full border-b border-white/10 bg-[#0f1424]/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="md:hidden hover:bg-white/5 transition-colors"
          >
            <Menu size={20} />
          </Button>

          {/* Logo & Title */}
          <div className="flex items-center gap-3 animate-slide-in-left">
            <div className="w-8 h-8 relative">
              <Image 
                src="/logo.png" 
                alt="UniEats Logo" 
                width={32} 
                height={32} 
                className="object-contain" 
              />
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-lg font-bold gradient-text bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-400">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md mx-4 animate-fade-in">
          <div className="relative">
            <Search 
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                isSearchFocused ? colors.accent : 'text-slate-400'
              }`} 
              size={18} 
            />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`pl-10 glass-effect border-white/20 hover:border-white/30 focus:border-white/40 transition-all duration-300 ${
                isSearchFocused ? `focus:ring-2 focus:ring-${userRole === 'admin' ? 'orange' : 'emerald'}-500/20` : ''
              }`}
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 animate-slide-in-right">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onNotificationClick}
            className="relative hover:bg-white/5 transition-colors"
          >
            <Bell size={20} />
            {notificationCount > 0 && (
              <span className={`absolute -top-1 -right-1 w-5 h-5 ${colors.bg} ${colors.accent} text-xs rounded-full flex items-center justify-center animate-pulse`}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center overflow-hidden">
                  {userAvatar ? (
                    <Image 
                      src={userAvatar} 
                      alt={userName} 
                      width={32} 
                      height={32} 
                      className="object-cover" 
                    />
                  ) : (
                    <User size={16} className="text-slate-300" />
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-white">{userName}</div>
                  <div className={`text-xs ${colors.accent} capitalize`}>{userRole}</div>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-effect border-white/20">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={onProfileClick} className="hover:bg-white/5">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-white/5">
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-white/5">
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={onLogout}
                className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
