'use client'
import { useEffect, useRef } from 'react'
import { Chip } from '@/components/ui'

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
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 lg:px-0 py-3">
      {['All', ...categories].map((cat) => {
        const isActive = cat === active
        return (
          <Chip
            key={cat}
            ref={isActive ? activeRef : undefined}
            active={isActive}
            onClick={() => onChange(cat)}
          >
            {cat}
          </Chip>
        )
      })}
    </div>
  )
}
