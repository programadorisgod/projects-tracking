import type { Project, AuditLogEntry, AuditFilters, AuditStats } from '@app/shared';
import { storage } from './storage';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

export const api = {
  // Projects
  async getProjects(): Promise<Project[]> {
    try {
      const res = await fetch(`${API_BASE}/api/projects`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      // Cache locally
      storage.saveProjects(data);
      return data;
    } catch (err) {
      console.warn('Backend unreachable, using local storage cache:', err);
      return storage.getProjects();
    }
  },

  async createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const created = await res.json();
      return created;
    } catch (err) {
      console.warn('Backend unreachable, saving locally:', err);
      return storage.addProject(data);
    }
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project[]> {
    try {
      const res = await fetch(`${API_BASE}/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      // Refresh full list
      return await this.getProjects();
    } catch (err) {
      console.warn('Backend unreachable, updating locally:', err);
      return storage.updateProject(id, updates);
    }
  },

  async deleteProject(id: string): Promise<Project[]> {
    try {
      const res = await fetch(`${API_BASE}/api/projects/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await this.getProjects();
    } catch (err) {
      console.warn('Backend unreachable, deleting locally:', err);
      return storage.deleteProject(id);
    }
  },

  // Database Export / Import / Reset Operations (Turso DB)
  async exportProjects(): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/api/projects/export`);
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
      const res = await fetch(`${API_BASE}/api/projects/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects, mode })
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const updatedList = await res.json();
      storage.saveProjects(updatedList);
      return updatedList;
    } catch (err) {
      console.warn('Backend import unreachable, importing locally:', err);
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
      const res = await fetch(`${API_BASE}/api/projects/reset`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const restored = await res.json();
      storage.saveProjects(restored);
      return restored;
    } catch (err) {
      console.warn('Backend reset unreachable, resetting locally:', err);
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

      const res = await fetch(`${API_BASE}/api/audit?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Could not load remote audit logs:', err);
      return { entries: [], total: 0 };
    }
  },

  async getAuditStats(): Promise<AuditStats> {
    try {
      const res = await fetch(`${API_BASE}/api/audit/stats`);
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
  }
};
