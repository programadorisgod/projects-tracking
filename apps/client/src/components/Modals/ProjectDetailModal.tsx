import { useState, useRef, useEffect } from 'react';
import { STATUS_DEFINITIONS, MAINTENANCE_TYPE_DEFINITIONS } from '../../types/project';
import type { Project } from '../../types/project';
import { safeUrl } from '../../utils/security';
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
  Tag,
  Wrench,
  GitMerge,
  ArrowRight
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (project: Project) => void;
  allProjects?: Project[];
  onRequestMaintenance?: (project: Project) => void;
  onSelectProject?: (project: Project) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  onEdit,
  allProjects = [],
  onRequestMaintenance,
  onSelectProject
}) => {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  if (!isOpen || !project) return null;

  const statusCfg = STATUS_DEFINITIONS[project.status];
  const isMaintenance = project.projectType === 'mantenimiento';
  const childTickets = allProjects.filter(p => p.parentProjectId === project.id);
  const parentProject = isMaintenance && project.parentProjectId 
    ? allProjects.find(p => p.id === project.parentProjectId) 
    : null;
  const maintenanceCfg = project.maintenanceType ? MAINTENANCE_TYPE_DEFINITIONS[project.maintenanceType] : null;

  const handleCopyLocation = () => {
    if (project.location) {
      navigator.clipboard.writeText(project.location);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        setCopied(false);
        copyTimerRef.current = null;
      }, 2000);
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
            {isMaintenance && (
              <span className="badge" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' }}>
                🔧 Soporte
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {!isMaintenance && onRequestMaintenance && (
              <button 
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--color-mocha)', borderColor: '#fed7aa', background: '#fffbeb' }}
                onClick={() => {
                  onClose();
                  onRequestMaintenance(project);
                }}
                title="Abrir ticket de soporte o mantenimiento"
              >
                <Wrench size={13} />
                Abrir Soporte
              </button>
            )}
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
          {/* Maintenance Banner (if child support ticket) */}
          {isMaintenance && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#92400e' }}>
                  <Wrench size={15} />
                  Iniciativa de Soporte / Mantenimiento
                </span>
                {maintenanceCfg && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: '#fef3c7',
                    color: '#b45309',
                    border: '1px solid #fcd34d'
                  }}>
                    {maintenanceCfg.label}
                  </span>
                )}
              </div>

              {project.parentProjectName && (
                <div style={{ fontSize: '13px', color: '#78350f', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span>Referencia a proyecto base:</span>
                  <button
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontWeight: 700,
                      color: 'var(--color-notion-blue)',
                      cursor: parentProject && onSelectProject ? 'pointer' : 'default',
                      textDecoration: parentProject && onSelectProject ? 'underline' : 'none'
                    }}
                    onClick={() => {
                      if (parentProject && onSelectProject) {
                        onSelectProject(parentProject);
                      }
                    }}
                  >
                    <GitMerge size={13} />
                    {project.parentProjectName}
                    {parentProject && onSelectProject && <ArrowRight size={12} />}
                  </button>
                </div>
              )}

              {project.maintenanceScope && (
                <div style={{ fontSize: '12.5px', color: '#451a03', background: 'rgba(255,255,255,0.7)', padding: '8px 10px', borderRadius: '6px', border: '1px solid #fef08a' }}>
                  <strong>Alcance / Qué se está reparando:</strong> {project.maintenanceScope}
                </div>
              )}
            </div>
          )}

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
            {(() => {
              const validatedUrl = safeUrl(project.githubUrl);
              if (validatedUrl) {
                return (
                  <a
                    href={validatedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-btn"
                    style={{ fontSize: '13px', padding: '6px 12px' }}
                  >
                    <GitBranch size={14} />
                    <span>{validatedUrl}</span>
                    <ExternalLink size={12} />
                  </a>
                );
              }
              if (project.githubUrl) {
                return (
                  <span style={{ fontSize: '13px', color: 'var(--color-coral, #ef4444)' }}>
                    URL no segura bloqueada ({project.githubUrl})
                  </span>
                );
              }
              return (
                <span style={{ fontSize: '13px', color: 'var(--color-stone)' }}>No se ha configurado URL de GitHub.</span>
              );
            })()}
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

          {/* Child Maintenance Tickets History */}
          {!isMaintenance && childTickets.length > 0 && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <Wrench size={13} color="var(--color-mocha)" />
                  Historial de Mantenimientos & Soporte ({childTickets.length})
                </span>
                {onRequestMaintenance && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                    onClick={() => {
                      onClose();
                      onRequestMaintenance(project);
                    }}
                  >
                    + Nuevo Ticket
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {childTickets.map(child => {
                  const childStatusCfg = STATUS_DEFINITIONS[child.status];
                  const childTypeCfg = child.maintenanceType ? MAINTENANCE_TYPE_DEFINITIONS[child.maintenanceType] : null;
                  return (
                    <div
                      key={child.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        padding: '10px 12px',
                        background: 'var(--color-meta-card-bg)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-buttons)',
                        cursor: onSelectProject ? 'pointer' : 'default',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => {
                        if (onSelectProject) {
                          onSelectProject(child);
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-ink-black)' }}>
                            {child.name}
                          </span>
                          {childTypeCfg && (
                            <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '4px', background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>
                              {childTypeCfg.label}
                            </span>
                          )}
                        </div>
                        <span className={`status-badge status-badge-${child.status}`} style={{ fontSize: '10.5px', padding: '2px 6px' }}>
                          {childStatusCfg?.label || child.status}
                        </span>
                      </div>

                      {child.maintenanceScope && (
                        <div style={{ fontSize: '12px', color: 'var(--color-graphite)' }}>
                          {child.maintenanceScope}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-stone)', marginTop: '2px' }}>
                        <span>Asignado: <strong>{child.assignee || 'Sin asignar'}</strong></span>
                        <span>{child.startDate}</span>
                      </div>
                    </div>
                  );
                })}
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
