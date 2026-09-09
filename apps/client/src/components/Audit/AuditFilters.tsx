import React from 'react';
import type { Project } from '@app/shared';
import { Search, Filter, RefreshCw } from 'lucide-react';

interface AuditFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedAction: string;
  onActionChange: (val: string) => void;
  selectedProject: string;
  onProjectChange: (val: string) => void;
  projects: Project[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const AuditFilters: React.FC<AuditFiltersProps> = ({
  search,
  onSearchChange,
  selectedAction,
  onActionChange,
  selectedProject,
  onProjectChange,
  projects,
  onRefresh,
  isLoading
}) => {
  return (
    <div className="audit-filters-bar">
      {/* Search Input */}
      <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-stone)'
          }}
        />
        <input
          type="text"
          placeholder="Buscar en la bitácora (autor, proyecto, detalle)..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="audit-filters-input"
        />
      </div>

      {/* Selectors Group */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        {/* Action Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Filter size={14} color="var(--color-stone)" />
          <select
            value={selectedAction}
            onChange={e => onActionChange(e.target.value)}
            className="audit-filters-select"
          >
            <option value="all">Todas las Acciones</option>
            <option value="STATUS_CHANGED">Cambios de Estado</option>
            <option value="PROJECT_CREATED">Proyectos Creados</option>
            <option value="MAINTENANCE_RECORDED">Mantenimientos</option>
            <option value="PROJECT_UPDATED">Actualizaciones</option>
            <option value="PROJECT_DELETED">Eliminaciones</option>
            <option value="DATABASE_RESET">Restauraciones de BD</option>
            <option value="DATABASE_IMPORTED">Importaciones de BD</option>
          </select>
        </div>

        {/* Project Filter */}
        <select
          value={selectedProject}
          onChange={e => onProjectChange(e.target.value)}
          className="audit-filters-select"
          style={{ maxWidth: '220px' }}
        >
          <option value="all">Todos los Proyectos</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="btn btn-secondary btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
          title="Refrescar bitácora"
        >
          <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          <span>Refrescar</span>
        </button>
      </div>
    </div>
  );
};
