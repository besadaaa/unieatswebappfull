"use client"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  title: string
  description?: string
}

export function Header({ title, description }: HeaderProps) {
  return (
    <div className="bg-[#1a1f36] p-6 flex justify-between items-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </div>
      <ThemeToggle />
    </div>
  )
}
