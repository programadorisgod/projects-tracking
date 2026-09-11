import { useState, useRef, useEffect } from 'react';
import { STATUS_DEFINITIONS } from '../../types/project';
import type { Project, ProjectStatus } from '../../types/project';
import { 
  MoreVertical, 
  Edit3, 
  Trash2,
  Building2,
  Wrench,
  Archive,
  ArchiveRestore
} from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: ProjectStatus) => void;
  onSelect: (project: Project) => void;
  onRequestMaintenance?: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  onStatusChange,
  onSelect,
  onRequestMaintenance
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const initials = project.assignee
    ? project.assignee
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : '??';

  const isMaintenance = project.projectType === 'mantenimiento';
  const isArchived = ['entregado', 'terminado', 'terminado_parcialmente'].includes(project.status);

  return (
    <div 
      className={`kanban-card kanban-card-minimal ${isMaintenance ? 'kanban-card-maintenance' : ''} ${showMenu ? 'menu-open' : ''}`}
      style={{ zIndex: showMenu ? 50 : undefined }}
      data-id={project.id}
      onClick={() => onSelect(project)}
    >
      {/* Maintenance Parent Indicator (if it is a maintenance ticket) */}
      {isMaintenance && (
        <div className="card-maintenance-pill" title={`Reparando sobre: ${project.parentProjectName || 'Iniciativa Base'}`}>
          <Wrench size={11} color="var(--color-coral)" />
          <span className="card-maintenance-pill-text">
            Soporte de: <strong>{project.parentProjectName || 'Iniciativa Base'}</strong>
          </span>
        </div>
      )}

      {/* Top row: Area & Categoría & Quick Actions */}
      <div className="card-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span className="card-area-badge">
            <Building2 size={11} />
            {project.area || 'Sin Área'}
          </span>
          <span className={`badge ${project.category === 'asistencial' ? 'badge-asistencial' : 'badge-admin'}`}>
            {project.category === 'asistencial' ? 'Asistencial' : 'Administrativo'}
          </span>
        </div>

        <div 
          className="card-actions" 
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onDragStart={e => e.stopPropagation()}
        >
          <button 
            className="btn-icon btn-ghost" 
            title="Editar proyecto"
            onClick={() => onEdit(project)}
          >
            <Edit3 size={13} />
          </button>
          
          <div style={{ position: 'relative' }}>
            <button 
              className="btn-icon btn-ghost"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={13} />
            </button>

            {showMenu && (
              <div 
                ref={menuRef}
                className="dropdown-menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  background: 'var(--color-pure-white)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-buttons)',
                  boxShadow: 'var(--shadow-product-ui)',
                  zIndex: 100,
                  width: '210px',
                  padding: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                {/* Option to open maintenance ticket if not already a maintenance */}
                {onRequestMaintenance && (
                  <>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ justifyContent: 'flex-start', color: 'var(--color-coral)', fontWeight: 500 }}
                      onClick={() => {
                        setShowMenu(false);
                        onRequestMaintenance(project);
                      }}
                    >
                      <Wrench size={12} />
                      <span>Abrir Soporte / Mantenimiento</span>
                    </button>
                    <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--border-subtle)' }} />
                  </>
                )}

                {/* Archivar / Desarchivar */}
                {isArchived ? (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ justifyContent: 'flex-start', color: 'var(--color-notion-blue)', fontWeight: 500 }}
                    onClick={() => {
                      onStatusChange(project.id, 'desarrollo');
                      setShowMenu(false);
                    }}
                    title="Desarchivar proyecto y reactivar en Desarrollo"
                  >
                    <ArchiveRestore size={12} />
                    <span>Desarchivar proyecto</span>
                  </button>
                ) : (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ justifyContent: 'flex-start', color: 'var(--color-graphite)', fontWeight: 500 }}
                    onClick={() => {
                      onStatusChange(project.id, 'entregado');
                      setShowMenu(false);
                    }}
                    title="Archivar y mover a Históricos y entregados"
                  >
                    <Archive size={12} />
                    <span>Archivar (Entregado)</span>
                  </button>
                )}

                <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

                <div style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--color-stone)' }}>
                  Mover a estado:
                </div>
                {Object.values(STATUS_DEFINITIONS).map(s => (
                  <button
                    key={s.id}
                    className="btn btn-ghost btn-sm"
                    style={{
                      justifyContent: 'flex-start',
                      fontSize: '11.5px',
                      padding: '4px 8px',
                      color: s.id === project.status ? s.color : 'inherit',
                      fontWeight: s.id === project.status ? 600 : 400
                    }}
                    onClick={() => {
                      onStatusChange(project.id, s.id);
                      setShowMenu(false);
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                    {s.label}
                  </button>
                ))}
                <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--border-subtle)' }} />
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', color: 'var(--color-vermillion)' }}
                  onClick={() => {
                    if (confirm(`¿Eliminar proyecto "${project.name}"?`)) {
                      onDelete(project.id);
                    }
                    setShowMenu(false);
                  }}
                >
                  <Trash2 size={12} />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Título del Proyecto */}
      <h3 className="card-title">{project.name}</h3>

      {/* Scope snippet if maintenance */}
      {project.maintenanceScope && (
        <div className="card-maintenance-scope">
          <span>🔧 {project.maintenanceScope}</span>
        </div>
      )}

      {/* Footer: Asignado A */}
      <div className="card-meta" style={{ borderTop: 'none', paddingTop: 0, marginTop: '2px' }}>
        <div className="card-assignee" title={`Asignado a: ${project.assignee}`}>
          <span className="avatar-initials">{initials}</span>
          <span style={{ fontSize: '12px' }}>{project.assignee || 'Sin Asignar'}</span>
        </div>
      </div>
    </div>
  );
};
