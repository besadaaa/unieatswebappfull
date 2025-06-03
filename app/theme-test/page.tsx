"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/components/theme-context"
import { Moon, Sun } from "lucide-react"

export default function ThemeTestPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Theme Test Page</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Primary Colors</CardTitle>
              <CardDescription>Testing primary color scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="default">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-secondary">Background & Text</CardTitle>
              <CardDescription>Testing background and text contrast</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="text-muted-foreground">Muted background with muted text</p>
              </div>
              <div className="p-4 bg-accent rounded-md">
                <p className="text-accent-foreground">Accent background with accent text</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Theme</CardTitle>
              <CardDescription>Active theme information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Current theme:</strong> {theme}
                </p>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes using the button above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>UniEats Brand Colors</CardTitle>
            <CardDescription>Testing the orange and green brand colors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="w-full h-16 bg-primary rounded-md"></div>
                <p className="text-sm text-center">Primary (Orange)</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-secondary rounded-md"></div>
                <p className="text-sm text-center">Secondary (Green)</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-accent rounded-md"></div>
                <p className="text-sm text-center">Accent (Light Orange)</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-muted rounded-md border"></div>
                <p className="text-sm text-center">Muted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sidebar Colors</CardTitle>
            <CardDescription>Testing sidebar theme colors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-sidebar-background border border-sidebar-border rounded-md">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 bg-sidebar-accent rounded-md">
                  <div className="w-4 h-4 bg-sidebar-primary rounded"></div>
                  <span className="text-sidebar-accent-foreground">Active sidebar item</span>
                </div>
                <div className="flex items-center gap-3 p-2">
                  <div className="w-4 h-4 bg-sidebar-foreground/60 rounded"></div>
                  <span className="text-sidebar-foreground/60">Inactive sidebar item</span>
                </div>
                <div className="flex items-center gap-3 p-2">
                  <div className="w-4 h-4 bg-sidebar-foreground rounded"></div>
                  <span className="text-sidebar-foreground">Sidebar text</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
