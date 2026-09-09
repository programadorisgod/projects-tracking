import { useState } from 'react';
import { STATUS_DEFINITIONS } from '../../types/project';
import type { Project } from '../../types/project';
import { 
  X, 
  GitBranch, 
  Server, 
  Calendar, 
  User, 
  Building2, 
  ExternalLink, 
  Copy, 
  Check, 
  PauseCircle, 
  Edit3,
  Tag
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (project: Project) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  onEdit
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !project) return null;

  const statusCfg = STATUS_DEFINITIONS[project.status];

  const handleCopyLocation = () => {
    if (project.location) {
      navigator.clipboard.writeText(project.location);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`status-badge status-badge-${project.status}`}>
              {statusCfg?.label || project.status}
            </span>
            <span className={`badge ${project.category === 'asistencial' ? 'badge-asistencial' : 'badge-admin'}`}>
              {project.category === 'asistencial' ? 'Asistencial' : 'Administrativo'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                onClose();
                onEdit(project);
              }}
            >
              <Edit3 size={13} />
              Editar
            </button>
            <button className="btn-icon btn-ghost" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* Title */}
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-ink-black)', marginBottom: '8px' }}>
            {project.name}
          </h2>

          {/* Area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <span className="card-area-badge" style={{ fontSize: '12.5px', padding: '4px 10px' }}>
              <Building2 size={13} />
              Área: <strong>{project.area || 'General'}</strong>
            </span>
          </div>

          {/* Description */}
          {project.description && (
            <div style={{ marginBottom: '20px' }}>
              <h4 className="form-label" style={{ marginBottom: '6px' }}>Descripción del Proyecto</h4>
              <div className="modal-desc-box">
                {project.description}
              </div>
            </div>
          )}

          {/* Pause Reason (if applicable) */}
          {project.status === 'pausado' && project.pauseReason && (
            <div className="card-pause-box" style={{ marginBottom: '20px', padding: '12px 16px' }}>
              <span className="card-pause-title" style={{ fontSize: '13px' }}>
                <PauseCircle size={15} />
                Motivo de suspensión / pausa:
              </span>
              <p style={{ marginTop: '4px', fontSize: '13px' }}>{project.pauseReason}</p>
            </div>
          )}

          {/* Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {/* Assignee */}
            <div style={{ background: 'var(--color-meta-card-bg)', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-buttons)' }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={12} />
                Asignado a
              </span>
              <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '4px', color: 'var(--color-ink-black)' }}>
                {project.assignee || 'Sin Asignar'}
              </div>
            </div>

            {/* Dates */}
            <div style={{ background: 'var(--color-meta-card-bg)', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-buttons)' }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} />
                Cronograma
              </span>
              <div style={{ fontSize: '13px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--color-charcoal)' }}>
                {project.startDate && <span>Inicio: <strong>{project.startDate}</strong></span>}
                {project.estimatedDeliveryDate && <span>Tentativa: <strong>{project.estimatedDeliveryDate}</strong></span>}
                {project.actualDeliveryDate && <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Entrega Real: <strong>{project.actualDeliveryDate}</strong></span>}
              </div>
            </div>
          </div>

          {/* Location on Server */}
          <div style={{ marginBottom: '16px' }}>
            <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <Server size={12} />
              Ubicación en Servidor / Entorno
            </span>
            {project.location ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code className="modal-code-snippet">
                  {project.location}
                </code>
                <button className="btn btn-secondary btn-sm" onClick={handleCopyLocation} title="Copiar ruta">
                  {copied ? <Check size={13} color="var(--color-success)" /> : <Copy size={13} />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--color-stone)' }}>No se ha registrado ubicación física o de servidor.</span>
            )}
          </div>

          {/* GitHub Repo */}
          <div style={{ marginBottom: '16px' }}>
            <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <GitBranch size={12} />
              Repositorio de GitHub
            </span>
            {project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="link-btn"
                style={{ fontSize: '13px', padding: '6px 12px' }}
              >
                <GitBranch size={14} />
                <span>{project.githubUrl}</span>
                <ExternalLink size={12} />
              </a>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--color-stone)' }}>No se ha configurado URL de GitHub.</span>
            )}
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <Tag size={12} />
                Tecnologías & Etiquetas
              </span>
              <div className="card-tags">
                {project.tags.map((t, idx) => (
                  <span key={idx} className="tag-chip" style={{ fontSize: '12px', padding: '3px 8px' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
