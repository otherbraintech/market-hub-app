# Configuración de Datos Base

Una vez creado el negocio, es imperativo configurar sus datos base. Esta es la fase más crítica, ya que proporciona el "contexto profundo" que el LLM utilizará para generar contenido que realmente resuene con la audiencia y respete la identidad de la marca.

## Secciones de Configuración

### 1. Identidad de Marca
-   **Años en el mercado**: Experiencia y madurez del negocio.
-   **Ubicación (País/Ciudad)**: Contexto geográfico.
-   **Área de Cobertura**: Local, Nacional o Internacional.
-   **Tono de Marca**: Formal, Juvenil, Profesional, Premium, Divertido, Cercano, etc.
-   **Personalidad**: Adjetivos que describen cómo se comporta la marca.
-   **Nivel de Lenguaje**: Simple, Medio o Avanzado.
-   **Emojis y Palabras Prohibidas**: Restricciones de comunicación.

### 2. Público Objetivo (Buyer Persona)
-   **Género**: Hombre, Mujer o Mixto.
-   **Rangos de Edad**: Segmentación por edades o "Todas las edades".
-   **Punto de Dolor Principal (Pain Point)**: El problema real que el cliente intenta resolver.
-   **Deseo Principal**: El resultado ideal que el cliente busca.
-   **Objección Principal**: Por qué el cliente podría dudar en comprar.
-   **Motivación de Compra**: Qué impulsa finalmente la decisión.

### 3. Detalles de Mercado
-   **Ticket Promedio**: Bajo, Medio o Alto.
-   **Frecuencia de Compra**: Ocasional o Recurrente.
-   **Competidores**: Listado de competidores con sus nombres, URLs y redes sociales para análisis comparativo.

### 4. Estilo Visual y Canales
-   **Estilo Visual**: Minimalista, Moderno, Elegante, Colorido u Oscuro.
-   **Colores de Marca**: Definición de la paleta cromática.
-   **Canales Activos**: Redes sociales y plataformas donde el negocio tiene presencia.

## Finalidad de la Configuración Base
Estos datos se almacenan en el modelo `BusinessBaseConfig`. Cuando se crea una orden de planificación, estos datos se adjuntan automáticamente para que la IA no trabaje en el vacío y mantenga la alineación estratégica.
