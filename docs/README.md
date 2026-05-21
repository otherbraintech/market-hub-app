# Documentación de Market Ops

Bienvenido a la documentación oficial de **Market Ops**, el sistema integral para la gestión y automatización de operaciones de marketing.

## Estructura de la Documentación

Esta documentación está organizada siguiendo el flujo de trabajo lógico del sistema:

1.  **[Introducción](01-introduccion.md)**: Visión general del proyecto y su finalidad.
2.  **[Creación del Negocio](02-creacion-negocio.md)**: Primer paso para empezar a trabajar.
3.  **[Configuración de Datos Base](03-configuracion-base.md)**: Definición de la identidad y el público objetivo.
4.  **[Órdenes de Planificación](04-ordenes-planificacion.md)**: Creación de solicitudes de contenido para periodos específicos.
5.  **[Integración con n8n y LLM](05-integracion-n8n.md)**: Flujo de procesamiento de datos y generación de resultados.
6.  **[Análisis de Canales y Concurrencia UI](06-analisis-canales.md)**: Detalle del análisis IA y el control de concurrencia e interactividad de la UI.

---

## Flujo de Trabajo Rápido

Para obtener resultados con el sistema, debes seguir estos pasos en orden:

1.  **Registrar el Negocio**: Proporcionar la información básica (Nombre, Tipo, Propuesta de Valor).
2.  **Configurar Datos Base**: Llenar el formulario de configuración para que el sistema "conozca" la marca (Tonos, Dolores, Deseos, Competidores).
3.  **Crear Orden de Planificación**: Definir fechas y objetivos específicos de marketing.
4.  **Procesar**: El sistema envía un paquete completo de datos a un webhook de **n8n** donde un **LLM** procesa la información para generar estrategias y calendarios.
