/**
 * API Route: Jobs
 * 
 * GET /api/jobs - Listar jobs
 * GET /api/jobs/[id] - Obtener job por ID
 * POST /api/jobs/[id]/cancel - Cancelar job
 */

import { NextRequest, NextResponse } from 'next/server'
import { getJob, getPendingJobs, getJobStats, cancelJob } from '@/services/job-processor'

// GET /api/jobs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const statsOnly = searchParams.get('stats') === 'true'

    if (statsOnly) {
      const stats = await getJobStats()
      return NextResponse.json(stats)
    }

    const limit = parseInt(searchParams.get('limit') ?? '10')
    const jobs = await getPendingJobs(limit)
    
    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Error en GET /api/jobs:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
