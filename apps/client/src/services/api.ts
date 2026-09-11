import type { Project, AuditLogEntry, AuditFilters, AuditStats } from '@app/shared';
import { storage } from './storage';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

async function secureFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  
  // Attach user context headers in development mode
  const devName = localStorage.getItem('lead_user_name');
  const devEmail = localStorage.getItem('lead_user_email');
  if (devName) headers.set('x-user-name', devName);
  if (devEmail) headers.set('x-user-email', devEmail);

  return fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include', // Crucial for HttpOnly session cookie transmission
    headers
  });
}

export const api = {
  // Projects
  async getProjects(): Promise<Project[]> {
    try {
      const res = await secureFetch('/api/projects');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      storage.saveProjects(data);
      return data;
    } catch (err) {
      console.warn('Backend unreachable or unauthenticated, using local storage cache:', err);
      return storage.getProjects();
    }
  },

  async createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    try {
      const res = await secureFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || `HTTP error! status: ${res.status}`);
      }
      const created = await res.json();
      return created;
    } catch (err) {
      console.warn('Backend error, saving locally:', err);
      return storage.addProject(data);
    }
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project[]> {
    try {
      const res = await secureFetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || `HTTP error! status: ${res.status}`);
      }
      return await this.getProjects();
    } catch (err) {
      console.warn('Backend error, updating locally:', err);
      return storage.updateProject(id, updates);
    }
  },

  async deleteProject(id: string): Promise<Project[]> {
    try {
      const res = await secureFetch(`/api/projects/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || `HTTP error! status: ${res.status}`);
      }
      return await this.getProjects();
    } catch (err) {
      console.warn('Backend error, deleting locally:', err);
      return storage.deleteProject(id);
    }
  },

  // Database Export / Import / Reset Operations (Turso DB)
  async exportProjects(): Promise<void> {
    try {
      const res = await secureFetch('/api/projects/export');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proyectos_big_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Backend export failed, exporting locally:', err);
      storage.exportJSON(storage.getProjects());
    }
  },

  async importProjects(projects: Project[], mode: 'replace' | 'merge'): Promise<Project[]> {
    try {
      const res = await secureFetch('/api/projects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects, mode })
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || `HTTP error! status: ${res.status}`);
      }
      const updatedList = await res.json();
      storage.saveProjects(updatedList);
      return updatedList;
    } catch (err) {
      console.warn('Backend import error, importing locally:', err);
      if (mode === 'replace') {
        storage.saveProjects(projects);
        return projects;
      } else {
        const current = storage.getProjects();
        return storage.mergeProjects(current, projects);
      }
    }
  },

  async resetProjects(): Promise<Project[]> {
    try {
      const res = await secureFetch('/api/projects/reset', {
        method: 'POST'
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || `HTTP error! status: ${res.status}`);
      }
      const restored = await res.json();
      storage.saveProjects(restored);
      return restored;
    } catch (err) {
      console.warn('Backend reset error, resetting locally:', err);
      return storage.resetDefaults();
    }
  },

  // Audit Logs (Accounting)
  async getAuditLogs(filters: AuditFilters = {}): Promise<{ entries: AuditLogEntry[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.action && filters.action !== 'all') params.append('action', filters.action);
      if (filters.projectId && filters.projectId !== 'all') params.append('projectId', filters.projectId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const res = await secureFetch(`/api/audit?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Could not load remote audit logs:', err);
      return { entries: [], total: 0 };
    }
  },

  async getAuditStats(): Promise<AuditStats> {
    try {
      const res = await secureFetch('/api/audit/stats');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      return {
        totalEvents: 0,
        statusChanges: 0,
        creations: 0,
        maintenances: 0
      };
    }
  },

  // Users
  async getUsers(): Promise<{ id: string; name: string; email?: string; image?: string | null }[]> {
    try {
      const res = await secureFetch('/api/users');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend users unreachable, using local fallback:', err);
      const defaultUsers = [
        'Jerson Tapias',
        'Laura Gómez',
        'Carlos Restrepo',
        'Santiago Vélez',
        'Marcela Ríos',
        'Andrés Morales',
        'Felipe Vargas'
      ];
      const projects = storage.getProjects();
      const set = new Set<string>(defaultUsers);
      projects.forEach(p => {
        if (p.assignee && p.assignee !== 'Sin asignar') {
          set.add(p.assignee);
        }
      });
      return Array.from(set).sort().map(name => ({ id: name, name, email: '' }));
    }
  }
};

