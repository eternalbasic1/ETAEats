'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { Button, IconButton } from '@/components/ui'
import type { MenuItem } from '@/lib/api.types'

interface SearchOverlayProps {
  open: boolean
  items: MenuItem[]
  onClose: () => void
  onAdd: (item: MenuItem) => void
}

export function SearchOverlay({ open, items, onClose, onAdd }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open])

  const results = query.trim().length < 2
    ? []
    : items.filter(
        (i) =>
          i.is_available &&
          (i.name.toLowerCase().includes(query.toLowerCase()) ||
            (i.description ?? '').toLowerCase().includes(query.toLowerCase())),
      )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-bg flex flex-col"
        >
          <div className="flex items-center gap-3 px-4 lg:px-8 py-4 border-b border-border-subtle bg-bg/95 backdrop-blur-md">
            <Search className="h-5 w-5 text-text-tertiary flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dal, chicken, lassi…"
              className="flex-1 bg-transparent text-body text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <IconButton aria-label="Close search" tone="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </IconButton>
          </div>

          <div className="flex-1 overflow-y-auto px-4 lg:px-8">
            {query.trim().length < 2 && (
              <p className="text-center text-body-sm text-text-muted mt-10">
                Type at least 2 characters to search the menu.
              </p>
            )}
            {query.trim().length >= 2 && results.length === 0 && (
              <p className="text-center text-body-sm text-text-muted mt-10">
                No items found for &quot;{query}&quot;.
              </p>
            )}
            <div className="max-w-2xl mx-auto">
              {results.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-4 border-b border-border-subtle last:border-0">
                  <div className="min-w-0">
                    <p className="text-body font-semibold text-text-primary truncate">{item.name}</p>
                    <p className="text-caption text-text-tertiary mt-0.5">{item.category_name}</p>
                    <p className="text-h4 text-text-primary mt-1.5">₹{item.price}</p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => { onAdd(item); onClose() }}>
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
