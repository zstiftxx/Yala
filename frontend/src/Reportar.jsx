import { AlertTriangle } from 'lucide-react';
import FormularioMensaje from './FormularioMensaje.jsx';

const TIPOS = [
  { valor: 'bug', etiqueta: 'Error o falla de la app' },
  { valor: 'dato_malla', etiqueta: 'Dato incorrecto en una malla' },
  { valor: 'curso', etiqueta: 'Problema con un curso' },
  { valor: 'otro', etiqueta: 'Otro' },
];

export default function Reportar() {
  return (
    <FormularioMensaje
      active="reportar"
      titulo="Reportar un problema"
      intro="Encontraste un error o un dato mal puesto en una malla? Cuentanos para corregirlo."
      tabla="reportes"
      tipos={TIPOS}
      tipoInicial="bug"
      etiquetaTipo="Tipo de problema"
      etiquetaMensaje="Descripcion"
      placeholder="Describe el problema con el mayor detalle posible..."
      vacio="Describe el problema antes de enviar."
      textoBoton="Enviar reporte"
      textoEnviando="Enviando..."
      exito="Reporte enviado. Gracias por avisarnos."
      icono={AlertTriangle}
      // La carrera da contexto: un dato malo de malla casi siempre es de la suya.
      extra={({ carrera }) => ({ carrera: carrera || null })}
    />
  );
}
