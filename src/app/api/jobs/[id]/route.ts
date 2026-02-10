/**
 * API Route: Job por ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { getJob, cancelJob } from '@/services/job-processor'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/jobs/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const job = await getJob(id)

    if (!job) {
      return NextResponse.json(
        { error: 'Job no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error en GET /api/jobs/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/jobs/[id] - Cancelar job
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    
    const job = await cancelJob(id, body.reason)
    
    return NextResponse.json(job)
  } catch (error) {
    console.error('Error en DELETE /api/jobs/[id]:', error)
    return NextResponse.json(
      { error: 'Error al cancelar job' },
      { status: 500 }
    )
  }
}
