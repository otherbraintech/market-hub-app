# Agente de Marketing IA

## Descripción

El agente de marketing es un **servicio externo** (no vive en el core de la aplicación) que recibe instrucciones estructuradas vía webhook y devuelve contenido generado.

## Rol del Agente

El agente actúa como:

- **Estratega de Marketing** - Planifica contenido basado en objetivos
- **Planner Editorial** - Organiza calendario de publicaciones
- **Director Creativo** - Define estilos y formatos
- **Copywriter** - Escribe textos persuasivos

## Principios

> ⚠️ **IMPORTANTE**: El agente NO improvisa. Toda decisión está basada en datos estructurados proporcionados por el sistema.

1. Solo usa información del payload recibido
2. Justifica cada decisión tomada
3. Respeta la voz de marca definida
4. Sigue los lineamientos de las personas objetivo

---

## Contratos de Entrada

### GENERATE_CONTENT_IDEAS

Genera ideas de contenido para un negocio.

**Request:**

```json
{
  "eventType": "GENERATE_CONTENT_IDEAS",
  "jobId": "clx123abc",
  "timestamp": "2024-01-15T10:30:00Z",
  "callbackUrl": "https://app.com/api/webhooks/callback/content-ideas",
  "payload": {
    "business": {
      "name": "TechStartup",
      "industry": "SaaS",
      "description": "Plataforma de gestión de proyectos",
      "brandVoice": {
        "tone": ["profesional", "accesible", "innovador"],
        "personality": ["experto", "amigable"],
        "values": ["eficiencia", "colaboración"]
      },
      "targetAudience": {
        "demographics": {
          "ageRange": [25, 45],
          "occupation": "Gerentes de proyecto, CTOs, Fundadores"
        },
        "psychographics": {
          "painPoints": [
            "Falta de visibilidad en proyectos",
            "Comunicación fragmentada"
          ],
          "goals": ["Entregar proyectos a tiempo", "Mejorar colaboración"]
        }
      }
    },
    "strategy": {
      "objectives": [
        {
          "name": "Aumentar awareness",
          "specific": "Posicionarnos como expertos en gestión ágil",
          "targetValue": 10000,
          "unit": "seguidores"
        }
      ],
      "personas": [
        {
          "name": "Carlos Gerente",
          "painPoints": ["Reuniones excesivas", "Falta de métricas claras"],
          "goals": ["Reducir tiempo en reporting"]
        }
      ],
      "contentPillars": [
        {
          "name": "Educativo",
          "topics": ["Tips de productividad", "Metodologías ágiles"]
        },
        {
          "name": "Casos de uso",
          "topics": ["Historias de éxito", "Before/After"]
        }
      ],
      "channels": ["instagram", "linkedin"]
    },
    "product": {
      "name": "ProjectHub Pro",
      "features": [
        "Dashboard en tiempo real",
        "Automatizaciones",
        "Integraciones"
      ],
      "benefits": ["Ahorra 10 horas/semana", "Visibilidad total del proyecto"]
    },
    "parameters": {
      "quantity": 10,
      "contentTypes": ["POST", "CAROUSEL", "REEL"],
      "channels": ["instagram", "linkedin"],
      "funnelStage": "awareness",
      "dateRange": {
        "start": "2024-02-01",
        "end": "2024-02-28"
      }
    }
  }
}
```

**Response esperada:**

```json
{
  "jobId": "clx123abc",
  "success": true,
  "data": {
    "ideas": [
      {
        "id": "idea_001",
        "title": "5 señales de que tu equipo necesita mejor herramienta de gestión",
        "type": "CAROUSEL",
        "channel": "instagram",
        "funnelStage": "awareness",
        "contentPillar": "Educativo",
        "persona": "Carlos Gerente",
        "hook": "¿Cuántas reuniones de seguimiento tienes esta semana? 🤔",
        "outline": [
          "Slide 1: Hook con estadística",
          "Slide 2-6: Las 5 señales",
          "Slide 7: CTA a link en bio"
        ],
        "suggestedDate": "2024-02-05",
        "hashtags": ["#productividad", "#gestionproyectos", "#equipos"],
        "reasoning": "Este contenido ataca el pain point principal de Carlos (reuniones excesivas) y educa sobre la necesidad de herramientas modernas."
      }
    ],
    "metadata": {
      "model": "gpt-4o",
      "tokensUsed": 2500,
      "generatedAt": "2024-01-15T10:32:00Z"
    }
  }
}
```

---

### GENERATE_COPY

Genera el texto/copy para una pieza de contenido.

**Request:**

```json
{
  "eventType": "GENERATE_COPY",
  "jobId": "clx456def",
  "callbackUrl": "https://app.com/api/webhooks/callback/copy",
  "payload": {
    "content": {
      "id": "content_001",
      "type": "CAROUSEL",
      "title": "5 señales de que tu equipo necesita mejor herramienta",
      "outline": ["Slide 1: Hook", "..."]
    },
    "context": {
      "business": { "...": "mismo formato que arriba" },
      "persona": { "name": "Carlos Gerente", "...": "..." },
      "product": { "...": "..." }
    },
    "parameters": {
      "tone": "profesional pero cercano",
      "length": "conciso",
      "includeEmojis": true,
      "includeCTA": true,
      "ctaType": "link_in_bio"
    }
  }
}
```

**Response esperada:**

