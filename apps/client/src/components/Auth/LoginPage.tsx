import React, { useState } from 'react';
import { signIn } from '../../auth/client';
import { Database, ArrowRight, UserCheck, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: { name: string; email: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devName, setDevName] = useState('Jerson Tapias');
  const [devEmail, setDevEmail] = useState('jerson.tapias@company.com');

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: window.location.origin
      });
    } catch (e: any) {
      console.error('Google login error:', e);
      setErrorMessage(
        'Google OAuth requiere configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en apps/server/.env. Puedes usar el Acceso Directo abajo para ingresar de inmediato.'
      );
      setIsSubmitting(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await signIn.social({
        provider: 'github',
        callbackURL: window.location.origin
      });
    } catch (e: any) {
      console.error('GitHub login error:', e);
      setErrorMessage(
        'GitHub OAuth requiere configurar GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET en apps/server/.env. Puedes usar el Acceso Directo abajo para ingresar de inmediato.'
      );
      setIsSubmitting(false);
    }
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch('http://localhost:3001/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: devName, email: devEmail })
      });
      if (!res.ok) throw new Error('Error al iniciar sesión local');
      const data = await res.json();
      localStorage.setItem('lead_user_name', data.user.name);
      localStorage.setItem('lead_user_email', data.user.email);
      onLoginSuccess(data.user);
    } catch (err: any) {
      // Offline fallback: store in localStorage
      localStorage.setItem('lead_user_name', devName);
      localStorage.setItem('lead_user_email', devEmail);
      onLoginSuccess({ name: devName, email: devEmail });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      {/* Decorative subtle background accents */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '20%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '20%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      <div className="login-card">
        {/* Header Branding */}
        <div className="login-header">
          <div className="login-brand-icon">
            <Database size={26} />
          </div>

          <h1 className="login-title">
            Big Data Tracking
          </h1>
          <p className="login-subtitle font-serif">
            Seguimiento de Ciclo de Vida de Proyectos, Pipelines y Bitácora de Auditoría.
          </p>
        </div>

        {/* Form Body */}
        <div className="login-body">
          {errorMessage && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--color-coral, #ef4444)',
                fontSize: '0.82rem',
                lineHeight: 1.4
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Social OAuth Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="login-btn-google"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>

            <button
              onClick={handleGithubLogin}
              disabled={isSubmitting}
              className="login-btn-github"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>Continuar con GitHub</span>
            </button>
          </div>

          {/* Divider */}
          <div className="login-divider">
            <span className="login-divider-text">o acceso directo</span>
          </div>

          {/* Quick Lead / Dev Access */}
          <form onSubmit={handleDevLogin}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label className="login-label">
                  Nombre de Operador / Lead
                </label>
                <input
                  type="text"
                  className="login-input"
                  value={devName}
                  onChange={e => setDevName(e.target.value)}
                  required
                  placeholder="Tu nombre completo"
                />
              </div>

              <div>
                <label className="login-label">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  className="login-input"
                  value={devEmail}
                  onChange={e => setDevEmail(e.target.value)}
                  required
                  placeholder="usuario@dominio.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <UserCheck size={16} />
                  <span>Ingresar al Sistema</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
