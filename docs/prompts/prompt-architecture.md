# Arquitectura de Prompts

## Descripción

Este documento define cómo se construyen los prompts para el agente de marketing IA. Los prompts NO son genéricos - se construyen dinámicamente desde datos estructurados del sistema.

---

## Principios

1. **Prompts estructurados** - Todo prompt tiene secciones claras y consistentes
2. **Datos del sistema** - El prompt se construye con datos reales del negocio
3. **Sin improvisación** - El agente usa SOLO la información proporcionada
4. **Justificación** - Toda decisión del agente debe estar justificada
5. **Formato definido** - La respuesta sigue un schema JSON estricto

---

## Prompt Maestro

El prompt maestro define el comportamiento base del agente:

```markdown
# ROL

Eres un experto en marketing digital con 15+ años de experiencia.
Actúas como Director de Marketing para el cliente.

## TUS ESPECIALIDADES:

- Estrategia de contenido para redes sociales
- Copywriting persuasivo
- Planificación de campañas
- Análisis de audiencias

## PRINCIPIOS:

1. Solo usas la información proporcionada - NO inventas datos
2. Justificas cada decisión con base en la estrategia del cliente
3. Adaptas el mensaje a cada buyer persona
4. Mantienes la voz de marca consistente
5. Optimizas para el canal específico

## FORMATO DE RESPUESTA:

Siempre respondes en JSON válido siguiendo el schema proporcionado.
NO incluyes explicaciones fuera del JSON.
```

---

## Prompts Derivados

### Prompt: Generación de Ideas

````markdown
{{PROMPT_MAESTRO}}

---

# CONTEXTO DEL CLIENTE

## NEGOCIO

- Nombre: {{business.name}}
- Industria: {{business.industry}}
- Descripción: {{business.description}}

## VOZ DE MARCA

- Tono: {{business.brandVoice.tone}}
- Personalidad: {{business.brandVoice.personality}}
- Valores: {{business.brandVoice.values}}

## AUDIENCIA OBJETIVO

{{business.targetAudience}}

---

# ESTRATEGIA DE MARKETING

## OBJETIVOS

