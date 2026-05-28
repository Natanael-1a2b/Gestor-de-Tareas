import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { toast } from 'sonner';
import { Shield, Mail, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export function AdminDashboard() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editEmailValue, setEditEmailValue] = useState('');
  
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Verificación extra de seguridad en el frontend
  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL;

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getUsers();
      // Ordenar por fecha de creación (más nuevos primero)
      setUsers(data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar usuarios');
    } finally {
      setIsLoading(false);
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
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar');
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
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

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
          <button onClick={loadUsers} className="btn btn-secondary" disabled={isLoading} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            {isLoading ? <Loader2 size={14} className="spin" /> : 'Actualizar'}
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px var(--space-lg)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Correo Electrónico</th>
                <th style={{ padding: '12px var(--space-lg)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Registro</th>
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td data-label="Correo" style={{ padding: '12px var(--space-lg)' }}>
                      {editingUserId === u.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
                          <input 
                            type="email" 
                            value={editEmailValue} 
                            onChange={e => setEditEmailValue(e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--accent)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem', width: '100%', minWidth: '120px' }}
                            autoFocus
                          />
                          <button onClick={() => handleSaveEmail(u.id)} className="btn-icon" style={{ color: 'var(--success)', flexShrink: 0 }} title="Guardar">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingUserId(null)} className="btn-icon" style={{ color: 'var(--text-secondary)', flexShrink: 0 }} title="Cancelar">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', wordBreak: 'break-all' }}>
                          <Mail size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.email}</span>
                          {u.email === import.meta.env.VITE_ADMIN_EMAIL && (
                            <span style={{ fontSize: '0.7rem', background: 'var(--accent)', color: 'white', padding: '2px 6px', borderRadius: '10px', fontWeight: 600, flexShrink: 0 }}>TÚ</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td data-label="Registro" style={{ padding: '12px var(--space-lg)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td data-label="Último Acceso" style={{ padding: '12px var(--space-lg)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : 'Nunca'}
                    </td>
                    <td data-label="Acciones" style={{ padding: '12px var(--space-lg)', textAlign: 'right' }}>
                      {u.email !== import.meta.env.VITE_ADMIN_EMAIL && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button 
                            onClick={() => {
                              setEditingUserId(u.id);
                              setEditEmailValue(u.email);
                            }} 
                            className="btn-icon" 
                            title="Editar correo"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => setUserToDelete(u)} 
                            className="btn-icon" 
                            style={{ color: 'var(--priority-alta)' }}
                            title="Eliminar usuario"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Por seguridad, ingresa tu contraseña de administrador:</label>
          <input
            type="password"
            placeholder="Tu contraseña"
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
    </div>
  );
}
