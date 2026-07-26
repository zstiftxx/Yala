import { supabase } from './supabaseClient';

// Unica capa que habla con la Edge Function `asistente`
// (ver supabase/functions/asistente/index.ts). Las paginas no llaman a
// supabase.functions.invoke por su cuenta, igual que no llaman a
// supabase.from('materiales') por su cuenta.
//
// La API key del modelo NO esta aqui ni puede estarlo: cualquier cosa que
// viva en frontend/src termina dentro del bundle que descarga el navegador.
// Aca solo se manda el archivo y la pregunta; la key la pone el servidor.

// Mismo tope que valida la funcion, repetido aca solo para avisar antes de
// subir 6 MB por la red y recibir un 413.
const MAX_ARCHIVO = 6 * 1024 * 1024;

const TIPOS_OK = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

// El navegador no da base64 directo: FileReader devuelve un data URL
// ("data:application/pdf;base64,JVBERi0..."), hay que cortarle la cabecera.
function aBase64(archivo) {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result).split(',')[1] ?? '');
    lector.onerror = () => rechazar(lector.error);
    lector.readAsDataURL(archivo);
  });
}

/**
 * Manda material + pregunta al asistente.
 *
 * @param {{ pregunta: string, archivo?: File, curso?: string }} args
 * @returns {Promise<{ texto?: string, usadas?: number, limite?: number, error?: { mensaje: string, sesion?: boolean } }>}
 */
export async function preguntarAlAsistente({ pregunta, archivo, curso }) {
  if (!pregunta?.trim()) {
    return { error: { mensaje: 'Escribe que quieres que haga con el material.' } };
  }

  let adjunto;
  if (archivo) {
    if (archivo.size > MAX_ARCHIVO) {
      return { error: { mensaje: 'El archivo es demasiado grande (max 6 MB).' } };
    }
    if (!TIPOS_OK.includes(archivo.type)) {
      return { error: { mensaje: 'Solo se aceptan PDF o imagenes (JPG, PNG, GIF, WebP).' } };
    }
    try {
      adjunto = { tipo: archivo.type, datosBase64: await aBase64(archivo) };
    } catch {
      return { error: { mensaje: 'No se pudo leer el archivo.' } };
    }
  }

  const { data, error } = await supabase.functions.invoke('asistente', {
    body: { pregunta: pregunta.trim(), archivo: adjunto, curso },
  });

  if (error) {
    // En supabase-js v2 un status != 2xx llega como FunctionsHttpError y la
    // respuesta real viene en error.context. Sin leerla, el usuario ve
    // "Edge Function returned a non-2xx status code" en vez del motivo.
    let cuerpo = null;
    try {
      cuerpo = await error.context?.json();
    } catch {
      /* la funcion no devolvio JSON: se cae al mensaje generico */
    }

    if (cuerpo?.sesion) {
      return { error: { mensaje: cuerpo.error, sesion: true } };
    }
    return {
      error: {
        mensaje: cuerpo?.error || 'No se pudo consultar al asistente. Intenta de nuevo.',
      },
      usadas: cuerpo?.usadas,
      limite: cuerpo?.limite,
    };
  }

  return { texto: data.texto, usadas: data.usadas, limite: data.limite };
}

/** Cuantas consultas lleva hoy el usuario (para mostrar "te quedan N"). */
export async function consultasDeHoy() {
  const { data, error } = await supabase
    .from('uso_ia')
    .select('llamadas')
    .eq('dia', new Date().toISOString().slice(0, 10))
    .maybeSingle();

  if (error) return { usadas: 0 };
  return { usadas: data?.llamadas ?? 0 };
}
