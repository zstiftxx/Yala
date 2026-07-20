import { Send } from 'lucide-react';
import FormularioMensaje from './FormularioMensaje.jsx';

const TIPOS = [
  { valor: 'sugerencia', etiqueta: 'Sugerencia' },
  { valor: 'idea', etiqueta: 'Idea nueva' },
  { valor: 'queja', etiqueta: 'Queja' },
  { valor: 'otro', etiqueta: 'Otro' },
];

export default function Feedback() {
  return (
    <FormularioMensaje
      active="feedback"
      titulo="Feedback"
      intro="Cuentanos que te parece la app, que te gustaria ver o que podriamos mejorar."
      tabla="feedback"
      tipos={TIPOS}
      tipoInicial="sugerencia"
      etiquetaTipo="Tipo"
      etiquetaMensaje="Mensaje"
      placeholder="Escribe tu comentario..."
      vacio="Escribe tu mensaje antes de enviar."
      textoBoton="Enviar feedback"
      textoEnviando="Enviando..."
      exito="Gracias por tu feedback. Lo recibimos."
      icono={Send}
    />
  );
}
