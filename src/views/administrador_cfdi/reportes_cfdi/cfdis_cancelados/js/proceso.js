import { useToast } from 'primevue/usetoast';
import { computed, reactive, ref } from 'vue';
import { useStore } from 'vuex';

const getFechaInicialDefault = () => {
    const fecha = new Date();

    fecha.setDate(1);
    fecha.setHours(0, 0, 0, 0);

    return fecha;
};

const getFechaFinalDefault = () => {
    const fecha = new Date();

    fecha.setHours(23, 59, 59, 999);

    return fecha;
};

const frmFiltrosInit = () => ({
    empresa: '',
    fechaInicial: getFechaInicialDefault(),
    fechaFinal: getFechaFinalDefault()
});

const useProceso = () => {
    const store = useStore();
    const toast = useToast();

    const fechaActual = new Date();

    const frmFiltros = reactive(frmFiltrosInit());

    const catCompaniasSat = ref([]);
    const catCfdis = ref([]);
    const ctrlBuscar = ref('');

    // -------------------------------------------------------------------------
    // VALIDACIONES
    // -------------------------------------------------------------------------

    const fechaInicialValida = computed(() => {
        if (!frmFiltros.fechaInicial) {
            return false;
        }

        const fecha = new Date(frmFiltros.fechaInicial);

        const hoy = new Date();

        fecha.setHours(0, 0, 0, 0);

        hoy.setHours(0, 0, 0, 0);

        return fecha <= hoy;
    });

    const fechaFinalValida = computed(() => {
        if (!frmFiltros.fechaFinal) {
            return false;
        }

        const fechaFinal = new Date(frmFiltros.fechaFinal);

        const fechaInicial = new Date(frmFiltros.fechaInicial);

        const hoy = new Date();

        fechaFinal.setHours(0, 0, 0, 0);

        fechaInicial.setHours(0, 0, 0, 0);

        hoy.setHours(0, 0, 0, 0);

        if (fechaFinal > hoy) {
            return false;
        }

        if (fechaFinal < fechaInicial) {
            return false;
        }

        return true;
    });

    const botonConsultarDeshabilitado = computed(() => {
        if (!frmFiltros.empresa) {
            return true;
        }

        if (!fechaInicialValida.value) {
            return true;
        }

        if (!fechaFinalValida.value) {
            return true;
        }

        return false;
    });

    // -------------------------------------------------------------------------
    // BUSQUEDA LOCAL
    // -------------------------------------------------------------------------

    const catCfdisFiltrados = computed(() => {
        if (!ctrlBuscar.value.trim()) {
            return catCfdis.value;
        }

        const buscar = ctrlBuscar.value.trim().toLowerCase();

        return catCfdis.value.filter((item) => {
            return [item.uuid, item.emisorRfc, item.emisorNombre, item.receptorRfc, item.receptorNombre, item.serie, item.folio, item.tipoDeComprobante].filter(Boolean).join(' ').toLowerCase().includes(buscar);
        });
    });

    // -------------------------------------------------------------------------
    // CARGAR EMPRESAS
    // -------------------------------------------------------------------------

    const handleCargarCompaniasSat = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/operacion_sat/companias_descarga_cfdi_sat`
        });

        if (res.estatus === 200) {
            catCompaniasSat.value = res.datos?.companias ?? [];
        } else {
            catCompaniasSat.value = [];

            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }
    };

    // -------------------------------------------------------------------------
    // FORMATO FECHA API
    // -------------------------------------------------------------------------

    const formatFechaLocal = (fecha) => {
        if (!fecha) {
            return null;
        }

        const pad = (n) => String(n).padStart(2, '0');

        const year = fecha.getFullYear();

        const month = pad(fecha.getMonth() + 1);

        const day = pad(fecha.getDate());

        return `${year}-${month}-${day}`;
    };

    // -------------------------------------------------------------------------
    // CONSULTAR
    // -------------------------------------------------------------------------

    const handleConsultar = async () => {
        if (botonConsultarDeshabilitado.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Complete correctamente los filtros.',
                life: 3000
            });

            return;
        }

        const payload = {
            rfc: frmFiltros.empresa,

            fechaInicial: formatFechaLocal(frmFiltros.fechaInicial),

            fechaFinal: formatFechaLocal(frmFiltros.fechaFinal)
        };

        const res = await store.dispatch('api/apiPostToken', {
            direccion: `/operacion_sat/cfdis_cancelados`,

            datosJson: payload
        });

        if (res.estatus !== 200) {
            catCfdis.value = [];

            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });

            return;
        }

        catCfdis.value = res.datos?.cfdis ?? [];

        toast.add({
            severity: 'success',
            summary: 'Notificación',
            detail: res.mensaje,
            life: 3000
        });
    };

    // -------------------------------------------------------------------------
    // LIMPIAR
    // -------------------------------------------------------------------------

    const handleCancelar = () => {
        Object.assign(frmFiltros, frmFiltrosInit());

        catCfdis.value = [];

        ctrlBuscar.value = '';
    };

    // -------------------------------------------------------------------------
    // MONEDA
    // -------------------------------------------------------------------------

    const handleFormatMX = (value) => {
        const num = Number(value || 0);

        return num.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // -------------------------------------------------------------------------
    // FECHA TABLA
    // -------------------------------------------------------------------------

    const handleFormatFecha = (fecha) => {
        if (!fecha) {
            return '';
        }

        return String(fecha).substring(0, 10);
    };

    // -------------------------------------------------------------------------
    // INIT
    // -------------------------------------------------------------------------

    const handleInit = async () => {
        await handleCargarCompaniasSat();
    };

    handleInit();

    return {
        frmFiltros,

        catCompaniasSat,

        fechaActual,

        catCfdis,
        catCfdisFiltrados,

        ctrlBuscar,

        fechaInicialValida,
        fechaFinalValida,

        botonConsultarDeshabilitado,

        handleConsultar,
        handleCancelar,

        handleFormatMX,
        handleFormatFecha
    };
};

export default useProceso;
