export const STATUS_DEFINITIONS = {
    analisis: {
        id: 'analisis',
        label: 'Análisis',
        group: 'etapa',
        color: 'var(--color-notion-blue)',
        badgeBg: 'var(--color-sky-tint)',
        badgeBorder: '#c2e0fc',
        description: 'Levantamiento de requisitos y viabilidad'
    },
    diseno: {
        id: 'diseno',
        label: 'Diseño',
        group: 'etapa',
        color: '#6f42c1',
        badgeBg: '#f3e8ff',
        badgeBorder: '#e9d5ff',
        description: 'Modelado de datos, arquitectura y prototipado'
    },
    desarrollo: {
        id: 'desarrollo',
        label: 'Desarrollo',
        group: 'etapa',
        color: '#097fe8',
        badgeBg: '#e0f2fe',
        badgeBorder: '#bae6fd',
        description: 'Construcción de pipelines, ETLs y lógica de negocio'
    },
    pruebas: {
        id: 'pruebas',
        label: 'Pruebas',
        group: 'etapa',
        color: '#8b5cf6',
        badgeBg: '#ede9fe',
        badgeBorder: '#ddd6fe',
        description: 'Validación de calidad, carga y consistencia'
    },
    despliegue: {
        id: 'despliegue',
        label: 'Despliegue',
        group: 'etapa',
        color: '#0284c7',
        badgeBg: '#e0f2fe',
        badgeBorder: '#7dd3fc',
        description: 'Pase a entornos pre-productivos o productivos'
    },
    capacitacion: {
        id: 'capacitacion',
        label: 'Capacitación',
        group: 'etapa',
        color: '#0d9488',
        badgeBg: '#ccfbf1',
        badgeBorder: '#99f6e4',
        description: 'Transferencia técnica y formación a usuarios'
    },
    pendiente_revision: {
        id: 'pendiente_revision',
        label: 'Pendiente por revisión',
        group: 'alerta',
        color: 'var(--color-saffron)',
        badgeBg: '#fef3c7',
        badgeBorder: '#fde68a',
        description: 'Esperando validación de arquitectura o stakeholder'
    },
    retrasado: {
        id: 'retrasado',
        label: 'Retrasado',
        group: 'alerta',
        color: 'var(--color-vermillion)',
        badgeBg: '#fee2e2',
        badgeBorder: '#fca5a5',
        description: 'Desfase con respecto a la fecha tentativa'
    },
    pausado: {
        id: 'pausado',
        label: 'Pausado',
        group: 'alerta',
        color: 'var(--color-mocha)',
        badgeBg: '#f5ebe6',
        badgeBorder: '#e7d3c7',
        description: 'Suspendido temporalmente por motivo explícito'
    },
    terminado_parcialmente: {
        id: 'terminado_parcialmente',
        label: 'Terminado parcialmente',
        group: 'finalizacion',
        color: '#ca8a04',
        badgeBg: '#fef9c3',
        badgeBorder: '#fef08a',
        description: 'Hito clave cumplido con alcance pendiente'
    },
    terminado: {
        id: 'terminado',
        label: 'Terminado',
        group: 'finalizacion',
        color: '#16a34a',
        badgeBg: '#dcfce7',
        badgeBorder: '#bbf7d0',
        description: 'Desarrollo completado pendiente de entrega formal'
    },
    entregado: {
        id: 'entregado',
        label: 'Entregado',
        group: 'finalizacion',
        color: '#047857',
        badgeBg: '#d1fae5',
        badgeBorder: '#6ee7b7',
        description: 'Formalmente entregado y en operación'
    }
};
export const MAINTENANCE_TYPE_DEFINITIONS = {
    correctivo: {
        id: 'correctivo',
        label: 'Correctivo (Bugfix)',
        badgeColor: 'var(--color-coral)',
        description: 'Solución de errores, fallos o bugs en producción'
    },
    evolutivo: {
        id: 'evolutivo',
        label: 'Evolutivo (Mejora)',
        badgeColor: 'var(--color-notion-blue)',
        description: 'Ajuste de alcance, nuevas métricas o funcionalidades'
    },
    soporte: {
        id: 'soporte',
        label: 'Soporte Operativo',
        badgeColor: 'var(--color-mocha)',
        description: 'Acompañamiento, extracción ad-hoc o mantenimiento preventivo'
    },
    seguridad: {
        id: 'seguridad',
        label: 'Seguridad / Parche',
        badgeColor: 'var(--color-saffron)',
        description: 'Actualización de certificados, parches o control de accesos'
    }
};
//# sourceMappingURL=project.js.map