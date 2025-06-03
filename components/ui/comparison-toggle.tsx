import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface ComparisonToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

export function ComparisonToggle({ enabled, onToggle }: ComparisonToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="comparison-mode" checked={enabled} onCheckedChange={onToggle} />
      <Label htmlFor="comparison-mode" className="text-sm font-medium">
        Compare with previous period
      </Label>
    </div>
  )
}
