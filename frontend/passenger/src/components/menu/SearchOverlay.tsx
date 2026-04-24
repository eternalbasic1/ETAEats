'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
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
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const results = query.trim().length < 2
    ? []
    : items.filter(
        (i) =>
          i.is_available &&
          (i.name.toLowerCase().includes(query.toLowerCase()) ||
            i.description.toLowerCase().includes(query.toLowerCase())),
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
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Search className="h-5 w-5 text-text-secondary flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dal, chicken, lassi…"
              className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted text-sm focus:outline-none"
            />
            <button onClick={onClose}>
              <X className="h-5 w-5 text-text-secondary" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4">
            {query.trim().length < 2 && (
              <p className="text-center text-text-muted text-sm mt-8">Type at least 2 characters…</p>
            )}
            {query.trim().length >= 2 && results.length === 0 && (
              <p className="text-center text-text-muted text-sm mt-8">No items found for &quot;{query}&quot;</p>
            )}
            {results.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{item.name}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{item.category_name}</p>
                  <p className="text-sm font-bold text-primary mt-1">₹{item.price}</p>
                </div>
                <button
                  onClick={() => { onAdd(item); onClose() }}
                  className="rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold px-4 py-2"
                >
                  + ADD
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
