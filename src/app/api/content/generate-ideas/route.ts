/**
 * API Route: Content / Generate Ideas
 * 
 * POST /api/content/generate-ideas
 */

import { NextRequest, NextResponse } from 'next/server'
import { requestContentIdeas } from '@/modules/content-planning'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { businessId, strategyId, campaignId, parameters } = body

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId requerido' },
        { status: 400 }
      )
    }

    if (!parameters?.quantity || !parameters?.contentTypes || !parameters?.channels) {
      return NextResponse.json(
        { error: 'parameters.quantity, parameters.contentTypes y parameters.channels requeridos' },
        { status: 400 }
      )
    }

    const result = await requestContentIdeas(
      businessId,
      strategyId ?? null,
      {
        quantity: parameters.quantity,
        contentTypes: parameters.contentTypes,
        channels: parameters.channels,
        tone: parameters.tone,
      }
    )

    return NextResponse.json({
      message: 'Generación de ideas iniciada',
      jobId: result.jobId,
      eventId: result.eventId,
    })
  } catch (error) {
    console.error('Error en POST /api/content/generate-ideas:', error)
    return NextResponse.json(
      { error: 'Error al iniciar generación de ideas' },
      { status: 500 }
    )
  }
}
