'use client'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface CategoryTabsProps {
  categories: string[]
  active: string
  onChange: (cat: string) => void
}

export function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [active])

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2">
      {['All', ...categories].map((cat) => {
        const isActive = cat === active
        return (
          <button
            key={cat}
            ref={isActive ? activeRef : undefined}
            onClick={() => onChange(cat)}
            className={cn(
              'flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all',
              isActive
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary border border-border hover:border-primary',
            )}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
