# Arquitectura Event-Driven

## Descripción General

Esta plataforma utiliza una arquitectura **event-driven (basada en eventos)** donde cada acción importante genera un evento que es registrado, procesado y puede disparar acciones externas vía webhooks.

## Principios Fundamentales

1. **La IA NO vive dentro del core** - Toda generación de contenido ocurre en agentes externos
2. **Todo proceso pesado es asíncrono** - Ejecutado por workers vía webhooks
3. **Cada acción genera un evento** - Auditable y rastreable
4. **UX refleja estados async** - Loading, success, error

---

## Modelo de Eventos

### Tipos de Eventos

```typescript
enum EventType {
  // Generación de contenido
  GENERATE_CONTENT_IDEAS  // Solicitar ideas de contenido
  GENERATE_COPY           // Generar texto/copy
  GENERATE_MEDIA          // Generar imagen/video
  REGENERATE_MEDIA        // Re-generar media

  // Publicación
  PUBLISH_CONTENT         // Publicar contenido
  SCHEDULE_CONTENT        // Programar contenido

  // Métricas
  FETCH_METRICS           // Obtener métricas

  // Sistema
  JOB_CREATED             // Job creado
  JOB_STARTED             // Job iniciado
  JOB_COMPLETED           // Job completado
  JOB_FAILED              // Job fallido

  // Negocio
  BUSINESS_CREATED        // Negocio creado
  CAMPAIGN_CREATED        // Campaña creada
  CONTENT_UPDATED         // Contenido actualizado
}
```

### Estructura de un Evento

```json
{
  "id": "cuid_evento",
  "type": "GENERATE_CONTENT_IDEAS",
  "payload": {
    "businessId": "...",
    "strategyId": "...",
    "parameters": { ... }
  },
  "metadata": {
    "userId": "...",
    "source": "web"
  },
  "jobId": "cuid_job_asociado",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## Flujo Asíncrono

```
┌─────────────────────────────────────────────────────────────────┐
│                          FLUJO GENERAL                          │
└─────────────────────────────────────────────────────────────────┘

  1. Usuario solicita acción
         │
         ▼
  ┌──────────────┐
  │   Frontend   │  ──────► Muestra estado "loading"
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │   API Route  │  ──────► Valida request
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ emitEvent()  │  ──────► 1. Crea Job (PENDING)
  └──────┬───────┘          2. Registra Evento
         │                  3. Retorna jobId
         ▼
  ┌──────────────┐
  │   Webhook    │  ──────► Envía POST a n8n/worker
  │   Client     │          con payload + callbackUrl
  └──────┬───────┘
         │                Job: PROCESSING
         ▼
  ┌──────────────┐
  │   Worker     │  ──────► Procesa (IA, publicación, etc.)
  │   Externo    │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │   Callback   │  ──────► POST a callbackUrl con resultado
  │   Webhook    │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ Job Updated  │  ──────► SUCCESS / FAILED
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │   Frontend   │  ──────► Polling o SSE detecta cambio
  └──────────────┘          Muestra resultado
```

---

## Sistema de Jobs

### Estados del Job

| Estado       | Descripción                           |
| ------------ | ------------------------------------- |
| `PENDING`    | Creado, esperando procesar            |
| `QUEUED`     | En cola para procesar                 |
| `PROCESSING` | Webhook enviado, esperando respuesta  |
| `SUCCESS`    | Completado exitosamente               |
| `FAILED`     | Falló después de todos los reintentos |
| `CANCELLED`  | Cancelado por el usuario              |

### Modelo de Job

```typescript
interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: number; // Mayor = más prioritario
  payload: object; // Datos de entrada
  result: object | null; // Resultado del proceso
  error: string | null; // Mensaje de error
  retries: number; // Intentos realizados
  maxRetries: number; // Máximo de reintentos (default: 3)
  webhookUrl: string; // URL del webhook destino
  callbackUrl: string; // URL para recibir respuesta
  scheduledAt: Date; // Para jobs programados
  startedAt: Date; // Cuándo empezó a procesarse
  completedAt: Date; // Cuándo terminó
  createdAt: Date;
  updatedAt: Date;
}
```

### Reintentos

Los jobs fallidos se reintentan automáticamente hasta `maxRetries`:

1. Error de red → Reintento inmediato
2. Error 5xx → Reintento con backoff exponencial
3. Error 4xx → No reintenta (error de cliente)

---

## Relación UI ↔ Jobs ↔ Webhooks

### En el Frontend

```typescript
// 1. Iniciar acción
const { jobId } = await fetch("/api/content/generate-ideas", {
  method: "POST",
  body: JSON.stringify({ businessId, parameters }),
}).then((r) => r.json());

// 2. Polling para estado
function pollJobStatus(jobId: string) {
  const interval = setInterval(async () => {
    const job = await fetch(`/api/jobs/${jobId}`).then((r) => r.json());

    switch (job.status) {
      case "SUCCESS":
        clearInterval(interval);
        handleSuccess(job.result);
        break;
      case "FAILED":
        clearInterval(interval);
        handleError(job.error);
        break;
      case "PROCESSING":
        updateProgress(job);
        break;
    }
  }, 2000); // Poll cada 2 segundos
}
```

### Estados en UI

| Job Status   | UI State                     |
| ------------ | ---------------------------- |
| `PENDING`    | Spinner + "En cola..."       |
| `PROCESSING` | Spinner + "Procesando..."    |
| `SUCCESS`    | ✅ Resultado mostrado        |
| `FAILED`     | ❌ Error + opción reintentar |

---

## Integración con n8n / Workers

### Configuración de Webhook en n8n

1. Crear nuevo workflow con trigger "Webhook"
2. Configurar URL en `.env`:
   ```env
   WEBHOOK_GENERATE_IDEAS_URL=https://n8n.tudominio.com/webhook/generate-ideas
   ```
3. El webhook recibirá:
   ```json
   {
     "eventType": "GENERATE_CONTENT_IDEAS",
     "jobId": "clx123...",
     "payload": { ... },
     "timestamp": "2024-01-15T10:30:00Z",
     "callbackUrl": "https://tuapp.com/api/webhooks/callback/content-ideas"
   }
   ```
4. El workflow debe responder al `callbackUrl` con:
   ```json
   {
     "jobId": "clx123...",
     "success": true,
     "data": { ... }
   }
   ```

---

## Seguridad

### Firma HMAC

Todos los webhooks salientes incluyen firma:

```
X-Webhook-Signature: sha256=abc123...
X-Webhook-Timestamp: 2024-01-15T10:30:00Z
X-Webhook-Event: GENERATE_CONTENT_IDEAS
X-Job-ID: clx123...
```

### Verificación en el callback

```typescript
import { verifyWebhookSignature } from "@/services/webhook-client";

// En el handler del callback
const signature = request.headers.get("x-webhook-signature");
const body = await request.text();

if (!verifyWebhookSignature(body, signature)) {
  return Response.json({ error: "Invalid signature" }, { status: 401 });
}
```

---

## Archivos Relevantes

| Archivo                          | Descripción                           |
| -------------------------------- | ------------------------------------- |
| `src/services/event-emitter.ts`  | Emisión de eventos y creación de jobs |
| `src/services/job-processor.ts`  | Gestión del ciclo de vida de jobs     |
| `src/services/webhook-client.ts` | Cliente para envío de webhooks        |
| `src/app/api/webhooks/callback/` | Handlers para callbacks               |
| `prisma/schema.prisma`           | Modelos Event y Job                   |