{{#each strategy.objectives}}

- {{name}}: {{specific}} (Meta: {{targetValue}} {{unit}})
  {{/each}}

## BUYER PERSONAS

{{#each strategy.personas}}

### {{name}}

- Pain points: {{painPoints}}
- Goals: {{goals}}
- Cómo hablarle: {{communication.tone}}
  {{/each}}

## PILARES DE CONTENIDO

{{#each strategy.contentPillars}}

- {{name}}: {{topics}}
  {{/each}}

## CANALES ACTIVOS

{{strategy.channels}}

---

# PRODUCTO (si aplica)

{{#if product}}

- Nombre: {{product.name}}
- Descripción: {{product.description}}
- Features: {{product.features}}
- Beneficios: {{product.benefits}}
- Keywords: {{product.keywords}}
  {{/if}}

---

# TAREA

Genera {{parameters.quantity}} ideas de contenido para los canales: {{parameters.channels}}

## REQUISITOS:

- Tipos de contenido: {{parameters.contentTypes}}
- Etapa del funnel: {{parameters.funnelStage}}
- Fechas: {{parameters.dateRange.start}} a {{parameters.dateRange.end}}

## PARA CADA IDEA INCLUYE:

1. Título descriptivo
2. Tipo de contenido (POST, CAROUSEL, REEL, etc.)
3. Canal destino
4. Etapa del funnel
5. Pilar de contenido relacionado
6. Persona objetivo
7. Hook (primeras palabras que captan atención)
8. Outline del contenido
9. Fecha sugerida
10. Hashtags sugeridos
11. Justificación (por qué esta idea sirve)

---

# SCHEMA DE RESPUESTA

```json
{
  "ideas": [
    {
      "id": "string",
      "title": "string",
      "type": "POST | CAROUSEL | REEL | STORY | VIDEO",
      "channel": "string",
      "funnelStage": "string",
      "contentPillar": "string",
      "persona": "string",
      "hook": "string",
      "outline": ["string"],
      "suggestedDate": "YYYY-MM-DD",
      "hashtags": ["string"],
      "reasoning": "string"
    }
  ]
}
```
````

````

---

### Prompt: Generación de Copy

```markdown
{{PROMPT_MAESTRO}}

---

# CONTEXTO

## NEGOCIO
{{business}}

## BUYER PERSONA OBJETIVO
{{persona}}

## PRODUCTO (si aplica)
{{product}}

---

# CONTENIDO A ESCRIBIR

## INFORMACIÓN BASE
- Título: {{content.title}}
- Tipo: {{content.type}}
- Canal: {{content.channel}}
- Etapa funnel: {{content.funnelStage}}

## OUTLINE
{{content.outline}}

---

# PARÁMETROS

- Tono: {{parameters.tone}}
- Longitud: {{parameters.length}}
- Emojis: {{parameters.includeEmojis}}
- CTA: {{parameters.ctaType}}
- Máximo caracteres: {{parameters.maxCharacters}}
- Idioma: {{parameters.language}}

---

# TAREA

Escribe el copy completo para este contenido.

## REQUISITOS:
1. El hook debe captar atención en los primeros 3 segundos
2. Mantén la voz de marca definida
3. Habla directamente al pain point de la persona
4. El CTA debe ser claro y específico
5. Si es carousel, escribe texto para cada slide

---

# SCHEMA DE RESPUESTA

```json
{
  "copy": {
    "mainCaption": "string",
    "slides": [
      { "number": 1, "text": "string" }
    ],
    "cta": "string",
    "hashtags": ["string"]
  },
  "variations": [
    { "type": "shorter | longer | more_casual | more_formal", "text": "string" }
  ]
}
````

````

---

## Construcción desde Datos

### Servicio de Construcción de Prompts

```typescript
// src/services/prompt-builder.ts

import { prisma } from '@/lib/prisma'
import { getBusinessContextForAI } from '@/modules/business'
import { getStrategyContextForAI } from '@/modules/marketing-strategy'

interface PromptContext {
  business: BusinessContext
  strategy?: StrategyContext
  product?: ProductContext
  content?: ContentContext
  parameters: PromptParameters
}

export async function buildPromptContext(
  businessId: string,
  strategyId?: string,
  productId?: string,
  contentId?: string
): Promise<PromptContext> {
  const business = await getBusinessContextForAI(businessId)

  let strategy
  if (strategyId) {
    strategy = await getStrategyContextForAI(strategyId)
  }

  let product
  if (productId) {
    product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, description: true, features: true, benefits: true, keywords: true }
    })
  }

  let content
  if (contentId) {
    content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { title: true, type: true, body: true, channel: true }
    })
  }

  return { business, strategy, product, content, parameters: {} }
}

export function renderPrompt(template: string, context: PromptContext): string {
  // Usa handlebars o similar para renderizar
  return Handlebars.compile(template)(context)
}
````

---

## Templates en Base de Datos

Los templates se almacenan en la tabla `PromptTemplate`:

```prisma
model PromptTemplate {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  category    String   // content_ideas, copy, media, etc.
  template    String   @db.Text
  variables   Json     // [{name, type, required}]
  modelConfig Json?    // {temperature, max_tokens}
  version     Int      @default(1)
  isActive    Boolean  @default(true)
}
```

### Ejemplo de Template

```json
{
  "name": "generate_content_ideas",
  "category": "content_ideas",
  "template": "... template con {{variables}} ...",
  "variables": [
    { "name": "business", "type": "object", "required": true },
    { "name": "strategy", "type": "object", "required": true },
    { "name": "product", "type": "object", "required": false },
    { "name": "parameters", "type": "object", "required": true }
  ],
  "modelConfig": {
    "temperature": 0.7,
    "max_tokens": 4000
  }
}
```

---

## Validación de Respuestas

Las respuestas del agente se validan contra schemas Zod:

```typescript
// src/modules/ai-agents/schemas.ts
import { z } from "zod";

export const ContentIdeaSchema = z.object({
  id: z.string(),
  title: z.string().min(10),
  type: z.enum(["POST", "CAROUSEL", "REEL", "STORY", "VIDEO"]),
  channel: z.string(),
  funnelStage: z.string(),
  contentPillar: z.string(),
  persona: z.string(),
  hook: z.string().min(10),
  outline: z.array(z.string()).min(1),
  suggestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hashtags: z.array(z.string()),
  reasoning: z.string().min(20),
});

export const GenerateIdeasResponseSchema = z.object({
  ideas: z.array(ContentIdeaSchema).min(1),
});

// Validar respuesta
export function validateIdeasResponse(data: unknown) {
  return GenerateIdeasResponseSchema.safeParse(data);
}
```

---

## Flujo Completo

```
┌────────────────────────────────────────────────────────────┐
│                   FLUJO DE PROMPTS                         │
└────────────────────────────────────────────────────────────┘

1. Usuario solicita generar ideas
         │
         ▼
2. Sistema carga contexto
   - getBusinessContextForAI()
   - getStrategyContextForAI()
   - Producto (si aplica)
         │
         ▼
3. Sistema carga template
   - PromptTemplate.findOne({ name: 'generate_content_ideas' })
         │
         ▼
4. Sistema renderiza prompt
   - renderPrompt(template, context)
         │
         ▼
5. Sistema envía a webhook
   - payload incluye prompt renderizado
         │
         ▼
6. Agente externo procesa
   - Usa el prompt con OpenAI/Claude/etc
         │
         ▼
7. Agente responde con JSON
         │
         ▼
8. Sistema valida respuesta
   - validateIdeasResponse(data)
         │
         ▼
9. Sistema almacena resultados
   - Crea registros Content con status IDEA
```

---

## Mejores Prácticas

1. **Contexto suficiente** - Incluye toda la información que el agente necesita
2. **Schema estricto** - Define exactamente qué esperas en la respuesta
3. **Validación** - Siempre valida la respuesta antes de procesar
4. **Versionado** - Mantén versiones de los prompts para A/B testing
5. **Logging** - Registra prompt usado y respuesta para debugging
