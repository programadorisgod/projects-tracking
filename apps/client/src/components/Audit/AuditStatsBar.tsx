import React from 'react';
import type { AuditStats } from '@app/shared';
import { History, ArrowRightLeft, PlusCircle, Wrench } from 'lucide-react';

interface AuditStatsBarProps {
  stats: AuditStats;
}

export const AuditStatsBar: React.FC<AuditStatsBarProps> = ({ stats }) => {
  return (
    <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
      <div className="stat-card">
        <div
          className="stat-icon-wrapper"
          style={{
            background: 'rgba(14, 165, 233, 0.15)',
            color: 'var(--color-notion-blue, #0284c7)',
            border: '1px solid rgba(14, 165, 233, 0.3)'
          }}
        >
          <History size={20} />
        </div>
        <div>
          <div className="stat-number">{stats.totalEvents}</div>
          <div className="stat-label">Total Eventos</div>
        </div>
      </div>

      <div className="stat-card">
        <div
          className="stat-icon-wrapper"
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--color-saffron, #f59e0b)',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}
        >
          <ArrowRightLeft size={20} />
        </div>
        <div>
          <div className="stat-number">{stats.statusChanges}</div>
          <div className="stat-label">Cambios de Estado</div>
        </div>
      </div>

      <div className="stat-card">
        <div
          className="stat-icon-wrapper"
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--color-success, #10b981)',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}
        >
          <PlusCircle size={20} />
        </div>
        <div>
          <div className="stat-number">{stats.creations}</div>
          <div className="stat-label">Proyectos Creados</div>
        </div>
      </div>

      <div className="stat-card">
        <div
          className="stat-icon-wrapper"
          style={{
            background: 'rgba(168, 85, 247, 0.15)',
            color: '#a855f7',
            border: '1px solid rgba(168, 85, 247, 0.3)'
          }}
        >
          <Wrench size={20} />
        </div>
        <div>
          <div className="stat-number">{stats.maintenances}</div>
          <div className="stat-label">Mantenimientos</div>
        </div>
      </div>
    </div>
  );
};
