import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';

import { ref } from 'vue';
import { useStore } from 'vuex';

const useProceso = () => {
    const store = useStore();
    const toast = useToast();

    const filtros = ref({
        global: {
            value: null,
            matchMode: FilterMatchMode.CONTAINS
        }
    });

    const tablaCompaniasSat = ref([]);

    // -------------------------------------------------------------------------
    // CARGAR EMPRESAS SAT
    // -------------------------------------------------------------------------

    const handleCargarCompaniasSat = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/operacion_sat/companias_descarga_cfdi_sat`
        });

        if (res.estatus === 200) {
            tablaCompaniasSat.value = res.datos?.companias ?? [];
        } else {
            tablaCompaniasSat.value = [];

            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }
    };

    // -------------------------------------------------------------------------
    // LIMPIAR FILTRO
    // -------------------------------------------------------------------------

    const handleLimpiarFiltro = () => {
        filtros.value.global.value = null;
    };

    // -------------------------------------------------------------------------
    // INICIAL
    // -------------------------------------------------------------------------

    const handleInit = async () => {
        await handleCargarCompaniasSat();
    };

    handleInit();

    return {
        tablaCompaniasSat,
        filtros,

        handleLimpiarFiltro
    };
};

export default useProceso;
