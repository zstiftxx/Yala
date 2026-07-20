import { createContext, useContext } from 'react';

// El contexto y su hook viven aparte del provider para no mezclar exports de
// componentes con exports de funciones (lo pide react-refresh).
export const UserContext = createContext(null);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser debe usarse dentro de <UserProvider>');
  return ctx;
}
