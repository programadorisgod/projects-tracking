import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import type { Project, ProjectStatus, ViewMode } from './types/project';
import { storage } from './services/storage';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/Kanban/KanbanBoard';
import { HistoryView } from './components/History/HistoryView';
import { ProjectModal } from './components/Modals/ProjectModal';
import { PauseReasonModal } from './components/Modals/PauseReasonModal';
import { ProjectDetailModal } from './components/Modals/ProjectDetailModal';
import { ImportModal } from './components/Modals/ImportModal';

// Robust SPA View Transition helper for page/tab navigation only
const startSpaTransition = (updateCallback: () => void) => {
  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
      flushSync(() => {
        updateCallback();
      });
    });
  } else {
    updateCallback();
  }
};

export const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => storage.getProjects());
  const [currentView, setCurrentView] = useState<ViewMode>('kanban');

  // Theme State (Notion Light / Dark)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('notion_theme') as 'light' | 'dark' | null;
    if (saved) return saved;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('notion_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Modal States
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [defaultStatusForNew, setDefaultStatusForNew] = useState<ProjectStatus>('analisis');

  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Pause Reason Modal
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [pendingPauseProjectId, setPendingPauseProjectId] = useState<string | null>(null);

  // Import Modal States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingImportProjects, setPendingImportProjects] = useState<Project[]>([]);
  const [pendingImportFileName, setPendingImportFileName] = useState('');

  // Save projects to storage whenever state updates
  useEffect(() => {
    storage.saveProjects(projects);
  }, [projects]);

  // View Navigation with View Transition (Kanban ↔ Histórico)
  const handleViewChange = (view: ViewMode) => {
    startSpaTransition(() => {
      setCurrentView(view);
    });
  };

  // Modal Handlers: Direct & instant, animated via pure GPU-accelerated CSS
  const handleCreateProject = (status?: ProjectStatus) => {
    setProjectToEdit(null);
    setDefaultStatusForNew(status || 'analisis');
    setIsProjectModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
    setIsProjectModalOpen(true);
  };

  const handleSelectProject = (project: Project) => {
    setDetailProject(project);
    setIsDetailModalOpen(true);
  };

  const handleCloseProjectModal = () => {
    setIsProjectModalOpen(false);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
  };

  const handleSaveProject = (
    data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => {
    if (editId) {
      const updated = storage.updateProject(editId, data);
      setProjects(updated);
    } else {
      storage.addProject(data);
      setProjects(storage.getProjects());
    }
  };

  const handleDeleteProject = (id: string) => {
    const updated = storage.deleteProject(id);
    setProjects(updated);
    if (detailProject?.id === id) {
      setIsDetailModalOpen(false);
    }
  };

  const handleStatusChange = (id: string, newStatus: ProjectStatus) => {
    const targetProject = projects.find(p => p.id === id);
    if (!targetProject) return;

    // If moving to 'pausado' and no pauseReason exists yet, request explanation
    if (newStatus === 'pausado' && !targetProject.pauseReason) {
      setPendingPauseProjectId(id);
      setIsPauseModalOpen(true);
      return;
    }

    const updates: Partial<Project> = { status: newStatus };

    // If moved to delivered/completed, optionally set actualDeliveryDate
    if (['entregado', 'terminado'].includes(newStatus) && !targetProject.actualDeliveryDate) {
      updates.actualDeliveryDate = new Date().toISOString().split('T')[0];
    }

    const updated = storage.updateProject(id, updates);
    setProjects(updated);
  };

  const handleConfirmPause = (reason: string) => {
    if (!pendingPauseProjectId) return;
    const updated = storage.updateProject(pendingPauseProjectId, {
      status: 'pausado',
      pauseReason: reason
    });
    setProjects(updated);
    setIsPauseModalOpen(false);
    setPendingPauseProjectId(null);
  };

  const handleExport = () => {
    storage.exportJSON(projects);
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const result = storage.validateImportData(parsed);
        if (!result.valid || !result.projects) {
          alert(`Error de validación: ${result.error || 'Formato de archivo inválido.'}`);
          return;
        }

        setPendingImportProjects(result.projects);
        setPendingImportFileName(file.name);
        setIsImportModalOpen(true);
      } catch (err) {
        alert('No se pudo procesar el archivo. Asegúrate de seleccionar un archivo JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = (mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      storage.saveProjects(pendingImportProjects);
      startSpaTransition(() => {
        setProjects(pendingImportProjects);
      });
    } else {
      const merged = storage.mergeProjects(projects, pendingImportProjects);
      startSpaTransition(() => {
        setProjects(merged);
      });
    }
    setIsImportModalOpen(false);
    setPendingImportProjects([]);
  };

  const handleReset = () => {
    if (confirm('¿Deseas restaurar los proyectos de ejemplo originales? Se reemplazarán los datos locales.')) {
      const initial = storage.resetDefaults();
      startSpaTransition(() => {
        setProjects(initial);
      });
    }
  };

  const activeCount = projects.filter(p => !['entregado', 'terminado'].includes(p.status)).length;
  const completedCount = projects.filter(p => ['entregado', 'terminado', 'terminado_parcialmente'].includes(p.status)).length;

  const pendingPauseProject = projects.find(p => p.id === pendingPauseProjectId);

  return (
    <div className="app-root">
      {/* Top Navigation - Persistently isolated */}
      <Navbar
        currentView={currentView}
        onViewChange={handleViewChange}
        onNewProject={handleCreateProject}
        onExport={handleExport}
        onImportFile={handleImportFile}
        onReset={handleReset}
        activeCount={activeCount}
        completedCount={completedCount}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main View Container with scoped View Transition */}
      <main className="app-main-content">
        {currentView === 'kanban' ? (
          <KanbanBoard
            key="view-kanban"
            projects={projects}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
            onStatusChange={handleStatusChange}
            onSelect={handleSelectProject}
            onNavigateToHistory={() => handleViewChange('history')}
            onNewProject={handleCreateProject}
          />
        ) : (
          <HistoryView
            key="view-history"
            projects={projects}
            onSelect={handleSelectProject}
            onEdit={handleEditProject}
          />
        )}
      </main>

      {/* Modals - Clean GPU transitions without background vibration */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        projectToEdit={projectToEdit}
        defaultStatus={defaultStatusForNew}
        onClose={handleCloseProjectModal}
        onSave={handleSaveProject}
      />

      <PauseReasonModal
        isOpen={isPauseModalOpen}
        projectName={pendingPauseProject?.name || ''}
        onClose={() => {
          setIsPauseModalOpen(false);
          setPendingPauseProjectId(null);
        }}
        onConfirm={handleConfirmPause}
      />

      <ProjectDetailModal
        isOpen={isDetailModalOpen}
        project={detailProject}
        onClose={handleCloseDetailModal}
        onEdit={(proj) => {
          handleCloseDetailModal();
          handleEditProject(proj);
        }}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        importedProjects={pendingImportProjects}
        fileName={pendingImportFileName}
        currentCount={projects.length}
        onClose={() => setIsImportModalOpen(false)}
        onConfirm={handleConfirmImport}
      />
    </div>
  );
};

export default App;
