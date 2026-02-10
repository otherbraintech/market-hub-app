/**
 * Cliente de Webhooks
 * 
 * Maneja el envío de webhooks a servicios externos (n8n, workers, etc.)
 * Incluye:
 * - Firma HMAC para seguridad
 * - Timeouts configurables
 * - Logging de requests
 */

import crypto from 'crypto'

export interface WebhookPayload {
  eventType: string
  jobId: string
  payload: Record<string, unknown>
  timestamp: string
  callbackUrl?: string
}

export interface WebhookResponse {
  success: boolean
  statusCode: number
  data?: unknown
  error?: string
}

export interface WebhookOptions {
  /** Timeout en ms */
  timeout?: number
  /** Headers adicionales */
  headers?: Record<string, string>
  /** Secret para firmar el request */
  secret?: string
}

/**
 * Genera firma HMAC-SHA256 para el payload
 */
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

/**
 * Envía un webhook a una URL externa
 */
export async function dispatchWebhook(
  url: string,
  payload: WebhookPayload,
  options: WebhookOptions = {}
): Promise<WebhookResponse> {
  const {
    timeout = 30000,
    headers = {},
    secret = process.env.WEBHOOK_SECRET,
  } = options

  const body = JSON.stringify(payload)
  
  // Headers base
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Webhook-Event': payload.eventType,
    'X-Webhook-Timestamp': payload.timestamp,
    ...headers,
  }

  // Agregar firma si hay secret
  if (secret) {
    requestHeaders['X-Webhook-Signature'] = generateSignature(body, secret)
  }

  // Agregar Job ID para tracking
  if (payload.jobId) {
    requestHeaders['X-Job-ID'] = payload.jobId
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    let data: unknown
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    return {
      success: response.ok,
      statusCode: response.status,
      data,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    console.error('[WEBHOOK ERROR]', {
      url,
      eventType: payload.eventType,
      jobId: payload.jobId,
      error: errorMessage,
    })

    return {
      success: false,
      statusCode: 0,
      error: errorMessage,
    }
  }
}

/**
 * Verifica la firma de un webhook entrante
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string = process.env.WEBHOOK_SECRET ?? ''
): boolean {
  const expectedSignature = generateSignature(payload, secret)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Extrae headers de webhook de un request
 */
export function extractWebhookHeaders(headers: Headers): {
  eventType: string | null
  timestamp: string | null
  signature: string | null
  jobId: string | null
} {
  return {
    eventType: headers.get('x-webhook-event'),
    timestamp: headers.get('x-webhook-timestamp'),
    signature: headers.get('x-webhook-signature'),
    jobId: headers.get('x-job-id'),
  }
}
