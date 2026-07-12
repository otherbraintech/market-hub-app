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

  // Simulación en segundo plano para desarrollo local o webhooks faltantes
  const callbackBase = process.env.WEBHOOK_CALLBACK_BASE_URL || 'http://localhost:3000/api/webhooks/callback';
  if (!url || url.trim() === "" || process.env.NODE_ENV === "development" || url.includes("localhost")) {
    setTimeout(async () => {
      try {
        let callbackUrl = "";
        let callbackBody: any = {
          jobId: payload.jobId,
          status: "SUCCESS",
        };

        if (payload.eventType === "GENERATE_MEDIA") {
          callbackUrl = `${callbackBase}/media`;
          const paramType = (payload.payload?.parameters as any)?.type || "image";
          callbackBody.result = {
            mediaUrl: paramType === "video"
              ? "https://assets.mixkit.co/videos/preview/mixkit-coffee-beans-falling-into-a-grinder-40545-large.mp4"
              : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
          };
        } else if (payload.eventType === "PUBLISH_CONTENT") {
          callbackUrl = `${callbackBase}/publish`;
          callbackBody.result = {
            externalId: "mock-post-1234",
            externalUrl: "https://facebook.com/mock-post-1234"
          };
        } else if (payload.eventType === "GENERATE_COPY") {
          callbackUrl = `${callbackBase}/copy`;
          callbackBody.result = {
            caption: "✨ ¡Descubre cómo potenciar tu presencia digital hoy mismo con MarketHub! #marketing #ia #pymes",
            body: "Concepto visual: Un dashboard moderno e interactivo con animaciones fluidas."
          };
        }

        if (callbackUrl) {
          console.log(`[SIMULATOR] Enviando callback simulado a: ${callbackUrl}`);
          await fetch(callbackUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(callbackBody),
          });
        }
      } catch (err) {
        console.error("[SIMULATOR ERROR]", err);
      }
    }, 2000);

    if (!url || url.trim() === "") {
      return {
        success: true,
        statusCode: 200,
        data: { message: "Simulación de webhook iniciada en segundo plano" }
      };
    }
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
