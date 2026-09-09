import { useState, useMemo } from 'react';
import { STATUS_DEFINITIONS } from '../../types/project';
import type { Project, ProjectStatus } from '../../types/project';
import { KanbanColumn } from './KanbanColumn';
import { Search, Filter, Layers, AlertTriangle, GitMerge, AlertCircle, CheckCircle } from 'lucide-react';

interface KanbanBoardProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: ProjectStatus) => void;
  onSelect: (project: Project) => void;
  onNavigateToHistory?: () => void;
  onNewProject?: (status?: ProjectStatus) => void;
  onRequestMaintenance?: (project: Project) => void;
}

type ColumnFilterMode = 'all' | 'stages' | 'alerts' | 'finished';

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projects,
  onEdit,
  onDelete,
  onStatusChange,
  onSelect,
  onNavigateToHistory,
  onNewProject,
  onRequestMaintenance
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [columnFilter, setColumnFilter] = useState<ColumnFilterMode>('all');

  // Extract unique areas from projects
  const uniqueAreas = useMemo(() => {
    const areas = new Set<string>();
    projects.forEach(p => {
      if (p.area) areas.add(p.area);
    });
    return Array.from(areas).sort();
  }, [projects]);

  // Filter projects by search, area, category, type
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = 
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.parentProjectName && p.parentProjectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.maintenanceScope && p.maintenanceScope.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesArea = selectedArea === 'all' || p.area === selectedArea;
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesType = selectedType === 'all' || 
        (selectedType === 'mantenimiento' ? p.projectType === 'mantenimiento' : p.projectType !== 'mantenimiento');

      return matchesSearch && matchesArea && matchesCategory && matchesType;
    });
  }, [projects, searchTerm, selectedArea, selectedCategory, selectedType]);

  // Group definitions
  const normalStatuses = useMemo(() => {
    return Object.values(STATUS_DEFINITIONS).filter(s => s.group === 'etapa' || s.group === 'finalizacion');
  }, []);

  const alertStatuses = useMemo(() => {
    return Object.values(STATUS_DEFINITIONS).filter(s => s.group === 'alerta');
  }, []);

  const onlyStages = useMemo(() => {
    return Object.values(STATUS_DEFINITIONS).filter(s => s.group === 'etapa');
  }, []);

  const onlyFinished = useMemo(() => {
    return Object.values(STATUS_DEFINITIONS).filter(s => s.group === 'finalizacion');
  }, []);

  const projectsByStatus = useMemo(() => {
    const map: Record<string, Project[]> = {};
    for (const p of filteredProjects) {
      if (!map[p.status]) {
        map[p.status] = [];
      }
      map[p.status].push(p);
    }
    return map;
  }, [filteredProjects]);

  const alertProjectsCount = useMemo(() => {
    let count = 0;
    const alertKeys = ['pendiente_revision', 'retrasado', 'pausado'];
    for (const key of alertKeys) {
      if (projectsByStatus[key]) {
        count += projectsByStatus[key].length;
      }
    }
    return count;
  }, [projectsByStatus]);

  const normalProjectsCount = filteredProjects.length - alertProjectsCount;

  const renderColumns = (statuses: typeof normalStatuses) => {
    return statuses.map((statusConfig) => {
      const colProjects = projectsByStatus[statusConfig.id] || [];
      return (
        <KanbanColumn
          key={statusConfig.id}
          statusConfig={statusConfig}
          projects={colProjects}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onSelect={onSelect}
          onNavigateToHistory={onNavigateToHistory}
          onNewProject={onNewProject}
          onRequestMaintenance={onRequestMaintenance}
        />
      );
    });
  };

  return (
    <div className="kanban-wrapper">
      {/* Toolbar & Filters */}
      <div className="kanban-toolbar">
        {/* Search & Area & Category */}
        <div className="kanban-filters">
          <div className="history-search-box" style={{ minWidth: '220px', maxWidth: '300px' }}>
            <Search size={14} className="history-search-icon" />
            <input
              type="text"
              className="history-search-input"
              placeholder="Buscar proyectos, tags, responsable..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--color-slate)" />
            <select
              className="select"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '13px' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Todas las Categorías</option>
              <option value="administrativo">Administrativo</option>
              <option value="asistencial">Asistencial</option>
            </select>

            <select
              className="select"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '13px' }}
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
            >
              <option value="all">Todas las Áreas</option>
              {uniqueAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>

            <select
              className="select"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '13px' }}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">Todos los Tipos</option>
              <option value="proyecto">Solo Proyectos Base</option>
              <option value="mantenimiento">Solo Soporte / Mant.</option>
            </select>
          </div>
        </div>

        {/* Column View Mode Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className={`group-toggle-btn ${columnFilter === 'all' ? 'active' : ''}`}
            onClick={() => setColumnFilter('all')}
          >
            <Layers size={13} />
            Vista Dividida (Todas)
          </button>
          <button
            className={`group-toggle-btn ${columnFilter === 'stages' ? 'active' : ''}`}
            onClick={() => setColumnFilter('stages')}
          >
            Solo Etapas de Desarrollo (6)
          </button>
          <button
            className={`group-toggle-btn ${columnFilter === 'alerts' ? 'active' : ''}`}
            onClick={() => setColumnFilter('alerts')}
          >
            <AlertCircle size={13} />
            Solo Alertas ({alertProjectsCount})
          </button>
          <button
            className={`group-toggle-btn ${columnFilter === 'finished' ? 'active' : ''}`}
            onClick={() => setColumnFilter('finished')}
          >
            <CheckCircle size={13} />
            Solo Finalizados
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {columnFilter === 'all' && (
        <>
          {/* Top Section: Normal Stages & Finalization */}
          <section className="kanban-section">
            <div className="kanban-section-header">
              <div className="kanban-section-title">
                <GitMerge size={15} color="var(--color-notion-blue)" />
                <span>Flujo de Desarrollo & Entrega</span>
                <span className="kanban-column-count">{normalProjectsCount}</span>
              </div>
              <span className="kanban-section-desc">
                Etapas secuenciales del ciclo de vida (Análisis hasta Entrega)
              </span>
            </div>
            <div className="kanban-board">
              {renderColumns(normalStatuses)}
            </div>
          </section>

          {/* Bottom Section: Alerts & Blockers */}
          <section className="kanban-section" style={{ marginTop: 'var(--spacing-8)' }}>
            <div className="kanban-section-header" style={{ borderColor: 'rgba(246, 73, 50, 0.2)' }}>
              <div className="kanban-section-title" style={{ color: 'var(--color-coral)' }}>
                <AlertTriangle size={15} color="var(--color-coral)" />
                <span>Estados de Alerta & Bloqueos Operativos</span>
                <span className="kanban-column-count" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                  {alertProjectsCount}
                </span>
              </div>
              <span className="kanban-section-desc">
                Proyectos que requieren revisión, justificación de pausa o mitigación de retrasos
              </span>
            </div>
            <div className="kanban-board alerts-board">
              {renderColumns(alertStatuses)}
            </div>
          </section>
        </>
      )}

      {columnFilter === 'stages' && (
        <section className="kanban-section">
          <div className="kanban-board">
            {renderColumns(onlyStages)}
          </div>
        </section>
      )}

      {columnFilter === 'alerts' && (
        <section className="kanban-section">
          <div className="kanban-board alerts-board">
            {renderColumns(alertStatuses)}
          </div>
        </section>
      )}

      {columnFilter === 'finished' && (
        <section className="kanban-section">
          <div className="kanban-board">
            {renderColumns(onlyFinished)}
          </div>
        </section>
      )}
    </div>
  );
};
