import { useState, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useApi } from '../hooks/useApi'

interface InventoryUpdateControlsProps {
  wineId: number
  currentQuantity: number
  onQuantityUpdate?: (newQuantity: number) => void
}

export default function InventoryUpdateControls({ 
  wineId, 
  currentQuantity, 
  onQuantityUpdate 
}: InventoryUpdateControlsProps) {
  const [displayQuantity, setDisplayQuantity] = useState(currentQuantity)
  const [inputValue, setInputValue] = useState(currentQuantity.toString())
  const [showSuccess, setShowSuccess] = useState(false)
  const { loading, error, patchJson } = useApi()

  // Update display quantity when currentQuantity prop changes
  useEffect(() => {
    setDisplayQuantity(currentQuantity)
    setInputValue(currentQuantity.toString())
  }, [currentQuantity])

  // Debounced input handler
  const debouncedUpdate = useCallback(
    debounce((newQuantity: number) => {
      updateQuantity(newQuantity)
    }, 500),
    [wineId]
  )

  // Handle input changes with debouncing
  useEffect(() => {
    const numericValue = parseInt(inputValue)
    if (!isNaN(numericValue) && numericValue !== displayQuantity && numericValue >= 0) {
      debouncedUpdate(numericValue)
    }
  }, [inputValue, displayQuantity, debouncedUpdate])

  const updateQuantity = async (newQuantity: number) => {
    if (newQuantity < 0) return

    const result = await patchJson(`http://localhost:8000/api/wines/${wineId}/quantity`, {
      quantity: newQuantity
    })

    if (result) {
      setDisplayQuantity(newQuantity)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
      onQuantityUpdate?.(newQuantity)
    }
  }

  const handleIncrement = () => {
    const newQuantity = displayQuantity + 1
    setDisplayQuantity(newQuantity)
    setInputValue(newQuantity.toString())
    updateQuantity(newQuantity)
  }

  const handleDecrement = () => {
    if (displayQuantity > 0) {
      const newQuantity = displayQuantity - 1
      setDisplayQuantity(newQuantity)
      setInputValue(newQuantity.toString())
      updateQuantity(newQuantity)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // Validate input
    const numericValue = parseInt(value)
    if (!isNaN(numericValue) && numericValue >= 0) {
      setDisplayQuantity(numericValue)
    }
  }

  const handleInputBlur = () => {
    // Ensure input matches display quantity on blur
    setInputValue(displayQuantity.toString())
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Quantity</span>
        {showSuccess && (
          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
            Updated!
          </span>
        )}
        {error && (
          <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
            Error: {error}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          onClick={handleDecrement}
          disabled={loading || displayQuantity <= 0}
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
        >
          −
        </Button>
        
        <Input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={loading}
          min="0"
          className="w-20 text-center"
          placeholder="0"
        />
        
        <Button
          onClick={handleIncrement}
          disabled={loading}
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
        >
          +
        </Button>
      </div>

      {loading && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          Updating...
        </div>
      )}
    </div>
  )
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
