import { useState } from 'react';

// El tema se guarda en localStorage['tema'] y se aplica con data-theme sobre el
// contenedor de cada pantalla (.app-shell o .auth-page), que es donde viven las
// variables CSS. Login, el shell y el onboarding hacian los mismos cuatro
// renglones cada uno.
export function useTema() {
  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'light');

  const alternarTema = () => {
    const nuevo = tema === 'light' ? 'dark' : 'light';
    setTema(nuevo);
    localStorage.setItem('tema', nuevo);
  };

  return { tema, alternarTema };
}
