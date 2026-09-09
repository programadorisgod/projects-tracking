import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { Project, ProjectCategory, ProjectStatus } from '../../types/project';
import { X, AlertCircle } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  projectToEdit?: Project | null;
  defaultStatus?: ProjectStatus;
  onClose: () => void;
  onSave: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => void;
}

const COMMON_AREAS = [
  'Urgencias',
  'Facturación & Cuentas Médicas',
  'Cirugía & Quirófanos',
  'UCI & Cuidado Crítico',
  'Farmacia Central',
  'Hospitalización',
  'Radiología & Imágenes',
  'Laboratorio Clínico',
  'Recursos Humanos & Nómina',
  'Tesorería & Contabilidad',
  'Calidad & Auditoría Médica',
  'Tecnología & Ciberseguridad'
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  projectToEdit,
  defaultStatus = 'analisis',
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>(defaultStatus);
  const [category, setCategory] = useState<ProjectCategory>('asistencial');
  const [area, setArea] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [actualDeliveryDate, setActualDeliveryDate] = useState('');
  const [pauseReason, setPauseReason] = useState('');
  const [location, setLocation] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [assignee, setAssignee] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name || '');
      setDescription(projectToEdit.description || '');
      setStatus(projectToEdit.status || 'analisis');
      setCategory(projectToEdit.category || 'asistencial');
      setArea(projectToEdit.area || '');
      setTagsInput(projectToEdit.tags ? projectToEdit.tags.join(', ') : '');
      setStartDate(projectToEdit.startDate || '');
      setEstimatedDeliveryDate(projectToEdit.estimatedDeliveryDate || '');
      setActualDeliveryDate(projectToEdit.actualDeliveryDate || '');
      setPauseReason(projectToEdit.pauseReason || '');
      setLocation(projectToEdit.location || '');
      setGithubUrl(projectToEdit.githubUrl || '');
      setAssignee(projectToEdit.assignee || '');
    } else {
      setName('');
      setDescription('');
      setStatus(defaultStatus || 'analisis');
      setCategory('asistencial');
      setArea('');
      setTagsInput('Big Data, ETL');
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEstimatedDeliveryDate('');
      setActualDeliveryDate('');
      setPauseReason('');
      setLocation('');
      setGithubUrl('');
      setAssignee('');
    }
    setErrors({});
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre del proyecto es obligatorio';
    }

    if (!projectToEdit && !startDate) {
      newErrors.startDate = 'La fecha de inicio es requerida para proyectos nuevos';
    }

    if (status === 'pausado' && !pauseReason.trim()) {
      newErrors.pauseReason = 'Debe indicar el motivo por el cual el proyecto se encuentra pausado';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    onSave({
      name: name.trim(),
      description: description.trim(),
      status,
      category,
      area: area.trim() || 'General',
      tags,
      startDate: startDate || new Date().toISOString().split('T')[0],
      estimatedDeliveryDate,
      actualDeliveryDate: actualDeliveryDate || undefined,
      pauseReason: status === 'pausado' ? pauseReason.trim() : undefined,
      location: location.trim(),
      githubUrl: githubUrl.trim(),
      assignee: assignee.trim() || 'Sin asignar'
    }, projectToEdit ? projectToEdit.id : undefined);

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {projectToEdit ? 'Editar Proyecto' : 'Nuevo Proyecto'}
          </h2>
          <button className="btn-icon btn-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            {/* Project Name */}
            <div className="form-group">
              <label className="form-label">Nombre del Proyecto *</label>
              <input
                type="text"
                className="input"
                placeholder="Ej. Ingesta de Datos HL7 y Monitoreo de Camas"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              {errors.name && <span style={{ color: 'var(--color-vermillion)', fontSize: '12px' }}>{errors.name}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Descripción del Objetivo</label>
              <textarea
                className="textarea"
                placeholder="Resumen del alcance, tecnologías y metas clave..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Status & Category row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Estado / Etapa Actual *</label>
                <select 
                  className="select"
                  value={status}
                  onChange={e => setStatus(e.target.value as ProjectStatus)}
                >
                  <optgroup label="Etapas de Desarrollo">
                    <option value="analisis">Análisis</option>
                    <option value="diseno">Diseño</option>
                    <option value="desarrollo">Desarrollo</option>
                    <option value="pruebas">Pruebas</option>
                    <option value="despliegue">Despliegue</option>
                    <option value="capacitacion">Capacitación</option>
                  </optgroup>
                  <optgroup label="Alertas y Bloqueos">
                    <option value="pendiente_revision">Pendiente por revisión</option>
                    <option value="retrasado">Retrasado</option>
                    <option value="pausado">Pausado</option>
                  </optgroup>
                  <optgroup label="Finalización">
                    <option value="terminado_parcialmente">Terminado parcialmente</option>
                    <option value="terminado">Terminado</option>
                    <option value="entregado">Entregado</option>
                  </optgroup>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Clasificación *</label>
                <select 
                  className="select"
                  value={category}
                  onChange={e => setCategory(e.target.value as ProjectCategory)}
                >
                  <option value="asistencial">Asistencial (Clínica / Pacientes)</option>
                  <option value="administrativo">Administrativo (Gestión / Finanzas)</option>
                </select>
              </div>
            </div>

            {/* If Paused -> Reason is required */}
            {status === 'pausado' && (
              <div className="form-group card-pause-box" style={{ padding: '12px', borderRadius: 'var(--radius-buttons)', marginBottom: '16px' }}>
                <label className="form-label card-pause-title" style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <AlertCircle size={14} />
                  Explicar por qué está pausado *
                </label>
                <textarea
                  className="textarea"
                  style={{ minHeight: '60px' }}
                  placeholder="Explica la causa: falta de accesos, dependencias con otro equipo, espera de infraestructura..."
                  value={pauseReason}
                  onChange={e => setPauseReason(e.target.value)}
                />
                {errors.pauseReason && (
                  <span style={{ color: 'var(--color-vermillion)', fontSize: '12px' }}>{errors.pauseReason}</span>
                )}
              </div>
            )}

            {/* Area & Tags row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Área Solicitante / Dueña *</label>
                <input
                  type="text"
                  list="areas-list"
                  className="input"
                  placeholder="Ej. Urgencias, Facturación..."
                  value={area}
                  onChange={e => setArea(e.target.value)}
                />
                <datalist id="areas-list">
                  {COMMON_AREAS.map(a => <option key={a} value={a} />)}
                </datalist>
              </div>

              <div className="form-group">
                <label className="form-label">Tags / Etiquetas (separadas por coma)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Big Data, Spark, Kafka, ML, ETL..."
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                />
              </div>
            </div>

            {/* Dates row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">
                  Fecha de Inicio {projectToEdit ? '' : '(Proyectos Nuevos) *'}
                </label>
                <input
                  type="date"
                  className="input"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                {errors.startDate && <span style={{ color: 'var(--color-vermillion)', fontSize: '12px' }}>{errors.startDate}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Fecha Tentativa de Entrega</label>
                <input
                  type="date"
                  className="input"
                  value={estimatedDeliveryDate}
                  onChange={e => setEstimatedDeliveryDate(e.target.value)}
                />
              </div>
            </div>

            {/* If delivered or finished, allow setting real delivery date */}
            {['entregado', 'terminado'].includes(status) && (
              <div className="form-group">
                <label className="form-label">Fecha Real de Entrega</label>
                <input
                  type="date"
                  className="input"
                  value={actualDeliveryDate}
                  onChange={e => setActualDeliveryDate(e.target.value)}
                />
              </div>
            )}

            {/* Location & GitHub */}
            <div className="form-group">
              <label className="form-label">Ubicación (Servidor / Host / Ruta de Producción)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. Servidor BigData-01 / /opt/pipelines/urgencias"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>
              <span className="form-hint">Dónde se ejecuta o se almacena este proyecto</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Enlace a GitHub / Repositorio</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://github.com/empresa/proyecto"
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">A quién se le asignó (Responsable)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. Jerson Tapias / Equipo Big Data"
                  value={assignee}
                  onChange={e => setAssignee(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {projectToEdit ? 'Guardar Cambios' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
