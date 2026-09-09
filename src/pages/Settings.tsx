import { Settings as SettingsIcon } from 'lucide-react';
import { PushNotificationCard } from '../components/settings/PushNotificationCard';
import { ThemeCard } from '../components/settings/ThemeCard';
import { NoteLinksCard } from '../components/settings/NoteLinksCard';
import { AppFooter } from '../components/AppFooter';
import './Settings.css';

export function Settings() {
  return (
    <div className="page-container fade-in" style={{ padding: 'max(1rem, 3vw)', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.75rem', fontWeight: 'bold' }}>
          <SettingsIcon size={28} className="text-accent" />
          Ajustes
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Notificaciones y preferencias.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <ThemeCard />
        <PushNotificationCard />
        <NoteLinksCard />
      </div>

      <AppFooter />
    </div>
  );
}
