import { supabase } from './supabase';



/**
 * Función auxiliar para obtener la URL base de la API.
 * En producción (Vercel) las funciones están en el mismo dominio.
 * En desarrollo, si Vite no está proxyando /api, puede requerir configuración.
 */
const getApiUrl = () => {
  // Cuando ejecutamos en el navegador (Vite dev server)
  return '/api';
};

/**
 * Obtiene el token JWT actual de la sesión.
 */
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No hay sesión activa');
  return session.access_token;
};

export const adminService = {
  async getUsers() {
    const token = await getAuthToken();
    const response = await fetch(`${getApiUrl()}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al obtener usuarios');
    }
    
    return response.json();
  },

  async updateUserEmail(userId: string, newEmail: string) {
    const token = await getAuthToken();
    const response = await fetch(`${getApiUrl()}/users`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: userId, email: newEmail })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar el correo');
    }

    return response.json();
  },

  async updateUserName(userId: string, newName: string) {
    const token = await getAuthToken();
    const response = await fetch(`${getApiUrl()}/users`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: userId, name: newName })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar el nombre');
    }

    return response.json();
  },

  async resetUserPassword(userId: string, newPassword: string) {
    const token = await getAuthToken();
    const response = await fetch(`${getApiUrl()}/users`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: userId, password: newPassword })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al cambiar la contraseña');
    }

    return response.json();
  },

  async createUser(email: string, password: string, name: string) {
    const token = await getAuthToken();
    const response = await fetch(`${getApiUrl()}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear el usuario');
    }

    return response.json();
  },

  async deleteUser(userId: string) {
    const token = await getAuthToken();
    const response = await fetch(`${getApiUrl()}/users?id=${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al eliminar el usuario');
    }

    return response.json();
  },

  async getAuditLog() {
    const token = await getAuthToken();
    const response = await fetch(`${getApiUrl()}/admin-audit`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al obtener el registro de auditoría');
    }

    return response.json();
  },

  async broadcastPush(title: string, body: string) {
    const token = await getAuthToken();
    const response = await fetch(`${getApiUrl()}/admin-broadcast-push`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, body })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al enviar la notificación');
    }

    return response.json();
  },

  async getAdminIds() {
    const token = await getAuthToken();
    const response = await fetch(`${getApiUrl()}/admin-roles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al obtener los administradores');
    }

    const data = await response.json();
    return data.adminIds as string[];
  },

  async grantAdmin(userId: string, targetEmail?: string) {
    const token = await getAuthToken();
    const response = await fetch(`${getApiUrl()}/admin-roles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, targetEmail })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al otorgar el rol de administrador');
    }

    return response.json();
  },

  async revokeAdmin(userId: string, targetEmail?: string) {
    const token = await getAuthToken();
    const params = new URLSearchParams({ id: userId });
    if (targetEmail) params.set('targetEmail', targetEmail);
    const response = await fetch(`${getApiUrl()}/admin-roles?${params.toString()}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al quitar el rol de administrador');
    }

    return response.json();
  }
};
