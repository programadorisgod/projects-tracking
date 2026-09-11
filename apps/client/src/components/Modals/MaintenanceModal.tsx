import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { Project, MaintenanceType, ProjectStatus } from '../../types/project';
import { MAINTENANCE_TYPE_DEFINITIONS } from '../../types/project';
import { 
  X, 
  Wrench, 
  GitMerge, 
  Bug, 
  Sparkles, 
  HelpCircle, 
  ShieldCheck, 
  Building2, 
  Server, 
  User, 
  Calendar 
} from 'lucide-react';
import { api } from '../../services/api';

interface MaintenanceModalProps {
  isOpen: boolean;
  parentProject: Project | null;
  onClose: () => void;
  onSave: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  parentProject,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('correctivo');
  const [maintenanceScope, setMaintenanceScope] = useState('');
  const [assignee, setAssignee] = useState('');
  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [initialStatus, setInitialStatus] = useState<ProjectStatus>('desarrollo');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    let mounted = true;
    api.getUsers().then(users => {
      if (mounted) setAvailableUsers(users);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (parentProject && isOpen) {
      setName(`Soporte: ${parentProject.name}`);
      setMaintenanceType('correctivo');
      setMaintenanceScope('');
      setAssignee('');
      setInitialStatus('desarrollo');
      setEstimatedDeliveryDate('');
      setErrors({});
    }
  }, [parentProject, isOpen]);

