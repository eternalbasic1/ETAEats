'use client'
import { useRef } from 'react'

interface OTPInputProps {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
}

export function OTPInput({ value, onChange, disabled }: OTPInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  function handleChange(idx: number, char: string) {
    if (!/^\d?$/.test(char)) return
    const arr = value.padEnd(6, ' ').split('')
    arr[idx] = char || ' '
    const next = arr.join('').trimEnd()
    onChange(next)
    if (char && idx < 5) inputs.current[idx + 1]?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-12 w-11 rounded-md border border-border bg-surface text-center text-lg font-bold text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
      ))}
    </div>
  )
}
