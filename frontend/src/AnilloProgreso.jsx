// Anillo de progreso del Dashboard. Es SVG y no una libreria de graficos: es
// un solo circulo, y traer una dependencia entera para esto costaria mas KB que
// toda la pantalla.
//
// El truco es stroke-dasharray = circunferencia y stroke-dashoffset = lo que
// falta: el borde se "consume" segun el porcentaje.
export default function AnilloProgreso({ porcentaje, tamano = 132, grosor = 11 }) {
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const avance = circunferencia * (1 - Math.min(Math.max(porcentaje, 0), 100) / 100);

  return (
    <div className="anillo" style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} aria-hidden="true">
        {/* -90deg para que el progreso arranque arriba y no a la derecha. */}
        <g transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}>
          <circle
            cx={tamano / 2}
            cy={tamano / 2}
            r={radio}
            fill="none"
            stroke="var(--shell-border)"
            strokeWidth={grosor}
          />
          <circle
            className="anillo-avance"
            cx={tamano / 2}
            cy={tamano / 2}
            r={radio}
            fill="none"
            stroke="var(--shell-accent)"
            strokeWidth={grosor}
            strokeLinecap="round"
            strokeDasharray={circunferencia}
            strokeDashoffset={avance}
          />
        </g>
      </svg>
      <div className="anillo-centro">
        <strong>{porcentaje}</strong>
        <span>%</span>
      </div>
    </div>
  );
}
