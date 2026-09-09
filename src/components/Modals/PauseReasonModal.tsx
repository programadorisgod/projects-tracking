import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X, PauseCircle } from 'lucide-react';

interface PauseReasonModalProps {
  isOpen: boolean;
  projectName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const PauseReasonModal: React.FC<PauseReasonModalProps> = ({
  isOpen,
  projectName,
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setReason('');
    setError('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Por favor describe la razón por la que se pausa el proyecto.');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PauseCircle size={18} color="var(--color-mocha)" />
            <h2 className="modal-title">Pausar Proyecto</h2>
          </div>
          <button className="btn-icon btn-ghost" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '13.5px', color: 'var(--color-charcoal)', marginBottom: '12px' }}>
              Estás pausando <strong>"{projectName}"</strong>. Especifica el motivo de la suspensión:
            </p>

            <div className="form-group">
              <label className="form-label">Motivo de Pausa *</label>
              <textarea
                className="textarea"
                autoFocus
                placeholder="Ej. Bloqueo por falta de accesos a base de datos de auditoría, espera de insumos del proveedor..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
              {error && <span style={{ color: 'var(--color-vermillion)', fontSize: '12px' }}>{error}</span>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--color-mocha)', borderColor: 'var(--color-mocha)' }}>
              Confirmar Pausa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
