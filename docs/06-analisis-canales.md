# Análisis de Canales IA y Control de Concurrencia de UI

El sistema cuenta con un módulo de **Análisis de Canales Digitales** potenciado por Inteligencia Artificial (con agentes de n8n) tanto para **Mi Negocio** como para los **Competidores**. Esta funcionalidad permite escanear e interpretar de manera inteligente los canales web y perfiles sociales (Facebook, Instagram, TikTok) para extraer su propuesta de valor, posicionamiento, fortalezas, debilidades y recomendaciones clave.

---

## Control de Concurrencia en la Interfaz (UI)

Debido a que el procesamiento de análisis mediante webhooks a n8n y su posterior análisis con LLMs es una operación asíncrona pesada (que puede tomar varios segundos o minutos), es crítico evitar que el usuario desencadene solicitudes de análisis concurrentes o conflictivas. 

Para solucionar esto, se ha implementado un mecanismo de **bloqueo mutuo o bloqueo global interactivo** en la interfaz de usuario.

### Mecanismo de Bloqueo

Cuando se inicia una acción de análisis (ya sea para solicitar un análisis nuevo o para reanalizar un canal existente), el sistema activa un estado de análisis global (`isAnyAnalyzing`). 

El estado `isAnyAnalyzing` se calcula evaluando dos factores:
1. **Solicitud local activa (`isAnyRequesting`)**: El cliente está realizando la petición `POST` al endpoint local de la API (`/api/analysis/request`).
2. **Procesamiento remoto en cola (`isAnyPending`)**: Algún canal ya está en estado `PENDING` o `PROCESSING` según los registros de la base de datos devueltos en el servidor.

```typescript
const isAnyRequesting = requestingChannel !== null;
const isAnyPending = channels.some(ch => initialAnalyses[ch.name]?.status === "PENDING" || initialAnalyses[ch.name]?.status === "PROCESSING");
const isAnyAnalyzing = isAnyRequesting || isAnyPending;
```

### Comportamiento Visual y Funcional

* **Card / Fila en Ejecución**: Muestra visualmente un indicador de carga (`Loader2` animado) y su botón de acción se encuentra deshabilitado para evitar clics dobles.
* **Demás Cards / Filas**: Sus botones para "Analizar canal" o "Reanalizar" se deshabilitan de manera automática (`disabled={isAnyAnalyzing}`). Esto previene que el usuario inicie múltiples ejecuciones en paralelo que saturen el backend o los flujos de n8n, garantizando la consistencia del estado visual.
* **Restauración**: Tan pronto como la tarea finaliza y se actualiza el estado de la base de datos (o la petición HTTP concluye en caso de error), la interfaz restaura la interactividad de todos los botones de análisis.

---

## Estructura de Datos de Redes Sociales y Panel de Métricas

Para los canales sociales (Facebook, Instagram, TikTok), el backend y el agente IA de n8n retornan un reporte enriquecido centrado en audiencias, engagement, señales y observaciones competitivas. 

### Detección y Normalización Inteligente

El sistema detecta automáticamente si el reporte corresponde a un canal de red social (`isSocialStructure`) basándose en la presencia de campos específicos de presencia social:
```typescript
const isSocialStructure = !!report.data.facebook_presence || 
                          !!report.data.instagram_presence || 
                          !!report.data.tiktok_presence || 
                          !!report.data.branding_analysis;
```

Si es verídico, los datos son mapeados dinámicamente y de forma robusta hacia los bloques visuales unificados de la UI (`overview`, `mkt`, `ux`, `insights`, `recs`, `dataQuality`):
* **Posicionamiento**: Compuesto a partir de `branding_analysis.brand_positioning_indicators` y `facebook_presence.business_category`.
* **Marketing**: Integra señales comerciales, tácticas de anuncios activas y madurez de la plataforma.
* **UX / Canal**: Traducido a observaciones de presencia local, fortalezas y debilidades competitivas, y madurez de marca.

### Panel de Impacto de Audiencia (Métricas Premium)

Adicionalmente, se renderiza al principio del reporte un panel visual enriquecido con gradientes estéticos y sombras modernas que detalla el impacto cuantitativo del canal:
* **Seguidores**: Total de seguidores formateados localmente.
* **Me Gusta (Likes)**: Cantidad total de aprobaciones públicas.
* **Usuarios Activos**: Métrica `talking_about` que refleja la tracción semanal.
* **Nivel de Engagement**: Badge con color semántico que representa la interacción e interés del público.

---

## Archivos Involucrados

Las modificaciones del control de concurrencia y soporte de datos sociales se implementaron de forma coherente en:
1. **Mi Negocio IA**: `src/app/(dashboard)/business/analysis/client-page.tsx` ([client-page.tsx](file:///d:/Users/ludwi/Documents/workspace/OB-MarketHub/src/app/(dashboard)/business/analysis/client-page.tsx))
2. **Análisis de Competidores**: `src/app/(dashboard)/competitors/analysis/client-page.tsx` ([client-page.tsx](file:///d:/Users/ludwi/Documents/workspace/OB-MarketHub/src/app/(dashboard)/competitors/analysis/client-page.tsx))
