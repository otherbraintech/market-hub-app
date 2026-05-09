# Integración con n8n y Procesamiento LLM

El corazón del sistema de automatización es el flujo de salida de datos hacia un servicio externo de orquestación, en este caso **n8n**.

## El Paquete de Datos (The Bundle)

Cuando una orden de planificación se activa para su procesamiento, el sistema compila un objeto JSON que contiene:

1.  **Datos del Negocio**: Nombre, descripción y propuesta de valor.
2.  **Configuración Base**: Todo el perfil del Buyer Persona, tono de marca y competidores.
3.  **Detalles de la Orden**: Objetivos, fechas, productos estratégicos y reglas de canales.

## Flujo en n8n

1.  **Webhook Inbound**: Recibe el paquete de datos desde Market Ops.
2.  **Prompt Engineering**: n8n construye un prompt complejo inyectando todas las variables recibidas.
3.  **LLM Processing**: Se envía el prompt a un modelo de lenguaje (como GPT-4 o Claude) para generar:
    -   Distribución de posts por canal.
    -   Ideas creativas para cada post.
    -   Guiones o captions preliminares.
    -   Sugerencias de tipo de material visual.
4.  **Feedback Loop**: Los resultados generados se devuelven a Market Ops para actualizar el estado de la orden a `IDEAS_GENERATED` y mostrar los resultados al usuario.

## Finalidad Técnica

Esta arquitectura permite que Market Ops se encargue de la gestión de la base de datos y la interfaz de usuario, mientras que la lógica pesada de generación de contenido (que cambia rápidamente con los avances de la IA) se mantenga flexible y fácilmente actualizable dentro de n8n.
