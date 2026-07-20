import { useCallback, useSyncExternalStore } from 'react';

// Punto de corte compartido con las media queries de App.css. Si cambia uno,
// cambia el otro: el layout y la navegacion tienen que decidir lo mismo.
export const CORTE_MOVIL = '(max-width: 900px)';

// El ancho de la ventana es estado que vive FUERA de React, asi que se lee con
// useSyncExternalStore en vez de useState + useEffect: el valor del primer
// render ya es el real (nada de repintar la navegacion tras montar) y React se
// encarga de re-suscribir si cambia la query.
export function useEsMovil(query = CORTE_MOVIL) {
  const suscribir = useCallback(
    (avisar) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', avisar);
      return () => mq.removeEventListener('change', avisar);
    },
    [query],
  );

  const leer = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(suscribir, leer);
}
