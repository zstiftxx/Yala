// Cuando una tabla no existe, el error que llega al navegador NO es el de
// Postgres: PostgREST lo intercepta y responde 404 con codigo PGRST205 y el
// mensaje "Could not find the table 'public.x' in the schema cache".
//
// El codigo original solo miraba 42P01 (el de Postgres, que se ve al correr SQL
// directo) y el texto "does not exist", asi que ninguna de las dos condiciones
// acertaba y en pantalla salia el error crudo en vez del aviso de correr el SQL.
// Se dejan las tres comprobaciones porque las tres son reales segun por donde
// venga el error.
export function faltaLaTabla(error) {
  if (!error) return false;
  const texto = (error.message || '').toLowerCase();
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    texto.includes('does not exist') ||
    texto.includes('could not find the table')
  );
}

// La sesion vencida llega como mensaje, no como codigo estable.
export function sesionInvalida(error) {
  const texto = (error?.message || '').toLowerCase();
  return texto.includes('session') || texto.includes('jwt');
}
