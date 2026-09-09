import React, { useState, useMemo } from 'react';
import type { DragEvent } from 'react';
import type { Project, ProjectStatus, StatusConfig } from '../../types/project';
import { ProjectCard } from './ProjectCard';
import { ArrowRight, Archive, Plus } from 'lucide-react';

interface KanbanColumnProps {
  statusConfig: StatusConfig;
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: ProjectStatus) => void;
  onSelect: (project: Project) => void;
  onNavigateToHistory?: () => void;
  onNewProject?: (status: ProjectStatus) => void;
  onRequestMaintenance?: (project: Project) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  statusConfig,
  projects,
  onEdit,
  onDelete,
  onStatusChange,
  onSelect,
  onNavigateToHistory,
  onNewProject,
  onRequestMaintenance
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const isDelivered = statusConfig.id === 'entregado';

  // For delivered column: sort by delivery/update date descending
  const sortedProjects = useMemo(() => {
    if (!isDelivered) return projects;
    return [...projects].sort((a, b) => {
      const dateA = a.actualDeliveryDate || a.updatedAt || a.estimatedDeliveryDate || '';
      const dateB = b.actualDeliveryDate || b.updatedAt || b.estimatedDeliveryDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [projects, isDelivered]);

  // If delivered column, show only top 3 most recent
  const visibleProjects = useMemo(() => {
    if (isDelivered) {
      return sortedProjects.slice(0, 3);
    }
    return sortedProjects;
  }, [sortedProjects, isDelivered]);

  // Robust HTML5 Drag and Drop handlers
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    // Only reset if leaving the column boundary
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const projectId = e.dataTransfer.getData('text/plain');
    if (projectId) {
      onStatusChange(projectId, statusConfig.id);
    }
  };

  return (
    <div
      className={`kanban-column kanban-column-status-${statusConfig.id} ${
        isDelivered ? 'kanban-column-delivered' : ''
      } ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header: Notion-style Stage Pill */}
      <div className="kanban-column-header">
        <div className="kanban-column-title">
          <span className={`status-badge status-badge-${statusConfig.id}`}>
            <span className="kanban-column-dot-indicator" />
            {statusConfig.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            className="kanban-column-count"
            title={`${projects.length} proyectos totales en ${statusConfig.label}`}
          >
            {projects.length}
          </span>
          {onNewProject && (
            <button
              className="column-header-add-btn"
              title={`Añadir nuevo proyecto en ${statusConfig.label}`}
              onClick={() => onNewProject(statusConfig.id)}
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Droppable Card List with internal scroll */}
      <div
        className="kanban-card-list"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {visibleProjects.map(project => (
          <div
            key={project.id}
            draggable
            onDragStart={e => {
              e.dataTransfer.setData('text/plain', project.id);
              e.dataTransfer.effectAllowed = 'move';
              const target = e.currentTarget as HTMLElement;
              setTimeout(() => {
                target?.classList.add('card-dragging');
              }, 0);
            }}
            onDragEnd={e => {
              (e.currentTarget as HTMLElement)?.classList.remove('card-dragging');
            }}
            style={{ cursor: 'grab' }}
          >
            <ProjectCard
              project={project}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onSelect={onSelect}
              onRequestMaintenance={onRequestMaintenance}
            />
          </div>
        ))}

        {visibleProjects.length === 0 && (
          <div className="kanban-empty-dropzone">
            Arrastra proyectos aquí
          </div>
        )}

        {/* "+ Nuevo proyecto" button at the bottom of the column */}
        {onNewProject && !isDelivered && (
          <button
            className="column-add-btn"
            onClick={() => onNewProject(statusConfig.id)}
            title={`Crear nuevo proyecto en ${statusConfig.label}`}
          >
            <Plus size={13} />
            <span>Nuevo proyecto</span>
          </button>
        )}
      </div>

      {/* Footer CTA for Delivered column */}
      {isDelivered && projects.length > 3 && (
        <div className="column-footer-action">
          <button
            className="view-more-history-btn"
            onClick={onNavigateToHistory}
            title="Abrir catálogo completo de entregados en la vista Histórico"
          >
            <Archive size={12} />
            <span>Ver todos en Histórico ({projects.length})</span>
            <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
