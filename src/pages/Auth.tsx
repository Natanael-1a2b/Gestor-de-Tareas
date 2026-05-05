import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Mail, Lock, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import './AuthSplit.css'; // Crearemos un archivo CSS específico

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      toast.error('Por favor, completa todos los campos requeridos.');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('¡Bienvenido de nuevo!');
        navigate('/', { replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        });
        if (error) throw error;

        if (data.session) {
          toast.success('¡Cuenta creada con éxito!');
          navigate('/', { replace: true });
        } else {
          toast.success('Cuenta creada. Ya puedes iniciar sesión.');
          setIsLogin(true);
        }
      }
    } catch (error: unknown) {
      console.error('Auth error:', error);
      let message = error instanceof Error ? error.message : 'Ocurrió un error al autenticar.';

      // Traducción de errores comunes de Supabase
      const msgLower = message.toLowerCase();
      if (msgLower.includes('invalid login credentials')) {
        message = 'Credenciales inválidas. Verifica tu correo y contraseña.';
      } else if (msgLower.includes('user already registered')) {
        message = 'Este correo ya está registrado.';
      } else if (msgLower.includes('password should be at least')) {
        message = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (msgLower.includes('email not confirmed')) {
        message = 'Por favor confirma tu correo electrónico antes de iniciar sesión.';
      } else if (msgLower.includes('invalid format') || msgLower.includes('valid email')) {
        message = 'Por favor ingresa un correo electrónico válido.';
      } else if (msgLower.includes('rate limit') || msgLower.includes('too many requests')) {
        message = 'Demasiados intentos. Por favor, espera unos minutos e intenta de nuevo.';
      } else if (msgLower.includes('network') || msgLower.includes('fetch')) {
        message = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
      }

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Por favor, ingresa tu correo electrónico.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success('Te hemos enviado un enlace al correo para recuperar tu contraseña.');
      setIsForgotPassword(false);
    } catch (error: unknown) {
      console.error('Password reset error:', error);
      let message = error instanceof Error ? error.message : 'Ocurrió un error.';

      const msgLower = message.toLowerCase();
      if (msgLower.includes('rate limit')) {
        message = 'Demasiados intentos. Por favor, espera unos minutos.';
      } else if (msgLower.includes('not found')) {
        message = 'Usuario no encontrado.';
      }

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="split-auth-wrapper">
      <div className={`split-auth-container ${!isLogin ? 'right-panel-active' : ''}`}>

        {/* Sign Up Form */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleAuth} className="split-form">
            <h2>Crear Cuenta</h2>
            <div className="social-container">
              {/* Opcional: Iconos sociales si los quisieras agregar luego */}
            </div>
            <span>o usa tu correo electrónico para registrarte</span>

            <div className="split-input-group">
              <User size={18} className="split-icon" />
              <input type="text" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} />
            </div>
            <div className="split-input-group">
              <Mail size={18} className="split-icon" />
              <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="split-input-group">
              <Lock size={18} className="split-icon" />
              <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <button type="submit" className="split-btn primary-btn" disabled={isLoading}>
              {isLoading ? <Loader2 size={16} className="spin" /> : 'REGISTRARSE'}
            </button>
          </form>
        </div>

        {/* Sign In / Forgot Password Form */}
        <div className="form-container sign-in-container">
          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="split-form">
              <h2>Recuperar Contraseña</h2>
              <div className="social-container"></div>

              <>
                <span style={{ marginBottom: '15px' }}>Ingresa tu correo para recibir un enlace de recuperación</span>
                <div className="split-input-group">
                  <Mail size={18} className="split-icon" />
                  <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <button type="submit" className="split-btn primary-btn" disabled={isLoading} style={{ marginTop: '10px' }}>
                  {isLoading ? <Loader2 size={16} className="spin" /> : 'ENVIAR ENLACE'}
                </button>
                <button type="button" className="split-btn ghost-btn" onClick={() => setIsForgotPassword(false)} style={{ marginTop: '15px', color: 'var(--text-secondary)', background: 'transparent', border: 'none', fontSize: '0.9rem', textDecoration: 'underline' }}>
                  Volver a iniciar sesión
                </button>
              </>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="split-form">
              <h2>Iniciar Sesión</h2>
              <div className="social-container"></div>
              <span>Inicia sesión con tu cuenta</span>

              <div className="split-input-group">
                <Mail size={18} className="split-icon" />
                <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="split-input-group">
                <Lock size={18} className="split-icon" />
                <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <button type="button" onClick={() => setIsForgotPassword(true)} className="forgot-password" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>¿Olvidaste tu contraseña?</button>

              <button type="submit" className="split-btn primary-btn" disabled={isLoading}>
                {isLoading ? <Loader2 size={16} className="spin" /> : 'INICIAR SESIÓN'}
              </button>
            </form>
          )}
        </div>

        {/* Overlay Panel */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h2>¡Bienvenido de nuevo!</h2>
              <p>Para mantenerte conectado con nosotros, por favor inicia sesión con tus datos personales</p>
              <button type="button" className="split-btn ghost-btn" onClick={() => setIsLogin(true)}>
                INICIAR SESIÓN
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h2>¿Aún no tienes una cuenta?</h2>
              <p>Ingresa tus datos personales y comienza tu viaje con nosotros</p>
              <button type="button" className="split-btn ghost-btn" onClick={() => setIsLogin(false)}>
                REGISTRARSE
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
