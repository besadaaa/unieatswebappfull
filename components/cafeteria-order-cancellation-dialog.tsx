'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertCircle, X } from 'lucide-react'

interface CafeteriaCancellationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, customReason?: string) => void
  orderNumber: string
  isLoading?: boolean
}

const CAFETERIA_CANCELLATION_REASONS = [
  'Item out of stock',
  'Kitchen equipment issue',
  'Staff shortage',
  'Ingredient unavailable',
  'Too busy to fulfill',
  'Customer request',
  'Technical issue',
  'Other',
]

export function CafeteriaCancellationDialog({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
  isLoading = false
}: CafeteriaCancellationDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [customReason, setCustomReason] = useState<string>('')

  const handleConfirm = () => {
    if (!selectedReason) return
    
    const finalReason = selectedReason === 'Other' ? customReason.trim() : selectedReason
    if (selectedReason === 'Other' && !finalReason) return
    
    onConfirm(finalReason, selectedReason === 'Other' ? customReason.trim() : undefined)
  }

  const handleClose = () => {
    if (!isLoading) {
      setSelectedReason('')
      setCustomReason('')
      onClose()
    }
  }

  const isValid = selectedReason && (selectedReason !== 'Other' || customReason.trim())

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-white border-0 shadow-2xl">
        <DialogHeader className="pb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 border-2 border-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-gray-900 mb-1">
                Cancel Order
              </DialogTitle>
              <DialogDescription className="text-base text-gray-600">
                Order #{orderNumber}
              </DialogDescription>
              <p className="text-sm text-gray-500 mt-2">
                Please select a reason for cancelling this order. This action cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="absolute right-6 top-6 rounded-full p-2 hover:bg-gray-100 transition-colors disabled:pointer-events-none"
          >
            <X className="h-5 w-5 text-gray-400" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold text-gray-900 mb-4 block">
              Cancellation Reason
            </Label>
            <div className="space-y-2">
              {CAFETERIA_CANCELLATION_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                    selectedReason === reason
                      ? 'border-red-500 bg-red-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => !isLoading && setSelectedReason(reason)}
                >
                  <input
                    type="radio"
                    name="cancellation-reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    disabled={isLoading}
                    className="w-5 h-5 text-red-600 border-2 border-gray-300 focus:ring-red-500 focus:ring-2"
                  />
                  <span className="text-base font-medium text-gray-800 flex-1">
                    {reason}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === 'Other' && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Label htmlFor="custom-reason" className="text-base font-semibold text-gray-900">
                Please specify the reason:
              </Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please provide a detailed explanation for cancelling this order..."
                className="min-h-[100px] resize-none border-gray-300 focus:border-red-500 focus:ring-red-500"
                disabled={isLoading}
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  Be specific to help improve our service
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  {customReason.length}/500
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 h-12 text-base font-medium border-gray-300 hover:bg-gray-50"
            >
              Keep Order
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isValid || isLoading}
              className="flex-1 h-12 text-base font-medium bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Cancelling Order...
                </div>
              ) : (
                'Cancel Order'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
