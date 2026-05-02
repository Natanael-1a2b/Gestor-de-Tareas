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
      const message = error instanceof Error ? error.message : 'Ocurrió un error al autenticar.';
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

        {/* Sign In Form */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleAuth} className="split-form">
            <h2>Iniciar Sesión en Gestor</h2>
            <div className="social-container"></div>
            <span>o usa tu cuenta de correo</span>
            
            <div className="split-input-group">
              <Mail size={18} className="split-icon" />
              <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="split-input-group">
              <Lock size={18} className="split-icon" />
              <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            
            <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
            
            <button type="submit" className="split-btn primary-btn" disabled={isLoading}>
              {isLoading ? <Loader2 size={16} className="spin" /> : 'INICIAR SESIÓN'}
            </button>
          </form>
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
              <h2>¡Hola, Amigo!</h2>
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
