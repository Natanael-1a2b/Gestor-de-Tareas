import { Share, PlusSquare } from 'lucide-react';

export function IosInstallInstructions() {
  return (
    <div className="ios-install-instructions">
      <strong>En iPhone/iPad las notificaciones solo funcionan si instalás la app:</strong>
      <ol>
        <li>Abrí esta página en Safari.</li>
        <li>
          Tocá el botón <Share size={13} style={{ verticalAlign: '-2px' }} aria-hidden="true" /> "Compartir".
        </li>
        <li>
          Elegí <PlusSquare size={13} style={{ verticalAlign: '-2px' }} aria-hidden="true" /> "Agregar a pantalla de inicio".
        </li>
        <li>Abrí la app desde el ícono que se agregó a tu pantalla de inicio y volvé a intentarlo aquí.</li>
      </ol>
    </div>
  );
}
