import { useEffect, useState } from 'react';

// Punto de corte compartido con las media queries de App.css. Si cambia uno,
// cambia el otro: el layout y la navegacion tienen que decidir lo mismo.
export const CORTE_MOVIL = '(max-width: 900px)';

export function useEsMovil(query = CORTE_MOVIL) {
  const [esMovil, setEsMovil] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const alCambiar = (e) => setEsMovil(e.matches);
    mq.addEventListener('change', alCambiar);
    // El ancho pudo cambiar entre el primer render y este efecto.
    setEsMovil(mq.matches);
    return () => mq.removeEventListener('change', alCambiar);
  }, [query]);

  return esMovil;
}
