import { supabase } from './supabaseClient';

// Acceso a la tabla `materiales` (ver supabase/materiales.sql). Vive aparte de
// la pagina para que CursoDetalle solo se ocupe de pintar: aca se centraliza el
// nombre de las columnas y la traduccion de errores de Postgres a algo que el
// usuario pueda leer.

export const TIPOS_MATERIAL = [
  { valor: 'apunte', etiqueta: 'Apunte' },
  { valor: 'resumen', etiqueta: 'Resumen' },
  { valor: 'examen', etiqueta: 'Examen' },
  { valor: 'otro', etiqueta: 'Otro' },
];

export function etiquetaTipo(valor) {
  return TIPOS_MATERIAL.find((t) => t.valor === valor)?.etiqueta || 'Otro';
}

// Errores esperables, en el mismo formato que ya usan Feedback/Reportar.
// `sesion: true` avisa a la pagina que debe mandar al login.
function traducirError(error) {
  const texto = (error.message || '').toLowerCase();
  if (texto.includes('session') || texto.includes('jwt')) {
    return { sesion: true, mensaje: 'Tu sesion expiro.' };
  }
  if (error.code === '42P01' || texto.includes('does not exist')) {
    return {
      mensaje:
        'La tabla de materiales aun no existe en Supabase. Corre el SQL de supabase/materiales.sql.',
    };
  }
  return { mensaje: error.message };
}

export async function listarMateriales(curso) {
  const { data, error } = await supabase
    .from('materiales')
    .select('id, user_id, curso, tipo, titulo, url, ciclo, aprobado, created_at')
    .eq('curso', curso)
    .order('created_at', { ascending: false });

  if (error) return { error: traducirError(error) };
  return { materiales: data || [] };
}

// Solo se aceptan enlaces http(s): la URL termina en un href, y un `javascript:`
// pegado por alguien mas seria un XSS de un clic.
export function normalizarUrl(entrada) {
  const texto = (entrada || '').trim();
  if (!texto) return null;
  const conEsquema = /^https?:\/\//i.test(texto) ? texto : `https://${texto}`;
  try {
    const url = new URL(conEsquema);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function crearMaterial({ usuario, carrera, curso, tipo, titulo, url, ciclo }) {
  const { data, error } = await supabase
    .from('materiales')
    .insert({
      user_id: usuario?.id || null,
      carrera: carrera || null,
      curso,
      tipo,
      titulo: titulo.trim(),
      url,
      ciclo: ciclo?.trim() || null,
    })
    .select()
    .single();

  if (error) return { error: traducirError(error) };
  return { material: data };
}

export async function borrarMaterial(id) {
  const { error } = await supabase.from('materiales').delete().eq('id', id);
  if (error) return { error: traducirError(error) };
  return {};
}
