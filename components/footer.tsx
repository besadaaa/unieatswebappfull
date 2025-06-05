"use client"

import type React from "react"

import { cn } from "@/lib/utils"

interface FooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Footer({ className, ...props }: FooterProps) {
  return (
    <footer
      className={cn("w-full border-t border-gray-800 py-6 text-center text-sm text-gray-500", className)}
      {...props}
    >
      © 2025 UniEats. All rights reserved.
    </footer>
  )
}
