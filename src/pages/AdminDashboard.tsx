import { useState, useEffect, ViewTransition } from 'react';
import { adminService } from '../services/adminService';
import { toast } from 'sonner';
import { Shield, Mail, Trash2, Edit2, Check, X, Loader2, ScrollText, Megaphone, AlertTriangle, Search, ChevronDown, ChevronRight, KeyRound, UserPlus } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuthStore } from '../store/useAuthStore';
import { useAdminStore } from '../store/useAdminStore';
import { Navigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import type { User } from '@supabase/supabase-js';

interface AuditLogEntry {
  id: string;
  admin_email: string;
  action: 'update_email' | 'delete_user' | 'grant_admin' | 'revoke_admin' | 'update_name' | 'reset_password' | 'create_user';
  target_user_id: string | null;
  target_email: string | null;
  created_at: string;
}

const AUDIT_ACTION_LABEL: Record<AuditLogEntry['action'], string> = {
  update_email: 'Editó el correo de',
  delete_user: 'Eliminó a',
  grant_admin: 'Le dio rol de admin a',
  revoke_admin: 'Le quitó el rol de admin a',
  update_name: 'Editó el nombre de',
  reset_password: 'Cambió la contraseña de',
  create_user: 'Creó la cuenta de',
};

export function AdminDashboard() {
  const { user } = useAuthStore();
  const { isAdmin, checkAdmin } = useAdminStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editEmailValue, setEditEmailValue] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const [editingNameUserId, setEditingNameUserId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createName, setCreateName] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [userToToggleRole, setUserToToggleRole] = useState<User | null>(null);
  const [isTogglingRole, setIsTogglingRole] = useState(false);

  const [broadcastTitle, setBroadcastTitle] = useState('¡Nueva versión disponible!');
  const [broadcastBody, setBroadcastBody] = useState(
    'Abre la app y presiona "Actualizar ahora" cuando aparezca el aviso para ver las novedades.'
  );
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [confirmBroadcast, setConfirmBroadcast] = useState(false);

  useEffect(() => {
    checkAdmin(user?.id);
  }, [user?.id, checkAdmin]);

  const loadAuditLog = async () => {
    setIsAuditLoading(true);
    try {
      const data = await adminService.getAuditLog();
      setAuditLog(data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar la auditoría');
    } finally {
      setIsAuditLoading(false);
    }
  };

  const loadUsers = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await adminService.getUsers();
      // Ordenar por fecha de creación (más nuevos primero)
      setUsers(data.sort((a: User, b: User) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminIds = async () => {
    try {
      const ids = await adminService.getAdminIds();
      setAdminIds(new Set(ids));
    } catch (error: unknown) {
      console.error('Error al cargar los administradores:', error);
    }
  };

  useEffect(() => {
    if (isAdmin === true) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadUsers(false);
      loadAuditLog();
      loadAdminIds();
    }
  }, [isAdmin]);

  const handleConfirmToggleRole = async () => {
    if (!userToToggleRole) return;
    const makingAdmin = !adminIds.has(userToToggleRole.id);

    setIsTogglingRole(true);
    try {
      if (makingAdmin) {
        await adminService.grantAdmin(userToToggleRole.id, userToToggleRole.email ?? undefined);
        toast.success(`${userToToggleRole.email} ahora es administrador`);
      } else {
        await adminService.revokeAdmin(userToToggleRole.id, userToToggleRole.email ?? undefined);
        toast.success(`Se le quitó el rol de administrador a ${userToToggleRole.email}`);
      }
      await loadAdminIds();
      loadAuditLog();
      setUserToToggleRole(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al cambiar el rol');
    } finally {
      setIsTogglingRole(false);
    }
  };

  const handleSaveEmail = async (userId: string) => {
    if (!editEmailValue.trim()) {
      toast.error('El correo no puede estar vacío');
      return;
    }
    
    // Validación rápida de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmailValue)) {
      toast.error('Formato de correo inválido');
      return;
    }

    try {
      await adminService.updateUserEmail(userId, editEmailValue);
      toast.success('Correo actualizado con éxito');
      setEditingUserId(null);
      loadUsers(); // Recargar la lista
      loadAuditLog();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar');
    }
  };

  const handleSaveName = async (userId: string) => {
    try {
      await adminService.updateUserName(userId, editNameValue.trim());
      toast.success('Nombre actualizado con éxito');
      setEditingNameUserId(null);
      loadUsers();
      loadAuditLog();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el nombre');
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!userToResetPassword) return;
    if (newPasswordValue.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsResettingPassword(true);
    try {
      await adminService.resetUserPassword(userToResetPassword.id, newPasswordValue);
      toast.success(`Contraseña actualizada para ${userToResetPassword.email}`);
      setUserToResetPassword(null);
      setNewPasswordValue('');
      loadAuditLog();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al cambiar la contraseña');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail.trim() || !createPassword) {
      toast.error('Completa el correo y la contraseña');
      return;
    }
    if (createPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsCreatingUser(true);
    try {
      await adminService.createUser(createEmail.trim(), createPassword, createName.trim());
      toast.success('Usuario creado con éxito');
      setIsCreateUserOpen(false);
      setCreateEmail('');
      setCreatePassword('');
      setCreateName('');
      loadUsers();
      loadAuditLog();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al crear el usuario');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleBroadcastPush = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      toast.error('Completa el título y el mensaje');
      return;
    }

    setIsBroadcasting(true);
    try {
      const result = await adminService.broadcastPush(broadcastTitle, broadcastBody);
      toast.success(`Notificación enviada a ${result.sent} dispositivo(s)`);
      setConfirmBroadcast(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar la notificación');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (!adminPassword) {
      toast.error('Debes ingresar tu contraseña para confirmar');
      return;
    }
    
    setIsDeleting(true);
    try {
      // 1. Verificar la contraseña del administrador actual
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: adminPassword
      });

      if (authError) {
        throw new Error('Contraseña de administrador incorrecta');
      }

      // 2. Si la contraseña es correcta, proceder a eliminar
      await adminService.deleteUser(userToDelete.id);
      toast.success('Usuario eliminado permanentemente');
      setUserToDelete(null);
      setAdminPassword('');
      loadUsers(); // Recargar la lista
      loadAuditLog();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isAdmin === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Loader2 size={32} className="spin text-accent" />
      </div>
    );
  }

  if (isAdmin === false) {
    return <Navigate to="/" replace />;
  }

  const filteredUsers = userSearch.trim()
    ? users.filter((u) => {
        const q = userSearch.trim().toLowerCase();
        return u.email?.toLowerCase().includes(q) || (u.user_metadata?.full_name ?? '').toLowerCase().includes(q);
      })
    : users;

  const filteredAuditLog = auditSearch.trim()
    ? auditLog.filter((entry) =>
        entry.admin_email.toLowerCase().includes(auditSearch.trim().toLowerCase()) ||
        (entry.target_email ?? '').toLowerCase().includes(auditSearch.trim().toLowerCase())
      )
    : auditLog;

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-md)', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-xl)' }}>
        <div style={{ background: 'var(--accent)', color: 'white', padding: '12px', borderRadius: 'var(--radius-md)' }}>
          <Shield size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Panel de Administración</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gestiona las cuentas de los usuarios de la plataforma.</p>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border)', background: 'var(--bg-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Usuarios Registrados ({users.length})</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setIsCreateUserOpen(true)} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              <UserPlus size={14} style={{ marginRight: '4px' }} />
              Crear usuario
            </button>
            <button onClick={() => loadUsers(true)} className="btn btn-secondary" disabled={isLoading} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              {isLoading ? <Loader2 size={14} className="spin" /> : 'Actualizar'}
            </button>
          </div>
        </div>

        <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border)' }}>
          <div className="filter-search" style={{ maxWidth: '320px' }}>
            <span className="filter-search-icon" aria-hidden="true"><Search size={15} /></span>
            <input
              className="input filter-search-input"
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              aria-label="Buscar usuarios por nombre o correo"
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 0 12px var(--space-lg)', width: '1%' }}></th>
                <th style={{ padding: '12px var(--space-lg)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Nombre</th>
                <th style={{ padding: '12px var(--space-lg)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Último Acceso</th>
                <th style={{ padding: '12px var(--space-lg)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <Loader2 size={24} className="spin" style={{ margin: '0 auto 10px' }} />
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    {userSearch.trim() ? `No se encontraron usuarios para "${userSearch}".` : 'No se encontraron usuarios.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <ViewTransition key={u.id}>
                    <>
                    <tr style={{ borderBottom: expandedUserId === u.id ? 'none' : '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 0 12px var(--space-lg)' }}>
                        <button
                          onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
                          className="btn-icon"
                          title={expandedUserId === u.id ? 'Ocultar detalles' : 'Ver más detalles'}
                          aria-label={expandedUserId === u.id ? `Ocultar detalles de ${u.email}` : `Ver más detalles de ${u.email}`}
                          aria-expanded={expandedUserId === u.id}
                        >
                          {expandedUserId === u.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>
                      <td data-label="Nombre" style={{ padding: '12px var(--space-lg)' }}>
                        {editingNameUserId === u.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <input
                              type="text"
                              value={editNameValue}
                              onChange={e => setEditNameValue(e.target.value)}
                              style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--accent)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem', width: '100%', minWidth: '120px' }}
                              autoFocus
                            />
                            <button onClick={() => handleSaveName(u.id)} className="btn-icon" style={{ color: 'var(--success)', flexShrink: 0 }} title="Guardar" aria-label="Guardar nombre">
                              <Check size={16} />
                            </button>
                            <button onClick={() => setEditingNameUserId(null)} className="btn-icon" style={{ color: 'var(--text-secondary)', flexShrink: 0 }} title="Cancelar" aria-label="Cancelar edición">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.user_metadata?.full_name || <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>Sin nombre</span>}
                            </span>
                            {u.email === user?.email && (
                              <span style={{ fontSize: '0.7rem', background: 'var(--accent)', color: 'white', padding: '2px 6px', borderRadius: '10px', fontWeight: 600, flexShrink: 0 }}>TÚ</span>
                            )}
                            {adminIds.has(u.id) && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', background: 'var(--priority-alta-bg)', color: 'var(--priority-alta)', padding: '2px 6px', borderRadius: '10px', fontWeight: 600, flexShrink: 0 }}>
                                <Shield size={10} /> Admin
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td data-label="Último Acceso" style={{ padding: '12px var(--space-lg)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {(() => {
                          const last = u.user_metadata?.last_seen || u.last_sign_in_at;
                          return last ? new Date(last).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Nunca';
                        })()}
                      </td>
                      <td data-label="Acciones" style={{ padding: '12px var(--space-lg)', textAlign: 'right' }}>
                        {u.email !== user?.email && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              onClick={() => setUserToToggleRole(u)}
                              className="btn-icon"
                              title={adminIds.has(u.id) ? 'Quitar rol de administrador' : 'Hacer administrador'}
                              aria-label={adminIds.has(u.id) ? `Quitar rol de administrador a ${u.email}` : `Hacer administrador a ${u.email}`}
                              style={{ color: adminIds.has(u.id) ? 'var(--priority-alta)' : undefined }}
                            >
                              <Shield size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingNameUserId(u.id);
                                setEditNameValue(u.user_metadata?.full_name || '');
                              }}
                              className="btn-icon"
                              title="Editar nombre"
                              aria-label={`Editar nombre de ${u.email}`}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => setUserToResetPassword(u)}
                              className="btn-icon"
                              title="Cambiar contraseña"
                              aria-label={`Cambiar contraseña de ${u.email}`}
                            >
                              <KeyRound size={16} />
                            </button>
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="btn-icon" 
                              style={{ color: 'var(--priority-alta)' }}
                              title="Eliminar usuario"
                              aria-label={`Eliminar usuario ${u.email}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedUserId === u.id && (
                      <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
                        <td colSpan={4} style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '0.85rem' }}>
                            <div>
                              <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '4px' }}>Correo electrónico</span>
                              {editingUserId === u.id ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input
                                    type="email"
                                    value={editEmailValue}
                                    onChange={e => setEditEmailValue(e.target.value)}
                                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--accent)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', width: '100%', minWidth: '160px' }}
                                    autoFocus
                                  />
                                  <button onClick={() => handleSaveEmail(u.id)} className="btn-icon" style={{ color: 'var(--success)', flexShrink: 0 }} title="Guardar" aria-label="Guardar correo">
                                    <Check size={16} />
                                  </button>
                                  <button onClick={() => setEditingUserId(null)} className="btn-icon" style={{ color: 'var(--text-secondary)', flexShrink: 0 }} title="Cancelar" aria-label="Cancelar edición">
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Mail size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                  <span style={{ color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{u.email}</span>
                                  <button
                                    onClick={() => { setEditingUserId(u.id); setEditEmailValue(u.email || ''); }}
                                    className="btn-icon"
                                    style={{ padding: '2px', flexShrink: 0 }}
                                    title="Editar correo"
                                    aria-label={`Editar correo de ${u.email}`}
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                </div>
                              )}
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '4px' }}>Fecha de registro</span>
                              <span style={{ color: 'var(--text-secondary)' }}>{new Date(u.created_at).toLocaleDateString('es-ES')}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </>
                  </ViewTransition>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', borderLeft: '4px solid var(--priority-alta)', overflow: 'hidden', marginTop: 'var(--space-xl)' }}>
        <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border)', background: 'var(--priority-alta-bg)' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} style={{ color: 'var(--priority-alta)' }} /> Enviar aviso push a todos los dispositivos
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            Acción irreversible: llega de inmediato a todos los usuarios con la app instalada.
          </p>
        </div>
        <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <label htmlFor="broadcast-title" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Título</label>
          <input
            id="broadcast-title"
            type="text"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          />
          <label htmlFor="broadcast-body" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mensaje</label>
          <textarea
            id="broadcast-body"
            value={broadcastBody}
            onChange={(e) => setBroadcastBody(e.target.value)}
            rows={3}
            style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical' }}
          />
          <button
            onClick={() => setConfirmBroadcast(true)}
            className="btn"
            disabled={isBroadcasting}
            style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--priority-alta)', color: '#fff' }}
          >
            {isBroadcasting ? <Loader2 size={16} className="spin" /> : <Megaphone size={16} />}
            Enviar a todos
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', marginTop: 'var(--space-xl)' }}>
        <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border)', background: 'var(--bg-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ScrollText size={18} /> Auditoría de acciones admin
          </h2>
          <button onClick={loadAuditLog} className="btn btn-secondary" disabled={isAuditLoading} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            {isAuditLoading ? <Loader2 size={14} className="spin" /> : 'Actualizar'}
          </button>
        </div>

        <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border)' }}>
          <div className="filter-search" style={{ maxWidth: '320px' }}>
            <span className="filter-search-icon" aria-hidden="true"><Search size={15} /></span>
            <input
              className="input filter-search-input"
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Buscar por admin o usuario afectado..."
              aria-label="Buscar en la auditoría"
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px var(--space-lg)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Admin</th>
                <th style={{ padding: '12px var(--space-lg)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Acción</th>
                <th style={{ padding: '12px var(--space-lg)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {isAuditLoading && auditLog.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <Loader2 size={24} className="spin" style={{ margin: '0 auto 10px' }} />
                    Cargando auditoría...
                  </td>
                </tr>
              ) : filteredAuditLog.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    {auditSearch.trim() ? `No se encontraron resultados para "${auditSearch}".` : 'Sin acciones registradas todavía.'}
                  </td>
                </tr>
              ) : (
                filteredAuditLog.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px var(--space-lg)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{entry.admin_email}</td>
                    <td style={{ padding: '12px var(--space-lg)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {AUDIT_ACTION_LABEL[entry.action]} <strong style={{ color: 'var(--text-primary)' }}>{entry.target_email || entry.target_user_id}</strong>
                    </td>
                    <td style={{ padding: '12px var(--space-lg)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {new Date(entry.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmBroadcast}
        title="Enviar notificación push a todos"
        message={`Esto le va a llegar a TODOS los dispositivos con la app instalada. ¿Confirmas el envío de "${broadcastTitle}"?`}
        confirmLabel={isBroadcasting ? 'Enviando...' : 'Enviar'}
        confirmDisabled={isBroadcasting}
        onConfirm={handleBroadcastPush}
        onCancel={() => setConfirmBroadcast(false)}
      />

      <ConfirmDialog
        isOpen={!!userToToggleRole}
        title={userToToggleRole && adminIds.has(userToToggleRole.id) ? 'Quitar rol de administrador' : 'Dar rol de administrador'}
        message={
          userToToggleRole && adminIds.has(userToToggleRole.id)
            ? `"${userToToggleRole.email}" va a dejar de tener acceso al Panel de Administración.`
            : `"${userToToggleRole?.email}" va a tener acceso completo al Panel de Administración: gestionar usuarios, enviar avisos a todos los dispositivos, y dar o quitar el rol de admin a otros.`
        }
        confirmLabel={isTogglingRole ? 'Guardando...' : (userToToggleRole && adminIds.has(userToToggleRole.id) ? 'Quitar rol' : 'Dar rol')}
        confirmDisabled={isTogglingRole}
        onConfirm={handleConfirmToggleRole}
        onCancel={() => setUserToToggleRole(null)}
      />

      <ConfirmDialog
        isOpen={!!userToDelete}
        title="Eliminar Usuario Definitivamente"
        message={`¿Estás absolutamente seguro de eliminar la cuenta de "${userToDelete?.email}"? Esta acción borrará permanentemente sus datos y no se puede deshacer.`}
        confirmLabel={isDeleting ? 'Eliminando...' : 'Eliminar'}
        confirmDisabled={isDeleting || !adminPassword}
        onConfirm={handleDeleteUser}
        onCancel={() => {
          setUserToDelete(null);
          setAdminPassword('');
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="admin-password" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Por seguridad, ingresa tu contraseña de administrador:</label>
          <input
            id="admin-password"
            type="password"
            placeholder="Tu contraseña"
            autoComplete="current-password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              width: '100%'
            }}
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={!!userToResetPassword}
        title="Cambiar contraseña"
        message={`Vas a establecer una contraseña nueva para "${userToResetPassword?.email}". El usuario podrá iniciar sesión con ella de inmediato.`}
        confirmLabel={isResettingPassword ? 'Guardando...' : 'Cambiar contraseña'}
        confirmDisabled={isResettingPassword || newPasswordValue.length < 6}
        onConfirm={handleConfirmResetPassword}
        onCancel={() => {
          setUserToResetPassword(null);
          setNewPasswordValue('');
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="new-user-password" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Contraseña nueva (mínimo 6 caracteres):</label>
          <input
            id="new-user-password"
            type="password"
            placeholder="Contraseña nueva"
            autoComplete="new-password"
            value={newPasswordValue}
            onChange={(e) => setNewPasswordValue(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              width: '100%'
            }}
          />
        </div>
      </ConfirmDialog>

      {isCreateUserOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateUserOpen(false)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Crear usuario</h2>
              <button className="btn btn-ghost modal-close" onClick={() => setIsCreateUserOpen(false)} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="modal-body">
              <div className="form-group">
                <label htmlFor="create-user-email">Correo electrónico</label>
                <input
                  id="create-user-email"
                  className="input"
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginTop: 'var(--space-sm)' }}>
                <label htmlFor="create-user-name">Nombre (opcional)</label>
                <input
                  id="create-user-name"
                  className="input"
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginTop: 'var(--space-sm)' }}>
                <label htmlFor="create-user-password">Contraseña (mínimo 6 caracteres)</label>
                <input
                  id="create-user-password"
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateUserOpen(false)} disabled={isCreatingUser}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isCreatingUser}>
                  {isCreatingUser ? <Loader2 size={16} className="spin" /> : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
