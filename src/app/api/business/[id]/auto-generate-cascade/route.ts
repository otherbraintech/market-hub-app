import { NextResponse } from 'next/server';
import { triggerCascadeGeneration } from '@/lib/cascade';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Forzar la ejecución del circuito automatizado en background (forzando generación de 3 elementos)
    await triggerCascadeGeneration(id, true);

    return NextResponse.json({ success: true, message: 'Cascada de automatización ejecutada con éxito' });
  } catch (error) {
    console.error('Error triggering cascade auto-generation:', error);
    return NextResponse.json({ error: 'Failed to run cascade auto-generation' }, { status: 500 });
  }
}
