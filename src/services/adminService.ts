import { supabase } from './supabase';

const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3000'; // O ajustarlo si el entorno dev no soporta funciones vercel

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
  }
};
