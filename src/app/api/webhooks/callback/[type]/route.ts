/**
 * API Route: Webhook Callback Handler
 * 
 * POST /api/webhooks/callback/[type]
 * Recibe callbacks de agentes externos
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  verifyAndExtractWebhook,
  handleIdeasCallback,
  handleCopyCallback,
  handleMediaCallback,
  handlePublishCallback,
  handleMetricsCallback,
} from '@/modules/webhooks'

interface RouteParams {
  params: Promise<{ type: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { type } = await params

    // Verificar y extraer webhook
    const { valid, body, error } = await verifyAndExtractWebhook(request)
    
    if (!valid) {
      return NextResponse.json(
        { error: error ?? 'Webhook inválido' },
        { status: 401 }
      )
    }

    const callback = JSON.parse(body)
    
    if (!callback.jobId) {
      return NextResponse.json(
        { error: 'jobId requerido' },
        { status: 400 }
      )
    }

    let result

    // Enrutar al handler correcto según el tipo
    switch (type) {
      case 'content-ideas':
        result = await handleIdeasCallback(callback.jobId, callback)
        break
      
      case 'copy':
        result = await handleCopyCallback(callback.jobId, callback)
        break
      
      case 'media':
        result = await handleMediaCallback(callback.jobId, callback)
        break
      
      case 'publish':
        result = await handlePublishCallback(callback.jobId, callback)
        break
      
      case 'metrics':
        result = await handleMetricsCallback(callback.jobId, callback)
        break
      
      default:
        return NextResponse.json(
          { error: `Tipo de callback no soportado: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error en webhook callback:', error)
    return NextResponse.json(
      { error: 'Error procesando callback' },
      { status: 500 }
    )
  }
}
