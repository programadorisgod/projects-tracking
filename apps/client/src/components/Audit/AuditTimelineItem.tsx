import React, { useState } from 'react';
import type { AuditLogEntry, ProjectStatus } from '@app/shared';
import { STATUS_DEFINITIONS } from '@app/shared';
import {
  ArrowRight,
  ArrowRightLeft,
  PlusCircle,
  Wrench,
  Trash2,
  Edit3,
  User,
  ChevronDown,
  ChevronUp,
  Clock,
  RotateCcw,
  UploadCloud
} from 'lucide-react';

interface AuditTimelineItemProps {
  entry: AuditLogEntry;
}

// Convert any ISO date strings inside JSON metadata to the user's local timezone
function localizeDatesInObject(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(localizeDatesInObject);

  const formatted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      try {
        const d = new Date(value);
        formatted[key] = new Intl.DateTimeFormat('es-CO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).format(d);
      } catch {
        formatted[key] = value;
      }
    } else if (typeof value === 'object') {
      formatted[key] = localizeDatesInObject(value);
    } else {
      formatted[key] = value;
    }
  }
  return formatted;
}

export const AuditTimelineItem: React.FC<AuditTimelineItemProps> = ({ entry }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'STATUS_CHANGED':
        return {
          icon: <ArrowRightLeft size={16} />,
          bg: 'rgba(245, 158, 11, 0.15)',
          color: 'var(--color-saffron, #f59e0b)',
          borderColor: 'rgba(245, 158, 11, 0.35)',
          label: 'Cambio de Estado'
        };
      case 'PROJECT_CREATED':
        return {
          icon: <PlusCircle size={16} />,
          bg: 'rgba(16, 185, 129, 0.15)',
          color: 'var(--color-success, #10b981)',
          borderColor: 'rgba(16, 185, 129, 0.35)',
          label: 'Creación'
        };
      case 'MAINTENANCE_RECORDED':
        return {
          icon: <Wrench size={16} />,
          bg: 'rgba(168, 85, 247, 0.15)',
          color: '#a855f7',
          borderColor: 'rgba(168, 85, 247, 0.35)',
          label: 'Mantenimiento'
        };
      case 'PROJECT_DELETED':
        return {
          icon: <Trash2 size={16} />,
          bg: 'rgba(239, 68, 68, 0.15)',
          color: 'var(--color-coral, #ef4444)',
          borderColor: 'rgba(239, 68, 68, 0.35)',
          label: 'Eliminación'
        };
      case 'DATABASE_RESET':
        return {
          icon: <RotateCcw size={16} />,
          bg: 'rgba(249, 115, 22, 0.15)',
          color: '#f97316',
          borderColor: 'rgba(249, 115, 22, 0.35)',
          label: 'Restauración BD'
        };
      case 'DATABASE_IMPORTED':
        return {
          icon: <UploadCloud size={16} />,
          bg: 'rgba(217, 70, 239, 0.15)',
          color: '#d946ef',
          borderColor: 'rgba(217, 70, 239, 0.35)',
          label: 'Importación BD'
        };
      case 'PROJECT_UPDATED':
      default:
        return {
          icon: <Edit3 size={16} />,
          bg: 'rgba(14, 165, 233, 0.15)',
          color: 'var(--color-notion-blue, #0284c7)',
          borderColor: 'rgba(14, 165, 233, 0.35)',
          label: 'Actualización'
        };
    }
  };

  const config = getActionConfig(entry.action);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Hace unos segundos';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `Hace ${diffMin} min`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `Hace ${diffHours} h`;
      const diffDays = Math.floor(diffHours / 24);
      return `Hace ${diffDays} d`;
    } catch {
      return '';
    }
  };

  const prevStatus = entry.previousState?.status as ProjectStatus | undefined;
  const nextStatus = entry.newState?.status as ProjectStatus | undefined;

  const prevConfig = prevStatus ? STATUS_DEFINITIONS[prevStatus] : null;
  const nextConfig = nextStatus ? STATUS_DEFINITIONS[nextStatus] : null;

  return (
    <div
      style={{
        position: 'relative',
        paddingLeft: '2.5rem',
        paddingBottom: '1.75rem'
      }}
    >
      {/* Node Marker on vertical line */}
      <div
        className="audit-node-marker"
        style={{
          background: config.bg,
          color: config.color,
          border: `2px solid ${config.borderColor}`
        }}
      >
        {config.icon}
      </div>

      {/* Audit Card */}
      <div className="audit-card">
        {/* Top bar: Author + Action pill + Timestamp */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                background: config.bg,
                color: config.color,
                border: `1px solid ${config.borderColor}`
              }}
            >
              {config.label}
            </span>

            {entry.projectName && (
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'var(--color-ink-black)'
                }}
              >
                {entry.projectName}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.8rem',
              color: 'var(--color-stone)'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={13} />
              <span title={formatDate(entry.timestamp)}>{getRelativeTime(entry.timestamp)}</span>
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'var(--color-bg-subtle)',
                color: 'var(--color-charcoal)',
                border: '1px solid var(--border-subtle)',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                fontWeight: 500
              }}
            >
              <User size={12} />
              {entry.userName}
            </span>
          </div>
        </div>

        {/* Event Summary Description */}
        <p
          style={{
            margin: '0.25rem 0 0.75rem 0',
            fontSize: '0.875rem',
            color: 'var(--color-charcoal)',
            lineHeight: 1.4
          }}
        >
          {entry.summary}
        </p>

        {/* Status Transition Visualizer if applicable */}
        {entry.action === 'STATUS_CHANGED' && prevConfig && nextConfig && (
          <div className="audit-transition-box">
            <span
              style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                background: prevConfig.badgeBg,
                color: prevConfig.color,
                border: `1px solid ${prevConfig.badgeBorder}`,
                fontWeight: 600
              }}
            >
              {prevConfig.label}
            </span>

            <ArrowRight size={14} color="var(--color-stone)" />

            <span
              style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                background: nextConfig.badgeBg,
                color: nextConfig.color,
                border: `1px solid ${nextConfig.badgeBorder}`,
                fontWeight: 600
              }}
            >
              {nextConfig.label}
            </span>
          </div>
        )}

        {/* Footer: Expand details button */}
        {(entry.previousState || entry.newState || entry.metadata) && (
          <div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.2rem 0',
                fontSize: '0.75rem',
                color: 'var(--color-notion-blue)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontWeight: 500
              }}
            >
              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {isExpanded ? 'Ocultar detalles de auditoría' : 'Ver detalles técnicos y diff'}
            </button>

            {isExpanded && (
              <div className="audit-diff-box">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {entry.previousState && (
                    <div>
                      <strong style={{ color: 'var(--color-coral, #ef4444)' }}>Estado Previo:</strong>
                      <pre style={{ margin: '0.25rem 0', whiteSpace: 'pre-wrap', color: 'var(--color-ink-black)' }}>
                        {JSON.stringify(localizeDatesInObject(entry.previousState), null, 2)}
                      </pre>
                    </div>
                  )}

                  {entry.newState && (
                    <div>
                      <strong style={{ color: 'var(--color-success, #10b981)' }}>Nuevo Estado:</strong>
                      <pre style={{ margin: '0.25rem 0', whiteSpace: 'pre-wrap', color: 'var(--color-ink-black)' }}>
                        {JSON.stringify(localizeDatesInObject(entry.newState), null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-medium)' }}>
                    <strong style={{ color: 'var(--color-notion-blue)' }}>Metadatos:</strong>
                    <pre style={{ margin: '0.25rem 0', whiteSpace: 'pre-wrap', color: 'var(--color-ink-black)' }}>
                      {JSON.stringify(localizeDatesInObject(entry.metadata), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
