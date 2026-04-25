'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from '@/components/ui/IconButton'

interface TopBarProps {
  title?: string
  subtitle?: string
  onBack?: () => void
  backHref?: string
  right?: React.ReactNode
  sticky?: boolean
  transparent?: boolean
  className?: string
}

export function TopBar({
  title,
  subtitle,
  onBack,
  backHref,
  right,
  sticky = true,
  transparent = false,
  className,
}: TopBarProps) {
  const router = useRouter()
  function handleBack() {
    if (onBack) return onBack()
    if (backHref) return router.push(backHref)
    router.back()
  }

  return (
    <div
      className={cn(
        'z-30 px-4 lg:px-0 pt-4 pb-3',
        sticky && 'sticky top-0',
        transparent ? 'bg-transparent' : 'bg-bg/90 backdrop-blur-md border-b border-border-subtle',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <IconButton aria-label="Back" tone="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </IconButton>
        <div className="flex-1 min-w-0">
          {title && <p className="text-h4 text-text-primary truncate">{title}</p>}
          {subtitle && <p className="text-body-sm text-text-muted truncate">{subtitle}</p>}
        </div>
        {right && <div className="flex items-center gap-2 flex-shrink-0">{right}</div>}
      </div>
    </div>
  )
}
