import { useEffect } from 'react';
import { Bell, BellOff, BellRing, ShieldAlert } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { IosInstallInstructions } from './IosInstallInstructions';

const LEAD_DAYS_OPTIONS = [
  { value: 0, label: 'El mismo día' },
  { value: 1, label: '1 día antes' },
  { value: 3, label: '3 días antes' },
  { value: 7, label: '7 días antes' },
];

export function PushNotificationCard() {
  const {
    browserPermission,
    isIosNotInstalled,
    isSubscribedOnThisDevice,
    leadDays,
    loading,
    checkStatus,
    enablePush,
    disablePush,
    updateLeadDays,
  } = useNotificationStore();

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleToggle = () => {
    if (loading) return;
    if (isSubscribedOnThisDevice) {
      disablePush();
    } else {
      enablePush();
    }
  };

  let badge: { className: string; icon: React.ReactNode; label: string };
  let helpText: string;
  let toggleDisabled = loading;

  if (browserPermission === 'unsupported') {
    badge = { className: 'off', icon: <BellOff size={13} />, label: 'No soportado' };
    helpText = 'Tu navegador no soporta notificaciones push.';
    toggleDisabled = true;
  } else if (isIosNotInstalled) {
    badge = { className: 'warning', icon: <ShieldAlert size={13} />, label: 'Requiere instalar la app' };
    helpText = 'En iPhone/iPad, las notificaciones solo funcionan si instalás la app en tu pantalla de inicio.';
    toggleDisabled = true;
  } else if (browserPermission === 'denied') {
    badge = { className: 'blocked', icon: <ShieldAlert size={13} />, label: 'Bloqueadas' };
    helpText = 'Bloqueaste las notificaciones para esta app. Para activarlas, habilitalas manualmente desde la configuración de tu navegador (el candado o el ícono de información junto a la dirección del sitio).';
    toggleDisabled = true;
  } else if (isSubscribedOnThisDevice) {
    badge = { className: 'on', icon: <BellRing size={13} />, label: 'Activadas en este dispositivo' };
    helpText = 'Vas a recibir un aviso cuando una tarea esté por vencer, según la anticipación elegida abajo.';
  } else {
    badge = { className: 'off', icon: <Bell size={13} />, label: 'Desactivadas' };
    helpText = 'Activá las notificaciones para recibir un aviso antes de que venzan tus tareas, aunque no tengas la app abierta.';
  }

  return (
    <div className="card settings-card">
      <div>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>Notificaciones push</h3>
        <span className={`settings-status-badge ${badge.className}`}>
          {badge.icon} {badge.label}
        </span>
      </div>

      <p className="settings-help-text">{helpText}</p>

      {isIosNotInstalled && <IosInstallInstructions />}

      <div className="settings-toggle-row">
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Activar notificaciones</span>
        <button
          type="button"
          className="settings-toggle"
          role="switch"
          aria-checked={isSubscribedOnThisDevice}
          aria-label="Activar notificaciones push"
          disabled={toggleDisabled}
          onClick={handleToggle}
        >
          <span className="settings-toggle-knob" />
        </button>
      </div>

      {isSubscribedOnThisDevice && (
        <>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Avisarme con anticipación:
            </span>
            <div className="settings-lead-days">
              {LEAD_DAYS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={leadDays === opt.value ? 'active' : ''}
                  disabled={loading}
                  onClick={() => updateLeadDays(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
