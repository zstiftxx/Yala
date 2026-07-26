# Nota de diseño: Asistente de estudio + repositorio de ejercicios reales

> Idea en discusión (2026-07-24), **no implementada**. Este documento captura las conclusiones de la conversación para que no se diluyan. Nada de esto está en el código todavía.

## La idea en una frase

Un **asistente de estudio con IA** que es el gancho para el alumno, y que —como subproducto de usarlo— va **llenando, filtrando y clasificando un repositorio de ejercicios reales de la ULima**. Estudiar y aportar son el mismo gesto (el "2x1").

## El loop del MVP

> El alumno **sube un examen/apunte real** → la IA le **genera práctica a ese nivel y se la explica** → **practica** (y después, mecaniza) → en paralelo, ese **material real subido se filtra y clasifica al repositorio** compartido.

- Estudia porque le conviene → no hace falta recompensa para arrancar; la utilidad *es* la recompensa.
- El corpus se llena solo, como efecto colateral del uso → resuelve el arranque en frío.
- La IA se mantiene al nivel ULima porque **trabaja sobre material real subido**, no sobre el nombre del curso.

## Decisiones tomadas en la conversación

1. **El gancho es el asistente, pero el foso es el corpus.** Un asistente genérico compite contra el ChatGPT que el alumno ya tiene abierto, y pierde. Lo único que hace que valga la pena es que esté **anclado en ejercicios reales de la ULima al nivel del examen**. Las dos mitades (asistente + repositorio) no son separables: se necesitan mutuamente.

2. **La IA nunca crea el contenido "de verdad"; solo filtra y ordena.** El contenido real siempre sale de estudiantes subiendo material real. La IA es bibliotecario, no autor.

3. **Frontera de confianza (crítica):**
   - Lo que el alumno **sube** (real, ULima) → alimenta el repositorio.
   - Lo que la IA **genera** → es ayuda de estudio personal, **no** entra al repositorio como si fuera real (o va claramente marcado como "generado").
   - Mezclar generado con real, haciéndolo pasar por real, **rompe la "verificación innata"** del alumno: detecta al instante si el contenido no está al nivel y se va decepcionado. La calidad no es una función, es el producto entero.

4. **Clasificación por evaluación (EE1/EE2/EE3) = metadato, no inferencia.** La IA no puede saber qué tema cayó en qué evaluación de qué profe (eso *es* el sílabo, y no es público). Lo sabe **quien subió el ejercicio**, porque lo vivió → lo etiqueta al subir. Con suficientes aportes etiquetados, **el sílabo se reconstruye solo** desde los datos. Los estudiantes, en conjunto, son el sílabo.

5. **No entrenar un modelo.** El filtro de adecuación y la sugerencia de tema son **una llamada a un LLM por API** con un prompt (no un modelo entrenado con datasets). Barato y casi instantáneo. Encaja con la moderación reactiva ya existente (ver `materiales`).

6. **Prioridad de funciones del asistente** (según el usuario):
   1. **Generar ejercicios de práctica + explicarlos** — el gancho principal.
   2. **Mecanizar** — repetir *un* tipo de ejercicio hasta dominarlo. Es sobre todo UI encima del #1 (mismo motor).
   3. **Modo examen** — cronómetro, sin ayuda a mitad, corrección/nota. Otro animal (reusa poco), va al final.

## Riesgos / focos rojos anotados

- **Consentimiento y propiedad.** Subir algo "para estudiarlo yo" ≠ compartirlo con todos. Debe ser **opt-in explícito**. Ojo con material que no es del alumno (diapositivas del profe, libros pagos) → derechos de autor, no solo moderación.
- **"Estudiar con" ≠ "ejercicio para otros".** Lo que subo para mí puede ser una foto borrosa. Sirve para mí + la IA, pero como aporte al repositorio es materia prima cruda → la capa de filtrar/clasificar **sigue siendo necesaria** entre el subproducto y el repositorio público.
- **El texto subido es contenido no confiable** (posible prompt injection contra el LLM evaluador). El filtro automático **complementa**, no reemplaza, el reporte comunitario.
- **El costo cambia de forma.** Antes: una llamada al LLM por aporte (esporádico). Ahora: una llamada **por sesión de estudio, por usuario activo** → costo continuo que crece con el uso. No prohibitivo, pero a tener en el radar desde el día uno.

## Relación con lo que ya existe

- Extiende la tabla `materiales` (`/curso/:curso`), que hoy guarda **enlaces** con moderación reactiva. Este proyecto la lleva de "enlaces" a "ejercicios con contenido + metadato de evaluación".
- La malla completa de las 14 carreras (`data/mallaCurricular.js`) es el insumo para generar la taxonomía de temas por curso.

## Bloqueadores para poder empezar (decisiones del usuario, no código)

1. **Qué LLM por API + presupuesto** (Anthropic/OpenAI): implica una API key y un costo continuo.
2. **Cómo entra el material**: pegar texto (lo más simple, sin Storage) vs. subir archivos (PDF/imagen → requiere Supabase Storage, que hasta ahora se evitó a propósito).

Hasta no cerrar esas dos, el MVP no puede arrancar de verdad.