```json
{
  "jobId": "clx456def",
  "success": true,
  "data": {
    "copy": {
      "mainCaption": "¿Cuántas reuniones de seguimiento tienes esta semana? 🤔\n\nSi tu respuesta es 'demasiadas', es probable que necesites una mejor forma de gestionar proyectos.\n\nAquí te dejo 5 señales claras 👇\n\n#productividad #gestionproyectos #equipos",
      "slides": [
        {
          "number": 1,
          "text": "5 señales de que tu equipo necesita una mejor herramienta de gestión 🚀"
        },
        {
          "number": 2,
          "text": "1️⃣ Pasas más tiempo en reuniones que trabajando"
        }
      ],
      "cta": "¿Te identificaste? Link en bio para probar ProjectHub gratis →"
    },
    "variations": [
      { "type": "shorter", "text": "..." },
      { "type": "more_casual", "text": "..." }
    ],
    "metadata": {
      "model": "gpt-4o",
      "tokensUsed": 800
    }
  }
}
```

---

### GENERATE_MEDIA

Genera imagen o video para una pieza de contenido.

**Request:**

```json
{
  "eventType": "GENERATE_MEDIA",
  "jobId": "clx789ghi",
  "callbackUrl": "https://app.com/api/webhooks/callback/media",
  "payload": {
    "content": {
      "id": "content_001",
      "type": "POST",
      "title": "Anuncio de nueva feature",
      "copy": "Presentamos: Dashboard en tiempo real..."
    },
    "brand": {
      "colors": {
        "primary": "#4F46E5",
        "secondary": "#818CF8",
        "background": "#F9FAFB"
      },
      "fonts": {
        "heading": "Inter",
        "body": "Inter"
      },
      "logo": "https://cdn.example.com/logo.svg"
    },
    "parameters": {
      "type": "image",
      "format": "square",
      "dimensions": { "width": 1080, "height": 1080 },
      "style": "modern, minimalist, tech",
      "includeText": true,
      "textOverlay": "Dashboard en tiempo real disponible ahora"
    }
  }
}
```

**Response esperada:**

```json
{
  "jobId": "clx789ghi",
  "success": true,
  "data": {
    "media": {
      "url": "https://cdn.example.com/generated/img_001.png",
      "thumbnailUrl": "https://cdn.example.com/generated/img_001_thumb.png",
      "width": 1080,
      "height": 1080,
      "mimeType": "image/png",
      "size": 245000
    },
    "prompt": "A modern minimalist tech advertisement...",
    "metadata": {
      "model": "dall-e-3",
      "generatedAt": "2024-01-15T10:35:00Z"
    }
  }
}
```

---

## Responsabilidades del Agente

| Área             | Responsabilidad                                 | NO hace                                  |
| ---------------- | ----------------------------------------------- | ---------------------------------------- |
| **Estrategia**   | Decidir qué contenido crear basado en objetivos | Inventar objetivos                       |
| **Personas**     | Adaptar mensaje a cada persona                  | Asumir características no proporcionadas |
| **Voz de marca** | Mantener tono y personalidad definidos          | Usar su propio estilo                    |
| **Canal**        | Optimizar formato para cada red                 | Ignorar limitaciones del canal           |
| **Métricas**     | Sugerir KPIs a medir                            | Inventar datos de performance            |

---

## Manejo de Errores

El agente debe responder con error estructurado:

```json
{
  "jobId": "clx123abc",
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CONTEXT",
    "message": "No se proporcionó información de buyer personas",
    "details": "El campo strategy.personas está vacío",
    "recoverable": true,
    "suggestion": "Agregar al menos una buyer persona con pain points y goals"
  }
}
```

### Códigos de Error

| Código                 | Descripción                   |
| ---------------------- | ----------------------------- |
| `INSUFFICIENT_CONTEXT` | Falta información requerida   |
| `INVALID_PAYLOAD`      | Formato de payload incorrecto |
| `GENERATION_FAILED`    | Error en la generación de IA  |
| `RATE_LIMITED`         | Límite de requests alcanzado  |
| `SERVICE_UNAVAILABLE`  | Servicio IA no disponible     |

---

## Implementación Sugerida (n8n)

```
┌────────────────┐
│ Webhook Trigger│
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Switch by      │ ──► eventType
│ Event Type     │
└───────┬────────┘
        │
   ┌────┴────┬────────┐
   ▼         ▼        ▼
┌──────┐ ┌──────┐ ┌──────┐
│Ideas │ │ Copy │ │Media │
│ Node │ │ Node │ │ Node │
└──┬───┘ └──┬───┘ └──┬───┘
   │        │        │
   └────────┼────────┘
            ▼
    ┌───────────────┐
    │ HTTP Request  │ ──► POST a callbackUrl
    │ (Callback)    │
    └───────────────┘
```

### Nodo de Ideas (ejemplo)

```javascript
// En un "Code" node
const { payload } = $input.first().json;

const prompt = `
Eres un experto en marketing digital para ${payload.business.industry}.
Tu cliente es ${payload.business.name}: ${payload.business.description}

PERSONAS TARGET:
${JSON.stringify(payload.strategy.personas, null, 2)}

PILARES DE CONTENIDO:
${JSON.stringify(payload.strategy.contentPillars, null, 2)}

GENERA ${payload.parameters.quantity} ideas de contenido para ${payload.parameters.channels.join(", ")}
...
`;

return { prompt };
```
