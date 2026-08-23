import { useToast } from 'primevue/usetoast';

import { computed, reactive, ref } from 'vue';

import { useStore } from 'vuex';

const getFechaInicialDefault = () => {
    const fecha = new Date();

    fecha.setDate(fecha.getDate() - 2);

    fecha.setHours(0, 0, 0, 0);

    return fecha;
};

const getFechaFinalDefault = () => {
    return new Date();
};

const frmSolicitudSatInit = () => ({
    empresa: '',
    tipo: 'todos',
    fecha_inicial: getFechaInicialDefault(),
    fecha_final: getFechaFinalDefault()
});

const useProceso = () => {
    const store = useStore();
    const toast = useToast();

    const fechaActual = new Date();

    const frmSolicitudSat = reactive(frmSolicitudSatInit());

    const catCompaniasSat = ref([]);

    const tipos = [
        {
            id: 'todos',
            descripcion: 'Todos'
        },
        {
            id: 'vigentes',
            descripcion: 'Vigentes'
        },
        {
            id: 'cancelados',
            descripcion: 'Cancelados'
        }
    ];

    // -------------------------------------------------------------------------
    // CARGAR EMPRESAS
    // -------------------------------------------------------------------------

    const handleCargarCompanias = async () => {
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
    // VALIDACIONES
    // -------------------------------------------------------------------------

    const empresaValida = computed(() => {
        if (!frmSolicitudSat.empresa) {
            return true;
        }

        return true;
    });

    const fechaInicialValida = computed(() => {
        if (!frmSolicitudSat.fecha_inicial) {
            return true;
        }

        return frmSolicitudSat.fecha_inicial <= fechaActual;
    });

    const fechaFinalValida = computed(() => {
        if (!frmSolicitudSat.fecha_final) {
            return true;
        }

        if (frmSolicitudSat.fecha_final > fechaActual) {
            return false;
        }

        if (frmSolicitudSat.fecha_inicial && frmSolicitudSat.fecha_final < frmSolicitudSat.fecha_inicial) {
            return false;
        }

        return true;
    });

    const botonSolicitarDeshabilitado = computed(() => {
        if (!frmSolicitudSat.empresa) {
            return true;
        }

        if (!frmSolicitudSat.fecha_inicial) {
            return true;
        }

        if (!frmSolicitudSat.fecha_final) {
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
    // VALIDAR FECHA INICIAL
    // -------------------------------------------------------------------------

    const handleValidarFechaInicial = () => {
        if (!frmSolicitudSat.fecha_inicial) {
            return;
        }

        const ahora = new Date();

        if (frmSolicitudSat.fecha_inicial > ahora) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'No puedes seleccionar una fecha mayor a la actual.',
                life: 3000
            });

            frmSolicitudSat.fecha_inicial = getFechaInicialDefault();

            return;
        }

        if (frmSolicitudSat.fecha_final && frmSolicitudSat.fecha_inicial > frmSolicitudSat.fecha_final) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'La fecha inicial no puede ser mayor a la fecha final.',
                life: 3000
            });

            frmSolicitudSat.fecha_inicial = getFechaInicialDefault();
        }
    };

    // -------------------------------------------------------------------------
    // VALIDAR FECHA FINAL
    // -------------------------------------------------------------------------

    const handleValidarFechaFinal = () => {
        if (!frmSolicitudSat.fecha_final) {
            return;
        }

        const ahora = new Date();

        if (frmSolicitudSat.fecha_final > ahora) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'No puedes seleccionar una fecha mayor a la actual.',
                life: 3000
            });

            frmSolicitudSat.fecha_final = getFechaFinalDefault();

            return;
        }

        if (frmSolicitudSat.fecha_inicial && frmSolicitudSat.fecha_final < frmSolicitudSat.fecha_inicial) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'La fecha final no puede ser menor a la fecha inicial.',
                life: 3000
            });

            frmSolicitudSat.fecha_final = getFechaFinalDefault();
        }
    };

    // -------------------------------------------------------------------------
    // FORMATO FECHA
    // -------------------------------------------------------------------------

    const formatFechaLocal = (fecha) => {
        if (!fecha) {
            return null;
        }

        const pad = (n) => String(n).padStart(2, '0');

        const year = fecha.getFullYear();

        const month = pad(fecha.getMonth() + 1);

        const day = pad(fecha.getDate());

        const hours = pad(fecha.getHours());

        const minutes = pad(fecha.getMinutes());

        const seconds = pad(fecha.getSeconds());

        return `${year}-${month}-${day}T` + `${hours}:${minutes}:${seconds}-06:00`;
    };

    // -------------------------------------------------------------------------
    // CANCELAR
    // -------------------------------------------------------------------------

    const handleCancelar = () => {
        Object.assign(frmSolicitudSat, frmSolicitudSatInit());
    };

    // -------------------------------------------------------------------------
    // SOLICITAR
    // -------------------------------------------------------------------------

    const handleSolicitar = async () => {
        if (botonSolicitarDeshabilitado.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Complete correctamente la información de la solicitud.',
                life: 3000
            });

            return;
        }

        const payload = {
            empresa: frmSolicitudSat.empresa,

            tipo: frmSolicitudSat.tipo,

            fecha_inicial: formatFechaLocal(frmSolicitudSat.fecha_inicial),

            fecha_final: formatFechaLocal(frmSolicitudSat.fecha_final)
        };

        const res = await store.dispatch('api/apiPostToken', {
            direccion: `/operacion_sat/solicitudes_sat`,

            datosJson: payload
        });

        if (res.estatus !== 200) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });

            return;
        }

        toast.add({
            severity: 'success',
            summary: 'Notificación',
            detail: res.mensaje,
            life: 3000
        });

        handleCancelar();
    };

    // -------------------------------------------------------------------------
    // INICIAL
    // -------------------------------------------------------------------------

    const handleInit = async () => {
        await handleCargarCompanias();
    };

    handleInit();

    return {
        frmSolicitudSat,

        catCompaniasSat,

        tipos,

        fechaActual,

        empresaValida,
        fechaInicialValida,
        fechaFinalValida,

        botonSolicitarDeshabilitado,

        handleValidarFechaInicial,
        handleValidarFechaFinal,

        handleCancelar,
        handleSolicitar
    };
};

export default useProceso;
