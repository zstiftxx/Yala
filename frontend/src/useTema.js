import { useEffect, useState } from 'react';

// Colores que ve el navegador (barra de direcciones en Android, franja de
// estado). Son los mismos --shell-bg de index.css; si cambian alla, cambian
// aca, porque el meta no entiende variables CSS.
const COLOR_BARRA = { light: '#faf8f5', dark: '#14120f' };

// El tema se guarda en localStorage['tema'] y se aplica con data-theme sobre
// <html>, que es donde viven las variables CSS (index.css). Antes iba en el
// contenedor de cada pantalla, y el fondo no llegaba a <body>: en movil se veia
// una franja blanca al terminar el scroll. index.html lo aplica una primera vez
// antes de montar React para que no haya flash blanco al cargar en oscuro.
export function useTema() {
  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_BARRA[tema]);
  }, [tema]);

  const alternarTema = () => {
    const nuevo = tema === 'light' ? 'dark' : 'light';
    setTema(nuevo);
    localStorage.setItem('tema', nuevo);
  };

  return { tema, alternarTema };
}
