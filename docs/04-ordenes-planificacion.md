# Órdenes de Planificación

Las órdenes de planificación son solicitudes específicas para generar contenido dentro de un intervalo de tiempo determinado. Cada orden hereda el contexto del negocio y de la configuración base, pero añade detalles tácticos para el periodo en cuestión.

## Parámetros de la Orden

### Información General
-   **Nombre de la Orden**: Identificador para control interno (ej. "Campaña Navidad 2024").
-   **Rango de Fechas**: Cuándo empieza y cuándo termina la planificación.
-   **Fechas Excluidas**: Días específicos donde no se debe publicar (feriados, descansos).

### Estrategia y Objetivos
-   **Objetivo de Planificación**: Aumentar Ventas, Generar Awareness, Lanzamiento de Producto, Fidelización, Tráfico Web, etc.
-   **Productos Prioritarios**: Selección de productos del catálogo que deben destacarse.
-   **Estrategia de Contenido**: Problema/Solución, Prueba Social, Educativo, Detrás de Escena, Entretenimiento o Urgencia/Escasez.
-   **Tono Emocional**: Inspiracional, Urgente, Educativo, Divertido, Autoritario o Empático.
-   **Pilares de Contenido**: Calidad, Innovación, Comunidad, Educación, Storytelling, etc.

### Táctica y Producción
-   **Frecuencia Base**: Número promedio de publicaciones por día.
-   **Fuente de Material (Assets)**: Si el cliente provee el material, si lo genera la IA o si es mixto.
-   **Canal Principal**: El canal que llevará el peso de la estrategia.
-   **Llamado a la Acción (CTA)**: Qué queremos que haga el usuario.
-   **Palabras Clave**: Términos que deben aparecer en el contenido.
-   **Notas de Producción y Referencias**: Instrucciones adicionales y enlaces a ejemplos externos.

## Estados de la Orden
1.  **DRAFT**: Borrador en edición.
2.  **ORDER_CREATED**: Orden enviada y lista para ser procesada.
3.  **IDEAS_GENERATED**: El sistema ha recibido la propuesta de ideas del LLM.
4.  **IDEAS_APPROVED**: El usuario ha validado las ideas propuestas.
5.  **COMPLETED**: Proceso finalizado.
