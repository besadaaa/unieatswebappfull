/**
 * Utility functions for accessibility
 */
import { getCurrentUser, logUserActivity } from "./supabase"

// Screen reader announcement
export async function announce(message: string, politeness: "assertive" | "polite" = "assertive") {
  // Create an aria-live region if it doesn't exist
  let announcer = document.getElementById("sr-announcer")

  if (!announcer) {
    announcer = document.createElement("div")
    announcer.id = "sr-announcer"
    announcer.setAttribute("aria-live", politeness)
    announcer.setAttribute("aria-atomic", "true")
    announcer.className = "sr-only"
    document.body.appendChild(announcer)
  } else {
    // Update politeness if needed
    announcer.setAttribute("aria-live", politeness)
  }

  // Clear the announcer after a short delay to ensure it's read
  announcer.textContent = ""

  // Set the message after a brief timeout to ensure it's announced
  setTimeout(() => {
    announcer.textContent = message
  }, 50)

  // Log accessibility usage
  try {
    const user = await getCurrentUser()
    await logUserActivity(
      user?.id || null,
      'accessibility_announcement',
      `Screen reader announcement: ${message}`,
      'accessibility',
      undefined,
      { politeness, message_length: message.length }
    )
  } catch (error) {
    console.error('Error logging accessibility usage:', error)
  }
}

// Focus trap for modals and dialogs
export function createFocusTrap(containerElement: HTMLElement) {
  // Get all focusable elements
  const focusableElements = containerElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )

  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

  // Focus the first element
  firstElement?.focus()

  // Handle tab and shift+tab to trap focus
  return function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Tab") {
      if (e.shiftKey) {
        // If shift+tab and on first element, move to last element
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // If tab and on last element, move to first element
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }
  }
}

// Add keyboard shortcuts
export function registerKeyboardShortcut(
  key: string,
  callback: () => void,
  options: {
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
    meta?: boolean
    description?: string
  } = {},
) {
  const handler = async (e: KeyboardEvent) => {
    if (
      e.key && e.key.toLowerCase() === key.toLowerCase() &&
      (!options.ctrl || e.ctrlKey) &&
      (!options.alt || e.altKey) &&
      (!options.shift || e.shiftKey) &&
      (!options.meta || e.metaKey)
    ) {
      e.preventDefault()

      // Log keyboard shortcut usage
      try {
        const user = await getCurrentUser()
        await logUserActivity(
          user?.id || null,
          'keyboard_shortcut',
          `Used keyboard shortcut: ${key}`,
          'accessibility',
          undefined,
          {
            key,
            ctrl: options.ctrl,
            alt: options.alt,
            shift: options.shift,
            meta: options.meta,
            description: options.description
          }
        )
      } catch (error) {
        console.error('Error logging keyboard shortcut usage:', error)
      }

      callback()
    }
  }

  document.addEventListener("keydown", handler)

  // Return a cleanup function
  return () => {
    document.removeEventListener("keydown", handler)
  }
}

// Helper to create a skip link
export function createSkipLink(targetId: string, text = "Skip to main content") {
  const skipLink = document.createElement("a")
  skipLink.href = `#${targetId}`
  skipLink.className =
    "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-white focus:text-black focus:outline-none focus:ring-2 focus:ring-yellow-500"
  skipLink.textContent = text

  // Insert at the beginning of the body
  document.body.insertBefore(skipLink, document.body.firstChild)

  return skipLink
}
