import { useEffect, useMemo } from 'react';
import type { DragEvent } from 'react';
import type { Project, ProjectStatus, StatusConfig } from '../../types/project';
import { ProjectCard } from './ProjectCard';
import { useDragAndDrop } from '@formkit/drag-and-drop/react';
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

  // FormKit Drag and Drop
  const [parentRef, items, setItems] = useDragAndDrop<HTMLDivElement, Project>(
    visibleProjects,
    {
      group: 'kanban-board',
      draggingClass: 'dragging',
      dropZoneParentClass: 'drag-over',
      onTransfer: (data) => {
        // If target is this column, update the project status
        if (data.targetParent.el === parentRef.current) {
          const dragged = data.draggedNodes[0]?.data?.value;
          if (dragged && dragged.status !== statusConfig.id) {
            onStatusChange(dragged.id, statusConfig.id);
          }
        }
      }
    }
  );

  // Synchronize items when projects prop updates from parent state
  useEffect(() => {
    setItems(visibleProjects);
  }, [visibleProjects, setItems]);

  // Handle native drag & drop fallback
  const handleNativeDrop = (e: DragEvent) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('text/plain');
    if (projectId) {
      onStatusChange(projectId, statusConfig.id);
    }
  };

  const handleNativeDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className={`kanban-column kanban-column-status-${statusConfig.id} ${isDelivered ? 'kanban-column-delivered' : ''}`}
      onDrop={handleNativeDrop}
      onDragOver={handleNativeDragOver}
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
          <span className="kanban-column-count" title={`${projects.length} proyectos totales en ${statusConfig.label}`}>
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
      <div ref={parentRef} className="kanban-card-list">
        {items.map((project) => (
          <div 
            key={project.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', project.id)}
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

        {items.length === 0 && (
          <div className="kanban-empty-dropzone">
            Arrastra proyectos aquí
          </div>
        )}

        {/* "+ Nuevo proyecto" button at the bottom of the column (Replicating Notion screenshot 1) */}
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

      {/* Footer CTA for Delivered column: Ver más en Histórico */}
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
