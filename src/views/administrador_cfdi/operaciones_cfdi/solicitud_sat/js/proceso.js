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

    // ==========================================================
    // FORMULARIO
    // ==========================================================

    const frmSolicitudSat = reactive(frmSolicitudSatInit());

    // ==========================================================
    // CATALOGOS
    // ==========================================================

    const catCompaniasSat = ref([]);

    const tipos = [
        {
            id: 'todos',
            descripcion: 'Emitidos y recibidos'
        },

        {
            id: 'emitidos',
            descripcion: 'Emitidos'
        },

        {
            id: 'recibidos',
            descripcion: 'Recibidos'
        }
    ];

    // ==========================================================
    // FECHA ACTUAL
    // ==========================================================

    const fechaActual = ref(new Date());

    // ==========================================================
    // LOADING
    // ==========================================================

    const solicitando = ref(false);

    // ==========================================================
    // CARGAR COMPAÑIAS
    // ==========================================================

    const handleCargarCompanias = async () => {
        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: `/operacion_sat/companias_descarga_cfdi_sat`
            });

            if (res.estatus === 200) {
                catCompaniasSat.value = res.datos?.companias ?? [];

                return;
            }

            catCompaniasSat.value = [];

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: res.mensaje,

                life: 3000
            });
        } catch (error) {
            console.error(error);

            catCompaniasSat.value = [];

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: 'Ocurrió un error al cargar las empresas.',

                life: 3000
            });
        }
    };

    // ==========================================================
    // VALIDAR EMPRESA
    // ==========================================================

    const empresaValida = computed(() => {
        return Boolean(frmSolicitudSat.empresa);
    });

    // ==========================================================
    // VALIDAR FECHA INICIAL
    // ==========================================================

    const fechaInicialValida = computed(() => {
        if (!frmSolicitudSat.fecha_inicial) {
            return false;
        }

        const ahora = new Date();

        return frmSolicitudSat.fecha_inicial <= ahora;
    });

    // ==========================================================
    // VALIDAR FECHA FINAL
    // ==========================================================

    const fechaFinalValida = computed(() => {
        if (!frmSolicitudSat.fecha_final) {
            return false;
        }

        const ahora = new Date();

        if (frmSolicitudSat.fecha_final > ahora) {
            return false;
        }

        if (frmSolicitudSat.fecha_inicial && frmSolicitudSat.fecha_final < frmSolicitudSat.fecha_inicial) {
            return false;
        }

        return true;
    });

    // ==========================================================
    // BOTON SOLICITAR
    // ==========================================================

    const botonSolicitarDeshabilitado = computed(() => {
        return !(empresaValida.value && fechaInicialValida.value && fechaFinalValida.value && frmSolicitudSat.tipo);
    });

    // ==========================================================
    // EMPRESA SELECCIONADA
    // ==========================================================

    const empresaSeleccionada = computed(() => {
        return catCompaniasSat.value.find((item) => item._id === frmSolicitudSat.empresa) || null;
    });

    const nombreEmpresaSeleccionada = computed(() => {
        if (!empresaSeleccionada.value) {
            return 'Sin seleccionar';
        }

        return empresaSeleccionada.value.razon_social_nombre_completo || empresaSeleccionada.value.rfc || 'Sin nombre';
    });

    // ==========================================================
    // TIPO SELECCIONADO
    // ==========================================================

    const tipoSeleccionado = computed(() => {
        return tipos.find((item) => item.id === frmSolicitudSat.tipo) || null;
    });

    const nombreTipoSeleccionado = computed(() => {
        return tipoSeleccionado.value?.descripcion || 'Sin seleccionar';
    });

    // ==========================================================
    // DESCRIPCION TIPO
    // ==========================================================

    const descripcionTipoSeleccionado = computed(() => {
        if (frmSolicitudSat.tipo === 'emitidos') {
            return {
                titulo: 'CFDI emitidos',

                descripcion: 'Se solicitarán los CFDI emitidos por la empresa y su Metadata correspondiente.'
            };
        }

        if (frmSolicitudSat.tipo === 'recibidos') {
            return {
                titulo: 'CFDI recibidos',

                descripcion: 'Se solicitarán los CFDI recibidos por la empresa y su Metadata correspondiente.'
            };
        }

        return {
            titulo: 'Emitidos y recibidos',

            descripcion: 'Se generarán solicitudes para CFDI emitidos, recibidos y la Metadata de ambos.'
        };
    });

    // ==========================================================
    // VALIDAR FECHA INICIAL
    // ==========================================================

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

    // ==========================================================
    // VALIDAR FECHA FINAL
    // ==========================================================

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

    // ==========================================================
    // FORMATO FECHA LOCAL
    // ==========================================================

    const formatFechaLocal = (fecha) => {
        if (!fecha) {
            return null;
        }

        const pad = (numero) => {
            return String(numero).padStart(2, '0');
        };

        const year = fecha.getFullYear();

        const month = pad(fecha.getMonth() + 1);

        const day = pad(fecha.getDate());

        const hours = pad(fecha.getHours());

        const minutes = pad(fecha.getMinutes());

        const seconds = pad(fecha.getSeconds());

        return `${year}-${month}-${day}T` + `${hours}:${minutes}:${seconds}`;
    };

    // ==========================================================
    // FORMATO FECHA PARA MOSTRAR
    // ==========================================================

    const formatFechaTexto = (fecha) => {
        if (!fecha) {
            return '-';
        }

        const pad = (numero) => {
            return String(numero).padStart(2, '0');
        };

        return `${fecha.getFullYear()}-` + `${pad(fecha.getMonth() + 1)}-` + `${pad(fecha.getDate())} ` + `${pad(fecha.getHours())}:` + `${pad(fecha.getMinutes())}`;
    };

    // ==========================================================
    // PERIODO
    // ==========================================================

    const periodoTexto = computed(() => {
        if (!frmSolicitudSat.fecha_inicial || !frmSolicitudSat.fecha_final) {
            return '-';
        }

        return `${formatFechaTexto(frmSolicitudSat.fecha_inicial)}` + ' a ' + `${formatFechaTexto(frmSolicitudSat.fecha_final)}`;
    });

    // ==========================================================
    // CANCELAR
    // ==========================================================

    const handleCancelar = () => {
        Object.assign(frmSolicitudSat, frmSolicitudSatInit());

        fechaActual.value = new Date();
    };

    // ==========================================================
    // SOLICITAR
    // ==========================================================

    const handleSolicitar = async () => {
        if (botonSolicitarDeshabilitado.value || solicitando.value) {
            return;
        }

        solicitando.value = true;

        try {
            const payload = {
                empresa: frmSolicitudSat.empresa,

                tipo: frmSolicitudSat.tipo,

                fecha_inicial: formatFechaLocal(frmSolicitudSat.fecha_inicial),

                fecha_final: formatFechaLocal(frmSolicitudSat.fecha_final)
            };

            console.log('SOLICITUD SAT:', payload);

            const res = await store.dispatch('api/apiPostToken', {
                direccion: `/operacion_sat/solicitudes_sat`,

                datosJson: payload
            });

            console.log('RESPUESTA SOLICITUD SAT:', res);

            if (res.estatus !== 200) {
                toast.add({
                    severity: 'error',

                    summary: 'Solicitud SAT',

                    detail: res.mensaje,

                    life: 4000
                });

                return;
            }

            toast.add({
                severity: 'success',

                summary: 'Solicitud SAT',

                detail: res.mensaje,

                life: 4000
            });

            handleCancelar();
        } catch (error) {
            console.error(error);

            toast.add({
                severity: 'error',

                summary: 'Solicitud SAT',

                detail: 'Ocurrió un error al generar la solicitud.',

                life: 4000
            });
        } finally {
            solicitando.value = false;
        }
    };

    // ==========================================================
    // INIT
    // ==========================================================

    const handleInit = async () => {
        fechaActual.value = new Date();

        await handleCargarCompanias();
    };

    handleInit();

    // ==========================================================
    // RETURN
    // ==========================================================

    return {
        frmSolicitudSat,

        catCompaniasSat,

        tipos,

        fechaActual,

        solicitando,

        empresaValida,
        fechaInicialValida,
        fechaFinalValida,

        botonSolicitarDeshabilitado,

        nombreEmpresaSeleccionada,
        nombreTipoSeleccionado,

        descripcionTipoSeleccionado,

        periodoTexto,

        handleValidarFechaInicial,
        handleValidarFechaFinal,

        handleCancelar,
        handleSolicitar
    };
};

export default useProceso;
