import React, { useState } from 'react';
import type { Project } from '../../types/project';
import { X, Upload, GitMerge, AlertTriangle, FileCheck } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  importedProjects: Project[];
  fileName: string;
  currentCount: number;
  onClose: () => void;
  onConfirm: (mode: 'merge' | 'replace') => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  importedProjects,
  fileName,
  currentCount,
  onClose,
  onConfirm
}) => {
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: 28, 
              height: 28, 
              borderRadius: 'var(--radius-buttons)', 
              background: 'var(--color-sky-tint)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--color-notion-blue)'
            }}>
              <Upload size={16} />
            </div>
            <h2 className="modal-title" style={{ fontSize: '17px' }}>Importar Proyectos</h2>
          </div>
          <button className="btn-icon btn-ghost" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* File summary pill */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            background: 'var(--color-bg-subtle)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: 'var(--radius-buttons)', 
            padding: '10px 14px', 
            marginBottom: '18px' 
          }}>
            <FileCheck size={20} color="var(--color-success)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
              <div>Archivo: <strong style={{ color: 'var(--color-ink-black)' }}>{fileName || 'datos.json'}</strong></div>
              <div style={{ color: 'var(--color-stone)', fontSize: '12px' }}>
                Se validaron <strong>{importedProjects.length} proyectos</strong> listos para importar.
              </div>
            </div>
          </div>

          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '10px' }}>
            ¿Cómo deseas aplicar estos datos a tu entorno?
          </p>

          {/* Option 1: Merge (Recommended) */}
          <div 
            onClick={() => setMode('merge')}
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-cards)',
              border: `2px solid ${mode === 'merge' ? 'var(--color-notion-blue)' : 'var(--border-subtle)'}`,
              background: mode === 'merge' ? 'var(--color-sky-tint)' : 'var(--color-bg-card)',
              cursor: 'pointer',
              marginBottom: '10px',
              transition: 'all 0.15s ease',
              display: 'flex',
              gap: '12px'
            }}
          >
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: `2px solid ${mode === 'merge' ? 'var(--color-notion-blue)' : 'var(--color-stone)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '2px',
              flexShrink: 0
            }}>
              {mode === 'merge' && (
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-notion-blue)' }} />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13.5px', color: 'var(--color-ink-black)' }}>
                <GitMerge size={14} color="var(--color-notion-blue)" />
                <span>Fusionar con los actuales</span>
                <span className="badge badge-asistencial" style={{ fontSize: '10.5px', padding: '1px 6px' }}>Recomendado</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-graphite)', marginTop: '4px', lineHeight: '1.4' }}>
                Conserva los <strong>{currentCount} proyectos</strong> existentes y agrega los del archivo. Si algún proyecto coincide en ID, se actualizarán sus campos.
              </p>
            </div>
          </div>

          {/* Option 2: Replace All */}
          <div 
            onClick={() => setMode('replace')}
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-cards)',
              border: `2px solid ${mode === 'replace' ? 'var(--color-vermillion)' : 'var(--border-subtle)'}`,
              background: mode === 'replace' ? 'rgba(239, 68, 68, 0.08)' : 'var(--color-bg-card)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              gap: '12px'
            }}
          >
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: `2px solid ${mode === 'replace' ? 'var(--color-vermillion)' : 'var(--color-stone)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '2px',
              flexShrink: 0
            }}>
              {mode === 'replace' && (
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-vermillion)' }} />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13.5px', color: 'var(--color-ink-black)' }}>
                <AlertTriangle size={14} color="var(--color-vermillion)" />
                <span>Reemplazar todo el catálogo</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-graphite)', marginTop: '4px', lineHeight: '1.4' }}>
                Sobrescribe por completo tus proyectos actuales. Solo quedarán los <strong>{importedProjects.length} proyectos</strong> que contiene este archivo.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancelar
          </button>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            style={mode === 'replace' ? { backgroundColor: 'var(--color-vermillion)', borderColor: 'var(--color-vermillion)' } : {}}
            onClick={() => onConfirm(mode)}
          >
            {mode === 'merge' ? 'Confirmar Fusión' : 'Reemplazar Todo'}
          </button>
        </div>
      </div>
    </div>
  );
};
