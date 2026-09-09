import { useState, useMemo } from 'react';
import type { MouseEvent } from 'react';
import { STATUS_DEFINITIONS } from '../../types/project';
import type { Project } from '../../types/project';
import { 
  Search, 
  Filter, 
  GitBranch, 
  Server, 
  Copy, 
  Check, 
  ExternalLink, 
  Building2, 
  CheckCircle2, 
  Users,
  Layers,
  Wrench
} from 'lucide-react';

interface HistoryViewProps {
  projects: Project[];
  onSelect: (project: Project) => void;
  onEdit: (project: Project) => void;
  onRequestMaintenance?: (project: Project) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  projects,
  onSelect,
  onEdit,
  onRequestMaintenance
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Focus primarily on completed / delivered projects, but also allow viewing all historical
  const completedProjects = useMemo(() => {
    return projects.filter(p => ['entregado', 'terminado', 'terminado_parcialmente'].includes(p.status));
  }, [projects]);

  // Extract unique areas
  const uniqueAreas = useMemo(() => {
    const areas = new Set<string>();
    projects.forEach(p => {
      if (p.area) areas.add(p.area);
    });
    return Array.from(areas).sort();
  }, [projects]);

  // Filter projects
  const filtered = useMemo(() => {
    return completedProjects.filter(p => {
      const matchesSearch = 
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesArea = selectedArea === 'all' || p.area === selectedArea;
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      return matchesSearch && matchesArea && matchesCategory;
    });
  }, [completedProjects, searchTerm, selectedArea, selectedCategory]);

  const handleCopy = (id: string, text: string, e: MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalDelivered = completedProjects.filter(p => p.status === 'entregado').length;
  const totalAsistenciales = completedProjects.filter(p => p.category === 'asistencial').length;
  const totalAdministrativos = completedProjects.filter(p => p.category === 'administrativo').length;

  return (
    <div className="history-wrapper">
      {/* Top Header */}
      <div className="history-header">
        <div className="history-title-group">
          <h2>Proyectos Realizados & Histórico</h2>
          <p className="font-serif">Catálogo de iniciativas finalizadas, entregables, repositorios y ubicaciones productivas.</p>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#d1fae5', color: '#047857' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="stat-number">{totalDelivered}</div>
            <div className="stat-label">Total Entregados</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Building2 size={20} />
          </div>
          <div>
            <div className="stat-number">{totalAsistenciales}</div>
            <div className="stat-label">Área Asistencial</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f3f4f6', color: '#4b5563' }}>
            <Layers size={20} />
          </div>
          <div>
            <div className="stat-number">{totalAdministrativos}</div>
            <div className="stat-label">Área Administrativa</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Users size={20} />
          </div>
          <div>
            <div className="stat-number">{uniqueAreas.length}</div>
            <div className="stat-label">Áreas Hospitalarias</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="history-controls">
        <div className="history-search-box">
          <Search size={15} className="history-search-icon" />
          <input
            type="text"
            className="history-search-input"
            placeholder="Buscar por nombre, ubicación en servidor, GitHub, responsable o área..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="history-filters">
          <Filter size={14} color="var(--color-slate)" />
          <select
            className="select"
            style={{ width: 'auto', padding: '6px 12px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Todas las Categorías</option>
            <option value="asistencial">Asistencial</option>
            <option value="administrativo">Administrativo</option>
          </select>

          <select
            className="select"
            style={{ width: 'auto', padding: '6px 12px' }}
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
          >
            <option value="all">Todas las Áreas</option>
            {uniqueAreas.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Historical Projects */}
      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Área & Clasificación</th>
              <th>Asignado A</th>
              <th>Ubicación (Servidor / Ruta)</th>
              <th>GitHub</th>
              <th>Fechas (Inicio / Entrega)</th>
              <th>Estado Final</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((proj) => {
              const statusCfg = STATUS_DEFINITIONS[proj.status];
              const initials = proj.assignee
                ? proj.assignee.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : '??';

              return (
                <tr key={proj.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(proj)}>
                  {/* Name & Desc */}
                  <td>
                    <div className="history-project-name">
                      <span>{proj.name}</span>
                      <span className="history-project-desc">{proj.description}</span>
                      {(() => {
                        const count = projects.filter(p => p.parentProjectId === proj.id).length;
                        if (count === 0) return null;
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '10px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', marginTop: '4px', width: 'fit-content' }}>
                            <Wrench size={10} />
                            {count} {count === 1 ? 'Soporte vinculado' : 'Soportes vinculados'}
                          </span>
                        );
                      })()}
                      {proj.tags && proj.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                          {proj.tags.map((t, idx) => (
                            <span key={idx} className="tag-chip" style={{ fontSize: '10px' }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Area & Category */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      <span className="card-area-badge">
                        <Building2 size={11} />
                        {proj.area || 'General'}
                      </span>
                      <span className={`badge ${proj.category === 'asistencial' ? 'badge-asistencial' : 'badge-admin'}`}>
                        {proj.category === 'asistencial' ? 'Asistencial' : 'Administrativo'}
                      </span>
                    </div>
                  </td>

                  {/* Assignee */}
                  <td>
                    <div className="history-assignee-cell">
                      <span className="avatar-initials">{initials}</span>
                      <span className="history-assignee-name">{proj.assignee || 'Sin asignar'}</span>
                    </div>
                  </td>

                  {/* Location */}
                  <td>
                    {proj.location ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="location-snippet" title={proj.location}>
                          <Server size={12} style={{ flexShrink: 0 }} />
                          {proj.location}
                        </span>
                        <button
                          className="copy-btn"
                          title="Copiar ubicación al portapapeles"
                          onClick={(e) => handleCopy(`loc-${proj.id}`, proj.location, e)}
                        >
                          {copiedId === `loc-${proj.id}` ? (
                            <Check size={13} color="var(--color-success)" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-stone)', fontSize: '12px' }}>No especificada</span>
                    )}
                  </td>

                  {/* GitHub */}
                  <td>
                    {proj.githubUrl ? (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="link-btn"
                        onClick={(e) => e.stopPropagation()}
                        title="Abrir repositorio GitHub"
                      >
                        <GitBranch size={12} />
                        <span>Repositorio</span>
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span style={{ color: 'var(--color-stone)', fontSize: '12px' }}>Sin repo</span>
                    )}
                  </td>

                  {/* Dates */}
                  <td>
                    <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px', whiteSpace: 'nowrap' }}>
                      {proj.startDate && (
                        <span style={{ color: 'var(--color-graphite)' }}>
                          Inicio: <strong style={{ color: 'var(--color-charcoal)' }}>{proj.startDate}</strong>
                        </span>
                      )}
                      <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                        Entrega: <strong>{proj.actualDeliveryDate || proj.estimatedDeliveryDate || 'N/A'}</strong>
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`status-badge status-badge-${proj.status}`}>
                      <span className="kanban-column-dot-indicator" />
                      {statusCfg?.label || proj.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {onRequestMaintenance && proj.status === 'entregado' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--color-mocha)', borderColor: '#fed7aa', background: '#fffbeb', gap: '4px' }}
                          title="Abrir ticket de soporte o mantenimiento"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestMaintenance(proj);
                          }}
                        >
                          <Wrench size={12} />
                          Soporte
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(proj);
                        }}
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-stone)' }}>
                  No se encontraron proyectos en el histórico con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
