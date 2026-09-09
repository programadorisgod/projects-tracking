import type { Project } from '../types/project';
import { INITIAL_PROJECTS } from './initialData';

const STORAGE_KEY = 'big_data_tracking_projects_v1';

export const storage = {
  getProjects: (): Project[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
        return INITIAL_PROJECTS;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading projects from storage:', e);
      return INITIAL_PROJECTS;
    }
  },

  saveProjects: (projects: Project[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Error saving projects to storage:', e);
    }
  },

  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project => {
    const projects = storage.getProjects();
    const newProject: Project = {
      ...data,
      id: `proj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [newProject, ...projects];
    storage.saveProjects(updated);
    return newProject;
  },

  updateProject: (id: string, updates: Partial<Project>): Project[] => {
    const projects = storage.getProjects();
    const updated = projects.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    storage.saveProjects(updated);
    return updated;
  },

  deleteProject: (id: string): Project[] => {
    const projects = storage.getProjects();
    const updated = projects.filter(p => p.id !== id);
    storage.saveProjects(updated);
    return updated;
  },

  resetDefaults: (): Project[] => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
    return INITIAL_PROJECTS;
  },

  exportJSON: (projects: Project[]): void => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `proyectos-big-data-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  validateImportData: (raw: any): { valid: boolean; projects?: Project[]; error?: string } => {
    if (!Array.isArray(raw)) {
      return { valid: false, error: 'El archivo JSON debe contener un arreglo de proyectos.' };
    }
    if (raw.length === 0) {
      return { valid: false, error: 'El archivo JSON no contiene proyectos.' };
    }

    const validProjects: Project[] = [];
    for (let i = 0; i < raw.length; i++) {
      const p = raw[i];
      if (!p || typeof p !== 'object' || !p.name || typeof p.name !== 'string') {
        return { valid: false, error: `El proyecto en la posición ${i + 1} no tiene un nombre válido.` };
      }

      validProjects.push({
        id: p.id || `proj-imp-${Date.now().toString(36)}-${i}`,
        name: p.name.trim(),
        description: p.description || '',
        status: p.status || 'analisis',
        category: p.category === 'administrativo' ? 'administrativo' : 'asistencial',
        area: p.area || 'General',
        tags: Array.isArray(p.tags) ? p.tags : [],
        startDate: p.startDate || new Date().toISOString().split('T')[0],
        estimatedDeliveryDate: p.estimatedDeliveryDate,
        actualDeliveryDate: p.actualDeliveryDate,
        pauseReason: p.pauseReason,
        location: p.location || '',
        githubUrl: p.githubUrl || '',
        assignee: p.assignee || 'Sin asignar',
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return { valid: true, projects: validProjects };
  },

  mergeProjects: (existing: Project[], imported: Project[]): Project[] => {
    const existingMap = new Map<string, Project>();
    existing.forEach(p => existingMap.set(p.id, p));

    imported.forEach(p => {
      existingMap.set(p.id, {
        ...p,
        updatedAt: new Date().toISOString()
      });
    });

    const merged = Array.from(existingMap.values());
    storage.saveProjects(merged);
    return merged;
  }
};
