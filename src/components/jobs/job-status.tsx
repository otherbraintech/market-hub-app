/**
 * Componente JobStatus - Muestra el estado de un Job con indicadores visuales
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Clock, Pause } from 'lucide-react'

type JobStatusType = 'PENDING' | 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'

interface JobStatusProps {
  status: JobStatusType
  showIcon?: boolean
  size?: 'sm' | 'md'
}

const statusConfig: Record<JobStatusType, {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
  icon: React.ComponentType<{ className?: string }>
}> = {
  PENDING: { label: 'Pendiente', variant: 'secondary', icon: Clock },
  QUEUED: { label: 'En cola', variant: 'info', icon: Clock },
  PROCESSING: { label: 'Procesando', variant: 'warning', icon: Loader2 },
  SUCCESS: { label: 'Completado', variant: 'success', icon: CheckCircle },
  FAILED: { label: 'Fallido', variant: 'destructive', icon: XCircle },
  CANCELLED: { label: 'Cancelado', variant: 'outline', icon: Pause },
}

export function JobStatus({ status, showIcon = true, size = 'md' }: JobStatusProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const isAnimated = status === 'PROCESSING'

  return (
    <Badge variant={config.variant} className={size === 'sm' ? 'text-xs py-0' : ''}>
      {showIcon && (
        <Icon className={`mr-1 h-3 w-3 ${isAnimated ? 'animate-spin' : ''}`} />
      )}
      {config.label}
    </Badge>
  )
}

/**
 * Componente JobStatusIndicator - Indicador mínimo de estado
 */
interface JobStatusIndicatorProps {
  status: JobStatusType
}

export function JobStatusIndicator({ status }: JobStatusIndicatorProps) {
  const colorMap: Record<JobStatusType, string> = {
    PENDING: 'bg-gray-400',
    QUEUED: 'bg-blue-400',
    PROCESSING: 'bg-yellow-400 animate-pulse',
    SUCCESS: 'bg-green-500',
    FAILED: 'bg-red-500',
    CANCELLED: 'bg-gray-500',
  }

  return (
    <span 
      className={`inline-block h-2 w-2 rounded-full ${colorMap[status]}`}
      title={statusConfig[status].label}
    />
  )
}