  if (!isOpen || !parentProject) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'El título del soporte o mantenimiento es obligatorio';
    }

    if (!maintenanceScope.trim()) {
      newErrors.maintenanceScope = 'Debes especificar qué se está reparando o ajustando';
    }

    if (!assignee.trim()) {
      newErrors.assignee = 'Asigna un responsable para este mantenimiento';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    onSave({
      name: name.trim(),
      description: `Mantenimiento sobre [${parentProject.name}]: ${maintenanceScope.trim()}`,
      status: initialStatus,
      category: parentProject.category,
      area: parentProject.area,
      tags: [...(parentProject.tags || []), 'Soporte', maintenanceType],
      startDate: today,
      estimatedDeliveryDate: estimatedDeliveryDate || today,
      location: parentProject.location,
      githubUrl: parentProject.githubUrl,
      assignee: assignee.trim(),
      projectType: 'mantenimiento',
      parentProjectId: parentProject.id,
      parentProjectName: parentProject.name,
      maintenanceType,
      maintenanceScope: maintenanceScope.trim()
    });

    onClose();
  };

  const getTypeIcon = (type: MaintenanceType) => {
    switch (type) {
      case 'correctivo': return <Bug size={14} color="var(--color-coral)" />;
      case 'evolutivo': return <Sparkles size={14} color="var(--color-notion-blue)" />;
      case 'soporte': return <HelpCircle size={14} color="var(--color-mocha)" />;
      case 'seguridad': return <ShieldCheck size={14} color="var(--color-saffron)" />;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: 28, 
              height: 28, 
              borderRadius: 'var(--radius-buttons)', 
              background: 'rgba(239, 68, 68, 0.12)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--color-coral)'
            }}>
              <Wrench size={16} />
            </div>
            <h2 className="modal-title" style={{ fontSize: '17px' }}>Solicitud de Soporte / Mantenimiento</h2>
          </div>
          <button className="btn-icon btn-ghost" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            {/* Parent Project Reference Banner */}
            <div style={{
              background: 'var(--color-bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-buttons)',
              padding: '12px 14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-slate)', fontWeight: 600 }}>
                <GitMerge size={12} color="var(--color-notion-blue)" />
                Iniciativa Base Referenciada
              </div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-ink-black)', marginTop: '2px' }}>
                {parentProject.name}
              </div>
              
              {/* Inherited Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span className="card-area-badge" style={{ fontSize: '11px' }}>
                  <Building2 size={11} />
                  {parentProject.area}
                </span>
                <span className={`badge ${parentProject.category === 'asistencial' ? 'badge-asistencial' : 'badge-admin'}`} style={{ fontSize: '11px' }}>
                  {parentProject.category === 'asistencial' ? 'Asistencial' : 'Administrativo'}
                </span>
                {parentProject.location && (
                  <span className="modal-code-snippet" style={{ fontSize: '11px', padding: '2px 6px' }}>
                    <Server size={10} style={{ display: 'inline', marginRight: 4 }} />
                    {parentProject.location}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-stone)', marginTop: '6px' }}>
                ℹ️ El proyecto original permanece intacto en <strong>Histórico</strong>. Esta acción abrirá una iniciativa activa de mantenimiento en el <strong>Tablero Kanban</strong>.
              </div>
            </div>

            {/* Maintenance Name */}
            <div className="form-group">
              <label className="form-label">Título del Mantenimiento *</label>
              <input
                type="text"
                className="input"
                placeholder="Ej. Soporte: Ajuste en carga nocturna de urgencias"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              {errors.name && <span style={{ color: 'var(--color-vermillion)', fontSize: '12px' }}>{errors.name}</span>}
            </div>

            {/* Type Selection Grid */}
            <div className="form-group">
              <label className="form-label">Tipo de Solicitud *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {(Object.keys(MAINTENANCE_TYPE_DEFINITIONS) as MaintenanceType[]).map((typeKey) => {
                  const cfg = MAINTENANCE_TYPE_DEFINITIONS[typeKey];
                  const isSelected = maintenanceType === typeKey;
                  return (
                    <div
                      key={typeKey}
                      onClick={() => setMaintenanceType(typeKey)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-buttons)',
                        border: `1.5px solid ${isSelected ? cfg.badgeColor : 'var(--border-subtle)'}`,
                        background: isSelected ? 'var(--bg-hover)' : 'var(--color-bg-card)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {getTypeIcon(typeKey)}
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--color-ink-black)' }}>
                          {cfg.label}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--color-stone)' }}>
                          {cfg.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* What is being repaired / changed */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wrench size={12} color="var(--color-coral)" />
                ¿Qué se está reparando o ajustando? (Alcance) *
              </label>
              <textarea
                className="textarea"
                style={{ minHeight: '70px' }}
                placeholder="Describe el fallo, incidencia o cambio solicitado (ej. El pipeline falló por formato de fecha en HL7 o se requiere un filtro de médicos especialistas)..."
                value={maintenanceScope}
                onChange={e => setMaintenanceScope(e.target.value)}
              />
              {errors.maintenanceScope && (
                <span style={{ color: 'var(--color-vermillion)', fontSize: '12px' }}>{errors.maintenanceScope}</span>
              )}
            </div>

            {/* Row: Assignee & Stage & Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={12} />
                  Responsable del Soporte *
                </label>
                <select
                  className="select"
                  value={assignee}
                  onChange={e => setAssignee(e.target.value)}
                >
                  <option value="">Seleccionar responsable...</option>
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.name}>
                      {u.name} {u.email ? `(${u.email})` : ''}
                    </option>
                  ))}
                  {assignee && !availableUsers.some(u => u.name === assignee) && (
                    <option value={assignee}>{assignee}</option>
                  )}
                </select>
                {errors.assignee && (
                  <span style={{ color: 'var(--color-vermillion)', fontSize: '12px' }}>{errors.assignee}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  Fecha Estimada de Entrega
                </label>
                <input
                  type="date"
                  className="input"
                  value={estimatedDeliveryDate}
                  onChange={e => setEstimatedDeliveryDate(e.target.value)}
                />
              </div>
            </div>

            {/* Initial Stage */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Etapa de Ingreso al Kanban</label>
              <select
                className="select"
                value={initialStatus}
                onChange={e => setInitialStatus(e.target.value as ProjectStatus)}
              >
                <option value="desarrollo">Desarrollo (Construcción de fix o parche)</option>
                <option value="analisis">Análisis (Diagnóstico de causa raíz)</option>
                <option value="pruebas">Pruebas (Validación y control de calidad)</option>
                <option value="despliegue">Despliegue (Pase a producción)</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              <Wrench size={13} />
              <span>Abrir Soporte en Kanban</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
