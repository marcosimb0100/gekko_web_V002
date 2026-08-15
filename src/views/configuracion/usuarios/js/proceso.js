import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { useStore } from 'vuex';

const useProceso = () => {

    const store = useStore();
    const toast = useToast();

    const tablasUsuarios = ref([
        { code: 'USR-001', name: 'Juan Pérez', category: 'Administrador', quantity: 10 },
        { code: 'USR-002', name: 'María López', category: 'Compras', quantity: 5 },
        { code: 'USR-003', name: 'Carlos Hernández', category: 'Contabilidad', quantity: 8 },
        { code: 'USR-004', name: 'Ana Martínez', category: 'Tesorería', quantity: 3 },
        { code: 'USR-005', name: 'Luis García', category: 'Almacén', quantity: 12 },

        { code: 'USR-001', name: 'Juan Pérez', category: 'Administrador', quantity: 10 },
        { code: 'USR-002', name: 'María López', category: 'Compras', quantity: 5 },
        { code: 'USR-003', name: 'Carlos Hernández', category: 'Contabilidad', quantity: 8 },
        { code: 'USR-004', name: 'Ana Martínez', category: 'Tesorería', quantity: 3 },
        { code: 'USR-005', name: 'Luis García', category: 'Almacén', quantity: 12 },

        { code: 'USR-001', name: 'Juan Pérez', category: 'Administrador', quantity: 10 },
        { code: 'USR-002', name: 'María López', category: 'Compras', quantity: 5 },
        { code: 'USR-003', name: 'Carlos Hernández', category: 'Contabilidad', quantity: 8 },
        { code: 'USR-004', name: 'Ana Martínez', category: 'Tesorería', quantity: 3 },
        { code: 'USR-005', name: 'Luis García', category: 'Almacén', quantity: 12 },

        { code: 'USR-001', name: 'Juan Pérez', category: 'Administrador', quantity: 10 },
        { code: 'USR-002', name: 'María López', category: 'Compras', quantity: 5 },
        { code: 'USR-003', name: 'Carlos Hernández', category: 'Contabilidad', quantity: 8 },
        { code: 'USR-004', name: 'Ana Martínez', category: 'Tesorería', quantity: 3 },
        { code: 'USR-005', name: 'Luis García', category: 'Almacén', quantity: 12 },

        { code: 'USR-001', name: 'Juan Pérez', category: 'Administrador', quantity: 10 },
        { code: 'USR-002', name: 'María López', category: 'Compras', quantity: 5 },
        { code: 'USR-003', name: 'Carlos Hernández', category: 'Contabilidad', quantity: 8 },
        { code: 'USR-004', name: 'Ana Martínez', category: 'Tesorería', quantity: 3 },
        { code: 'USR-005', name: 'Luis García', category: 'Almacén', quantity: 12 },

        { code: 'USR-001', name: 'Juan Pérez', category: 'Administrador', quantity: 10 },
        { code: 'USR-002', name: 'María López', category: 'Compras', quantity: 5 },
        { code: 'USR-003', name: 'Carlos Hernández', category: 'Contabilidad', quantity: 8 },
        { code: 'USR-004', name: 'Ana Martínez', category: 'Tesorería', quantity: 3 },
        { code: 'USR-005', name: 'Luis García', category: 'Almacén', quantity: 12 }
    ]);

    const filtros = ref({
        global: {
            value: null,
            matchMode: FilterMatchMode.CONTAINS
        }
    });

    const handleLimpiarFiltro = () => {
        filtros.value.global.value = null;
    };

    return {

        tablasUsuarios,
        filtros,
        
        handleLimpiarFiltro

    };

};

export default useProceso;