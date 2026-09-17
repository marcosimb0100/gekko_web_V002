import { FilterMatchMode } from '@primevue/core/api';

import { useToast } from 'primevue/usetoast';

import { ref } from 'vue';

import { useStore } from 'vuex';

const useProceso = () => {
    // ============================================================
    // STORE / TOAST
    // ============================================================

    const store = useStore();

    const toast = useToast();

    // ============================================================
    // FILTROS
    // ============================================================

    const filtros = ref({
        global: {
            value: null,

            matchMode: FilterMatchMode.CONTAINS
        }
    });

    // ============================================================
    // TABLA
    // ============================================================

    const tablaParametros = ref([]);

    // ============================================================
    // ESTADOS
    // ============================================================

    const cargando = ref(false);

    // ============================================================
    // CARGAR PARÁMETROS
    // ============================================================

    const handleCargarParametros = async () => {
        cargando.value = true;

        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: '/parametros_dinamicos/'
            });

            if (res.estatus === 200) {
                tablaParametros.value = res.datos?.parametros ?? [];
            } else {
                tablaParametros.value = [];

                toast.add({
                    severity: 'error',

                    summary: 'Notificación',

                    detail: res.mensaje,

                    life: 3000
                });
            }
        } catch (error) {
            console.error('PARAMETROS DINAMICOS:', error);

            tablaParametros.value = [];

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: 'Ocurrió un error al consultar ' + 'los parámetros dinámicos.',

                life: 3000
            });
        } finally {
            cargando.value = false;
        }
    };

    // ============================================================
    // LIMPIAR FILTRO
    // ============================================================

    const handleLimpiarFiltro = () => {
        filtros.value.global.value = null;
    };

    // ============================================================
    // COPIAR PARÁMETRO
    // ============================================================

    const handleCopiarParametro = async (parametro) => {
        try {
            if (!parametro) {
                return;
            }

            await navigator.clipboard.writeText(parametro);

            toast.add({
                severity: 'success',

                summary: 'Parámetro copiado',

                detail: `${parametro} se copió al portapapeles.`,

                life: 2000
            });
        } catch (error) {
            console.error('ERROR AL COPIAR PARÁMETRO:', error);

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: 'No fue posible copiar el parámetro.',

                life: 3000
            });
        }
    };

    // ============================================================
    // INICIAL
    // ============================================================

    const handleInit = async () => {
        await handleCargarParametros();
    };

    handleInit();

    // ============================================================
    // RETURN
    // ============================================================

    return {
        tablaParametros,

        filtros,

        cargando,

        handleLimpiarFiltro,
        handleCopiarParametro
    };
};

export default useProceso;
