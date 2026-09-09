import { useNoteLinkPreferenceStore } from '../../store/useNoteLinkPreferenceStore';

export function NoteLinksCard() {
  const { openLinkOnClick, setOpenLinkOnClick } = useNoteLinkPreferenceStore();

  return (
    <div className="card settings-card">
      <div>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>Notas con enlaces</h3>
      </div>
      <p className="settings-help-text">
        Si el contenido de una nota es únicamente un enlace, hacer clic en ella lo abrirá directamente
        (en PC podés seguir editando con el botón de lápiz; en el celular, tocar la nota la edita y hay
        un botón aparte para abrir el enlace).
      </p>
      <div className="settings-toggle-row">
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Abrir enlace al hacer clic</span>
        <button
          type="button"
          className="settings-toggle"
          role="switch"
          aria-checked={openLinkOnClick}
          aria-label="Abrir enlace al hacer clic en una nota-enlace"
          onClick={() => setOpenLinkOnClick(!openLinkOnClick)}
        >
          <span className="settings-toggle-knob" />
        </button>
      </div>
    </div>
  );
}
