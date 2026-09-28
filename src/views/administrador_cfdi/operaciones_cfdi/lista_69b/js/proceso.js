import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

import { computed, onMounted, ref } from 'vue';

import { useStore } from 'vuex';

const useProceso = () => {
    const store = useStore();

    const toast = useToast();

    const confirm = useConfirm();

    // ==========================================================
    // DATOS
    // ==========================================================

    const registros = ref([]);

    const totalRegistros = ref(0);

    const ultimaSincronizacion = ref(null);

    // ==========================================================
    // CARGA
    // ==========================================================

    const cargando = ref(false);

    const sincronizando = ref(false);

    // ==========================================================
    // PAGINACION
    // ==========================================================

    const pagina = ref(1);

    const filas = ref(20);

    const first = ref(0);

    // ==========================================================
    // FILTROS
    // ==========================================================

    const busqueda = ref('');

    const situacionSeleccionada = ref(null);

    const situaciones = ref([
        {
            nombre: 'Presunto',
            valor: 'Presunto'
        },
        {
            nombre: 'Definitivo',
            valor: 'Definitivo'
        },
        {
            nombre: 'Desvirtuado',
            valor: 'Desvirtuado'
        },
        {
            nombre: 'Sentencia Favorable',
            valor: 'Sentencia Favorable'
        }
    ]);

    let timeoutBusqueda = null;

    // ==========================================================
    // RESUMEN
    // ==========================================================

    const resumen = computed(() => {
        const datos = registros.value;

        return {
            presuntos: datos.filter((item) => item.situacion === 'Presunto').length,

            definitivos: datos.filter((item) => item.situacion === 'Definitivo').length,

            desvirtuados: datos.filter((item) => item.situacion === 'Desvirtuado').length,

            sentenciasFavorables: datos.filter((item) => item.situacion === 'Sentencia Favorable').length
        };
    });

    // ==========================================================
    // TOAST
    // ==========================================================

    const handleToast = (severity, detail, summary = 'Notificación') => {
        toast.add({
            severity: severity,

            summary: summary,

            detail: detail,

            life: 3500
        });
    };

    // ==========================================================
    // CONSULTAR LISTADO
    // ==========================================================

    const handleConsultar = async () => {
        if (cargando.value) {
            return;
        }

        cargando.value = true;

        try {
            const parametros = new URLSearchParams();

            parametros.append('pagina', pagina.value);

            parametros.append('limite', filas.value);

            if (busqueda.value && busqueda.value.trim()) {
                parametros.append('busqueda', busqueda.value.trim());
            }

            if (situacionSeleccionada.value) {
                parametros.append('situacion', situacionSeleccionada.value);
            }

            const direccion = `/sat_69b/listado?${parametros.toString()}`;

            const res = await store.dispatch('api/apiGetToken', {
                direccion: direccion
            });

            if (res.estatus !== 200) {
                registros.value = [];

                totalRegistros.value = 0;

                handleToast('error', res.mensaje || 'No fue posible consultar el listado SAT 69-B.');

                return;
            }

            registros.value = res.datos?.registros ?? [];

            totalRegistros.value = Number(res.datos?.total ?? 0);

            ultimaSincronizacion.value = res.datos?.sincronizacion ?? null;
        } catch (error) {
            console.error('Error handleConsultar:', error);

            registros.value = [];

            totalRegistros.value = 0;

            handleToast('error', 'Ocurrió un error al consultar el listado SAT 69-B.');
        } finally {
            cargando.value = false;
        }
    };

    // ==========================================================
    // CONFIRMAR SINCRONIZACION
    // ==========================================================

    const handleConfirmarSincronizacion = () => {
        confirm.require({
            header: 'Actualizar listado SAT 69-B',

            message: 'Se descargará nuevamente el listado oficial ' + 'publicado por el SAT y se actualizará ' + 'la información almacenada en Gekko.',

            icon: 'pi pi-cloud-download',

            rejectLabel: 'Cancelar',

            acceptLabel: 'Actualizar',

            rejectClass: 'p-button-secondary p-button-outlined',

            accept: async () => {
                await handleSincronizar();
            }
        });
    };

    // ==========================================================
    // SINCRONIZAR
    // ==========================================================

    const handleSincronizar = async () => {
        if (sincronizando.value) {
            return;
        }

        sincronizando.value = true;

        try {
            const res = await store.dispatch('api/apiPostToken', {
                direccion: '/sat_69b/sincronizar',

                datosJson: {}
            });

            if (res.estatus !== 200) {
                handleToast('error', res.mensaje || 'No fue posible actualizar el listado SAT 69-B.');

                return;
            }

            handleToast('success', res.mensaje || 'Listado SAT 69-B actualizado correctamente.');

            // ----------------------------------------------
            // REGRESAR A PRIMERA PAGINA
            // ----------------------------------------------

            pagina.value = 1;

            first.value = 0;

            // ----------------------------------------------
            // RECARGAR TABLA
            // ----------------------------------------------

            await handleConsultar();
        } catch (error) {
            console.error('Error handleSincronizar:', error);

            handleToast('error', 'Ocurrió un error al descargar ' + 'la información del SAT.');
        } finally {
            sincronizando.value = false;
        }
    };

    // ==========================================================
    // PAGINACION
    // ==========================================================

    const handlePagina = async (event) => {
        first.value = event.first;

        filas.value = event.rows;

        pagina.value = event.page + 1;

        await handleConsultar();
    };

    // ==========================================================
    // BUSQUEDA
    // ==========================================================

    const handleBuscar = () => {
        clearTimeout(timeoutBusqueda);

        timeoutBusqueda = setTimeout(async () => {
            pagina.value = 1;

            first.value = 0;

            await handleConsultar();
        }, 500);
    };

    // ==========================================================
    // CAMBIAR SITUACION
    // ==========================================================

    const handleCambiarSituacion = async () => {
        pagina.value = 1;

        first.value = 0;

        await handleConsultar();
    };

    // ==========================================================
    // LIMPIAR FILTROS
    // ==========================================================

    const handleLimpiarFiltros = async () => {
        busqueda.value = '';

        situacionSeleccionada.value = null;

        pagina.value = 1;

        first.value = 0;

        await handleConsultar();
    };

    // ==========================================================
    // FORMATO NUMERO
    // ==========================================================

    const handleNumero = (numero) => {
        return Number(numero ?? 0).toLocaleString('es-MX');
    };

    // ==========================================================
    // FORMATO FECHA
    // ==========================================================

    const handleFecha = (fecha) => {
        if (!fecha) {
            return '-';
        }

        const date = new Date(fecha);

        if (Number.isNaN(date.getTime())) {
            return fecha;
        }

        return date.toLocaleString('es-MX', {
            day: '2-digit',

            month: '2-digit',

            year: 'numeric',

            hour: '2-digit',

            minute: '2-digit'
        });
    };

    // ==========================================================
    // SEVERIDAD SITUACION
    // ==========================================================

    const handleSeveridad = (situacion) => {
        switch (situacion) {
            case 'Definitivo':
                return 'danger';

            case 'Presunto':
                return 'warn';

            case 'Desvirtuado':
                return 'success';

            case 'Sentencia Favorable':
                return 'info';

            default:
                return 'secondary';
        }
    };

    // ==========================================================
    // INICIO
    // ==========================================================

    onMounted(async () => {
        await handleConsultar();
    });

    // ==========================================================
    // RETURN
    // ==========================================================

    return {
        // DATOS

        registros,

        totalRegistros,

        ultimaSincronizacion,

        // CARGA

        cargando,

        sincronizando,

        // PAGINACION

        pagina,

        filas,

        first,

        // FILTROS

        busqueda,

        situacionSeleccionada,

        situaciones,

        // RESUMEN

        resumen,

        // METODOS

        handleConsultar,

        handleConfirmarSincronizacion,

        handleSincronizar,

        handlePagina,

        handleBuscar,

        handleCambiarSituacion,

        handleLimpiarFiltros,

        handleNumero,

        handleFecha,

        handleSeveridad
    };
};

export default useProceso;
