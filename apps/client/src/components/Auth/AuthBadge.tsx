import React, { useState, useRef, useEffect } from 'react';
import { signOut, useSession } from '../../auth/client';
import { LogOut, User, ChevronDown } from 'lucide-react';

interface AuthBadgeProps {
  onLogout?: () => void;
}

export const AuthBadge: React.FC<AuthBadgeProps> = ({ onLogout }) => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const localName = localStorage.getItem('lead_user_name');
  const localEmail = localStorage.getItem('lead_user_email');

  const displayName = session?.user?.name || localName || 'Usuario';
  const displayEmail = session?.user?.email || localEmail || '';
  const displayImage = session?.user?.image;

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem('lead_user_name');
    localStorage.removeItem('lead_user_email');
    setIsOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  return (
    <div ref={popoverRef} style={{ position: 'relative' }}>
      {/* Clickable User Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: isOpen ? 'var(--bg-hover, #f1f5f9)' : 'var(--color-paper-warmth, #f8fafc)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          borderRadius: 'var(--radius-buttons, 6px)',
          padding: '0 10px',
          height: '32px',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--color-ink-black, #111827)',
          boxSizing: 'border-box',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        title={`Conectado como ${displayName}`}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={displayName}
            style={{ width: '18px', height: '18px', borderRadius: '50%' }}
          />
        ) : (
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#e0f2fe',
              color: '#0369a1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px'
            }}
          >
            <User size={12} />
          </div>
        )}
        <span>{displayName}</span>
        <ChevronDown
          size={13}
          color="#64748b"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease'
          }}
        />
      </button>

      {/* Pop-up dropdown aligned to the right */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            background: 'var(--color-pure-white, #ffffff)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
            zIndex: 1000,
            minWidth: '220px',
            animation: 'modalContentScaleIn 0.12s ease-out forwards'
          }}
        >
          {/* User Profile Info */}
          <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-ink-black, #0f172a)' }}>
              {displayName}
            </div>
            {displayEmail && (
              <div style={{ fontSize: '11.5px', color: 'var(--color-slate, #64748b)', marginTop: '2px', wordBreak: 'break-all' }}>
                {displayEmail}
              </div>
            )}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '6px',
                fontSize: '11px',
                color: '#0284c7',
                background: '#e0f2fe',
                padding: '2px 7px',
                borderRadius: '4px',
                fontWeight: 500
              }}
            >
              <span>Sesión Activa</span>
            </div>
          </div>

          {/* Cerrar Sesión button inside Pop-up */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '6px',
              color: '#dc2626',
              fontSize: '12.5px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={14} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </div>
  );
};
