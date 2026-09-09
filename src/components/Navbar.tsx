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
  Moon
} from 'lucide-react';

interface NavbarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onNewProject: () => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
  onReset: () => void;
  activeCount: number;
  completedCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  onNewProject,
  onExport,
  onImportFile,
  onReset,
  activeCount,
  completedCount,
  theme,
  onToggleTheme
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
            <span>Histórico & Entregados</span>
            <span className="tab-counter">{completedCount}</span>
          </button>
        </div>

        {/* Actions */}
        <div className="navbar-actions">
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
            title="Restaurar datos iniciales de prueba"
          >
            <RotateCcw size={14} />
            <span>Restaurar</span>
          </button>

          <button className="btn btn-primary" onClick={onNewProject}>
            <Plus size={16} />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>
    </header>
  );
};
