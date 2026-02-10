/**
 * API Route: Dashboard Metrics
 * 
 * GET /api/dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDashboardSummary } from '@/modules/metrics'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId requerido' },
        { status: 400 }
      )
    }

    const summary = await getDashboardSummary(businessId)
    
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error en GET /api/dashboard:', error)
    return NextResponse.json(
      { error: 'Error obteniendo dashboard' },
      { status: 500 }
    )
  }
}
