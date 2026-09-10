import React, { useRef } from 'react';
import type { ViewMode } from '../types/project';
import { 
  KanbanSquare, 
  Archive, 
  Plus, 
  Database, 
  Download, 
  Upload,
  RotateCcw,
  Sun,
  Moon,
  ShieldCheck
} from 'lucide-react';
import { AuthBadge } from './Auth/AuthBadge';

interface NavbarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onNewProject: () => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
  onReset: () => void;
  isResetting?: boolean;
  activeCount: number;
  completedCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  onNewProject,
  onExport,
  onImportFile,
  onReset,
  isResetting = false,
  activeCount,
  completedCount,
  theme,
  onToggleTheme,
  onLogout
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
      // Reset input value so same file can be chosen again
      e.target.value = '';
    }
  };

  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="notion-navbar">
      <div className="navbar-container">
        {/* Hidden File Input for JSON Import */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".json,application/json" 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />

        {/* Brand */}
        <div className="navbar-brand">
          <div className="brand-icon">
            <Database size={20} color="var(--color-notion-blue)" />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">Big Data Tracking</h1>
            <span className="brand-subtitle font-serif">Seguimiento de Ciclo de Vida de Proyectos</span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="navbar-tabs">
          <button
            className={`nav-tab ${currentView === 'kanban' ? 'active' : ''}`}
            onClick={() => onViewChange('kanban')}
          >
            <KanbanSquare size={16} />
            <span>Tablero Kanban</span>
            <span className="tab-counter">{activeCount}</span>
          </button>
          <button
            className={`nav-tab ${currentView === 'history' ? 'active' : ''}`}
            onClick={() => onViewChange('history')}
          >
            <Archive size={16} />
            <span>Histórico</span>
            <span className="tab-counter">{completedCount}</span>
          </button>
          <button
            className={`nav-tab ${currentView === 'audit' ? 'active' : ''}`}
            onClick={() => onViewChange('audit')}
          >
            <ShieldCheck size={16} />
            <span>Bitácora Auditoría</span>
          </button>
        </div>

        {/* Actions Row */}
        <div className="navbar-actions">
          <div className="navbar-action-buttons">
            {/* Theme Toggle Button */}
            <button
              className="theme-toggle-btn"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Alternar tema de interfaz"
            >
              {theme === 'dark' ? <Sun size={16} color="var(--color-marigold)" /> : <Moon size={16} />}
            </button>

            <button 
              className="btn btn-ghost btn-sm" 
              onClick={onExport} 
              title="Exportar respaldo JSON de proyectos"
            >
              <Download size={14} />
              <span>Exportar</span>
            </button>

            <button 
              className="btn btn-ghost btn-sm" 
              onClick={handleTriggerImport} 
              title="Importar proyectos desde archivo JSON"
            >
              <Upload size={14} />
              <span>Importar</span>
            </button>

            <button 
              className="btn btn-ghost btn-sm" 
              onClick={onReset} 
              disabled={isResetting}
              title={isResetting ? "Restaurando base de datos a los valores iniciales..." : "Restaurar datos iniciales de prueba"}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                minWidth: '95px',
                justifyContent: 'center',
                opacity: isResetting ? 0.75 : 1,
                cursor: isResetting ? 'not-allowed' : 'pointer'
              }}
            >
              <RotateCcw size={14} className={isResetting ? 'spin' : ''} />
              <span>{isResetting ? 'Restaurando...' : 'Restaurar'}</span>
            </button>

            <button className="btn btn-primary" onClick={onNewProject}>
              <Plus size={16} />
              <span>Nuevo Proyecto</span>
            </button>
          </div>

          {/* User Profile & Pop-up strictly on the far right */}
          <div className="navbar-user-group">
            <AuthBadge onLogout={onLogout} />
          </div>
        </div>
      </div>
    </header>
  );
};
