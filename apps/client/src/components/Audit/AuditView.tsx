import React, { useState, useEffect, useMemo } from 'react';
import type { Project, AuditLogEntry, AuditStats } from '@app/shared';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { AuditStatsBar } from './AuditStatsBar';
import { AuditFilters } from './AuditFilters';
import { AuditTimelineItem } from './AuditTimelineItem';
import { ShieldCheck, Calendar, AlertCircle, Loader2 } from 'lucide-react';

interface AuditViewProps {
  projects: Project[];
}

// Module-level cache so tab switches have instant synchronous content
let memoryAuditEntries: AuditLogEntry[] = [];
let memoryAuditStats: AuditStats = {
  totalEvents: 0,
  statusChanges: 0,
  creations: 0,
  maintenances: 0
};

export const AuditView: React.FC<AuditViewProps> = ({ projects }) => {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<AuditLogEntry[]>(memoryAuditEntries);
  const [stats, setStats] = useState<AuditStats>(memoryAuditStats);
  const [isLoading, setIsLoading] = useState<boolean>(memoryAuditEntries.length === 0);
  const [justUpdated, setJustUpdated] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  // Debounce search input to avoid flood of HTTP requests on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  // Load audit data with race condition & unmount protection
  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [logsRes, statsRes] = await Promise.all([
          api.getAuditLogs({
            search: debouncedSearch || undefined,
            action: selectedAction !== 'all' ? selectedAction : undefined,
            projectId: selectedProject !== 'all' ? selectedProject : undefined,
            limit: 150
          }),
          api.getAuditStats()
        ]);

        if (!isCancelled) {
          // Only update global warm cache if this is an unfiltered baseline view
          if (!debouncedSearch && selectedAction === 'all' && selectedProject === 'all') {
            memoryAuditEntries = logsRes.entries;
            memoryAuditStats = statsRes;
          }
          setEntries(logsRes.entries);
          setStats(statsRes);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Error fetching audit data:', err);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch, selectedAction, selectedProject]);

  const handleManualRefresh = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.getAuditLogs({
          search: debouncedSearch || undefined,
          action: selectedAction !== 'all' ? selectedAction : undefined,
          projectId: selectedProject !== 'all' ? selectedProject : undefined,
          limit: 150
        }),
        api.getAuditStats()
      ]);

      if (!debouncedSearch && selectedAction === 'all' && selectedProject === 'all') {
        memoryAuditEntries = logsRes.entries;
        memoryAuditStats = statsRes;
      }
      setEntries(logsRes.entries);
      setStats(statsRes);
      setJustUpdated(true);
      showToast('Bitácora de auditoría actualizada con éxito.', 'success');
      setTimeout(() => {
        setJustUpdated(false);
      }, 2000);
    } catch (err) {
      console.error('Error refreshing audit data:', err);
      showToast('Error al actualizar la bitácora de auditoría.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Group entries by local date (e.g. "2026-09-09", "2026-09-08", etc.)
  const groupedEntries = useMemo(() => {
    const groups: { [dateStr: string]: AuditLogEntry[] } = {};

    entries.forEach(entry => {
      let dateKey = 'Desconocido';
      if (entry.timestamp) {
        const d = new Date(entry.timestamp);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateKey = `${year}-${month}-${day}`;
      }
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });

    return groups;
  }, [entries]);

  const formatDateHeader = (dateStr: string) => {
    if (dateStr === 'Desconocido') return 'Fecha no especificada';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const today = new Date();
      const isToday =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday =
        date.getFullYear() === yesterday.getFullYear() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getDate() === yesterday.getDate();

      const formatted = new Intl.DateTimeFormat('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);

      if (isToday) return `Hoy — ${formatted}`;
      if (isYesterday) return `Ayer — ${formatted}`;
      return formatted;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="history-wrapper">
      {/* Top Header */}
      <div className="history-header" style={{ marginBottom: '1.25rem' }}>
        <div className="history-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: '#e0f2fe',
                color: '#0369a1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <h2>Bitácora Cronológica de Auditoría</h2>
          </div>
          <p className="font-serif">
            Registro cronológico de trazabilidad operativa, cambios de estado y eventos del sistema.
          </p>
        </div>
      </div>

      {/* Metrics Bar */}
      <AuditStatsBar stats={stats} />

      {/* Filter and Search Bar */}
      <AuditFilters
        search={search}
        onSearchChange={setSearch}
        selectedAction={selectedAction}
        onActionChange={setSelectedAction}
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
        projects={projects}
        onRefresh={handleManualRefresh}
        isLoading={isLoading}
        justUpdated={justUpdated}
      />

      {/* Chronological Timeline */}
      {isLoading && entries.length === 0 ? (
        <div
          className="audit-card"
          style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--color-stone)'
          }}
        >
          <Loader2 size={24} className="spin" style={{ margin: '0 auto 0.75rem auto', color: 'var(--color-notion-blue)' }} />
          <p style={{ fontSize: '0.875rem' }}>Cargando bitácora de eventos...</p>
        </div>
      ) : Object.keys(groupedEntries).length === 0 ? (
        <div
          className="audit-card"
          style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--color-stone)'
          }}
        >
          <AlertCircle size={32} style={{ margin: '0 auto 0.75rem auto', color: 'var(--color-stone)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-ink-black)' }}>
            No se encontraron eventos registrados
          </h3>
          <p style={{ fontSize: '0.875rem' }}>
            No hay operaciones que coincidan con los filtros seleccionados o no se han emitido eventos.
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Continuous vertical line for the whole timeline */}
          <div className="audit-timeline-line" />

          {Object.entries(groupedEntries).map(([dateKey, groupEntries]) => (
            <div key={dateKey} style={{ marginBottom: '2rem' }}>
              {/* Date Section Header */}
              <div className="audit-date-badge">
                <Calendar size={13} color="var(--color-notion-blue)" />
                <span>{formatDateHeader(dateKey)}</span>
                <span className="audit-date-counter">
                  {groupEntries.length}
                </span>
              </div>

              {/* Items in this date */}
              <div>
                {groupEntries.map(entry => (
                  <AuditTimelineItem key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
