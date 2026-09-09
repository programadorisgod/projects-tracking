import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import type { Project, ProjectStatus, ViewMode } from './types/project';
import { storage } from './services/storage';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/Kanban/KanbanBoard';
import { HistoryView } from './components/History/HistoryView';
import { AuditView } from './components/Audit/AuditView';
import { ProjectModal } from './components/Modals/ProjectModal';
import { PauseReasonModal } from './components/Modals/PauseReasonModal';
import { ProjectDetailModal } from './components/Modals/ProjectDetailModal';
import { ImportModal } from './components/Modals/ImportModal';
import { MaintenanceModal } from './components/Modals/MaintenanceModal';
import { LoginPage } from './components/Auth/LoginPage';
import { useSession } from './auth/client';

// SPA View Transition helper for page/tab navigation
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
  const { data: session, isPending } = useSession();
  const [localUser, setLocalUser] = useState<{ name: string; email: string } | null>(() => {
    const savedName = localStorage.getItem('lead_user_name');
    const savedEmail = localStorage.getItem('lead_user_email');
    return savedName ? { name: savedName, email: savedEmail || '' } : null;
  });

  const currentUser = session?.user || localUser;

  const [projects, setProjects] = useState<Project[]>(() => storage.getProjects());
  const [currentView, setCurrentView] = useState<ViewMode>('kanban');

  // Load from Backend API on mount
  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;
    api.getProjects().then(data => {
      if (isMounted && data && data.length > 0) {
        setProjects(data);
      }
    });
    // Warm up audit logs cache in background
    api.getAuditLogs({ limit: 150 }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

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
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      document.documentElement.classList.add('theme-transitioning');
      const transition = (document as unknown as {
        startViewTransition: (cb: () => void) => { finished: Promise<void> };
      }).startViewTransition(() => {
        flushSync(() => {
          setTheme(nextTheme);
          document.documentElement.setAttribute('data-theme', nextTheme);
          localStorage.setItem('notion_theme', nextTheme);
        });
      });
      transition.finished.finally(() => {
        document.documentElement.classList.remove('theme-transitioning');
      });
    } else {
      setTheme(nextTheme);
    }
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

  // Maintenance & Support Modal States
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceParentProject, setMaintenanceParentProject] = useState<Project | null>(null);

  // View Navigation with View Transition
  const handleViewChange = (view: ViewMode) => {
    startSpaTransition(() => {
      setCurrentView(view);
    });
  };

  // Modal Handlers
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

  const handleSaveProject = async (
    data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => {
    if (editId) {
      const updatedList = await api.updateProject(editId, data);
      setProjects(updatedList);
    } else {
      await api.createProject(data);
      const refreshed = await api.getProjects();
      setProjects(refreshed);
    }
  };

  // Maintenance & Support Handlers
  const handleRequestMaintenance = (parent: Project) => {
    setMaintenanceParentProject(parent);
    setIsMaintenanceModalOpen(true);
  };

  const handleSaveMaintenance = async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    await api.createProject(data);
    const refreshed = await api.getProjects();
    setProjects(refreshed);
    if (currentView !== 'kanban') {
      startSpaTransition(() => {
        setCurrentView('kanban');
      });
    }
  };

  const handleDeleteProject = async (id: string) => {
    const updatedList = await api.deleteProject(id);
    setProjects(updatedList);
    if (detailProject?.id === id) {
      setIsDetailModalOpen(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ProjectStatus) => {
    const targetProject = projects.find(p => p.id === id);
    if (!targetProject) return;
    if (targetProject.status === newStatus) return;

    if (newStatus === 'pausado' && !targetProject.pauseReason) {
      setPendingPauseProjectId(id);
      setIsPauseModalOpen(true);
      return;
    }

    const updates: Partial<Project> = { 
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    if (['entregado', 'terminado'].includes(newStatus) && !targetProject.actualDeliveryDate) {
      updates.actualDeliveryDate = new Date().toISOString().split('T')[0];
    }

    // 1. Actualización Optimista: mover en UI instantáneamente (0ms)
    const previousProjects = [...projects];
    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );

    // 2. Persistencia asíncrona en base de datos y auditoría
    try {
      const updatedList = await api.updateProject(id, updates);
      if (updatedList && updatedList.length > 0) {
        setProjects(updatedList);
      }
    } catch (error) {
      console.error('Error sincronizando cambio de estado:', error);
      // Rollback en caso de fallo de red
      setProjects(previousProjects);
    }
  };

  const handleConfirmPause = async (reason: string) => {
    if (!pendingPauseProjectId) return;
    const targetId = pendingPauseProjectId;
    setIsPauseModalOpen(false);
    setPendingPauseProjectId(null);

    const updates: Partial<Project> = {
      status: 'pausado',
      pauseReason: reason,
      updatedAt: new Date().toISOString()
    };

    // Actualización optimista
    const previousProjects = [...projects];
    setProjects(prev =>
      prev.map(p => (p.id === targetId ? { ...p, ...updates } : p))
    );

    try {
      const updatedList = await api.updateProject(targetId, updates);
      if (updatedList && updatedList.length > 0) {
        setProjects(updatedList);
      }
    } catch (error) {
      console.error('Error sincronizando pausa:', error);
      setProjects(previousProjects);
    }
  };

  const handleExport = async () => {
    await api.exportProjects();
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
      } catch {
        alert('No se pudo procesar el archivo. Asegúrate de seleccionar un archivo JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async (mode: 'merge' | 'replace') => {
    try {
      const updatedList = await api.importProjects(pendingImportProjects, mode);
      startSpaTransition(() => {
        setProjects(updatedList);
      });
      api.getAuditLogs({ limit: 150 }).catch(() => {});
    } catch (err) {
      console.error('Error importing projects:', err);
      alert('Error al importar proyectos en la base de datos.');
    } finally {
      setIsImportModalOpen(false);
      setPendingImportProjects([]);
    }
  };

  const handleReset = async () => {
    if (confirm('¿Deseas restaurar la base de datos a los proyectos de ejemplo originales? Esta acción quedará registrada en la bitácora.')) {
      try {
        const restored = await api.resetProjects();
        startSpaTransition(() => {
          setProjects(restored);
        });
        api.getAuditLogs({ limit: 150 }).catch(() => {});
      } catch (err) {
        console.error('Error resetting projects:', err);
        alert('Error al restaurar los proyectos en la base de datos.');
      }
    }
  };

  const activeCount = projects.filter(p => !['entregado', 'terminado'].includes(p.status)).length;
  const completedCount = projects.filter(p => ['entregado', 'terminado', 'terminado_parcialmente'].includes(p.status)).length;

  // Auth Gate: Render LoginPage if unauthenticated
  if (isPending && !localUser) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-paper-warmth, #fbfbfa)'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ marginBottom: '1rem' }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)' }}>
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={(u) => setLocalUser(u)} />;
  }

  const pendingPauseProject = projects.find(p => p.id === pendingPauseProjectId);

  return (
    <div className="app-root">
      {/* Top Navigation */}
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
        onLogout={() => setLocalUser(null)}
      />

      {/* Main View Container */}
      <main className="app-main-content">
        {currentView === 'kanban' && (
          <KanbanBoard
            key="view-kanban"
            projects={projects}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
            onStatusChange={handleStatusChange}
            onSelect={handleSelectProject}
            onNavigateToHistory={() => handleViewChange('history')}
            onNewProject={handleCreateProject}
            onRequestMaintenance={handleRequestMaintenance}
          />
        )}

        {currentView === 'history' && (
          <HistoryView
            key="view-history"
            projects={projects}
            onSelect={handleSelectProject}
            onEdit={handleEditProject}
            onRequestMaintenance={handleRequestMaintenance}
          />
        )}

        {currentView === 'audit' && (
          <AuditView
            key="view-audit"
            projects={projects}
          />
        )}
      </main>

      {/* Modals */}
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
        allProjects={projects}
        onRequestMaintenance={handleRequestMaintenance}
        onSelectProject={handleSelectProject}
        onClose={handleCloseDetailModal}
        onEdit={(proj) => {
          handleCloseDetailModal();
          handleEditProject(proj);
        }}
      />

      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        parentProject={maintenanceParentProject}
        onClose={() => {
          setIsMaintenanceModalOpen(false);
          setMaintenanceParentProject(null);
        }}
        onSave={handleSaveMaintenance}
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
