"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Keyboard } from "lucide-react"
import { registerKeyboardShortcut } from "@/lib/accessibility"

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Register keyboard shortcut to open help dialog
    const cleanup = registerKeyboardShortcut(
      "?",
      () => {
        setIsOpen(true)
      },
      { shift: true, description: "Show keyboard shortcuts" },
    )

    return cleanup
  }, [])

  const shortcuts = [
    { key: "/", description: "Focus search" },
    { key: "Alt + d", description: "Go to dashboard" },
    { key: "Alt + m", description: "Go to menu" },
    { key: "Alt + o", description: "Go to orders" },
    { key: "Alt + i", description: "Go to inventory" },
    { key: "Alt + s", description: "Go to support" },
    { key: "Shift + ?", description: "Show this help dialog" },
    { key: "Escape", description: "Close dialogs" },
  ]

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-20 right-4 md:bottom-4 rounded-full bg-[#1a1f36] border-[#2a2f46] shadow-lg"
        onClick={() => setIsOpen(true)}
        aria-label="Keyboard shortcuts"
      >
        <Keyboard className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-[#1a1f36] text-white border-[#2a2f46]">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription className="text-gray-400">
              Use these keyboard shortcuts to navigate quickly
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <ul className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span className="text-gray-300">{shortcut.description}</span>
                  <kbd className="px-2 py-1 bg-[#0f1424] border border-[#2a2f46] rounded text-sm font-mono">
                    {shortcut.key}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
