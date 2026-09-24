import { FilterMatchMode } from '@primevue/core/api';
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

    tipo: 1,

    tipoComprobante: ['I', 'E'],

    fechaInicial: getFechaInicialDefault(),

    fechaFinal: getFechaFinalDefault()
});

const useProceso = () => {
    const store = useStore();

    const toast = useToast();

    const fechaActual = new Date();

    const frmFiltros = reactive(frmFiltrosInit());

    // ============================================================
    // CATALOGOS
    // ============================================================

    const catCompaniasSat = ref([]);

    const catCfdis = ref([]);

    const cfdisSeleccionados = ref([]);

    // ============================================================
    // PAGO
    // ============================================================

    const fechaHoraPago = ref(null);

    const formaPago = ref('03');

    const generando = ref(false);

    // ============================================================
    // FILTRO GLOBAL
    // ============================================================

    const filtros = ref({
        global: {
            value: null,

            matchMode: FilterMatchMode.CONTAINS
        }
    });

    // ============================================================
    // CATALOGOS FIJOS
    // ============================================================

    const catTipo = [
        {
            id: 1,

            description: 'Emitidos'
        }
    ];

    const catTiposComprobantes = [
        {
            id: 'I',

            description: 'Ingreso'
        },

        {
            id: 'E',

            description: 'Egreso'
        }
    ];

    const catFormaPago = [
        {
            id: '01',

            description: '01 - Efectivo'
        },

        {
            id: '02',

            description: '02 - Cheque nominativo'
        },

        {
            id: '03',

            description: '03 - Transferencia electrónica de fondos'
        },

        {
            id: '04',

            description: '04 - Tarjeta de crédito'
        },

        {
            id: '05',

            description: '05 - Monedero electrónico'
        },

        {
            id: '06',

            description: '06 - Dinero electrónico'
        },

        {
            id: '28',

            description: '28 - Tarjeta de débito'
        }
    ];

    // ============================================================
    // VALIDACIONES
    // ============================================================

    const tipoComprobanteValido = computed(() => {
        return Array.isArray(frmFiltros.tipoComprobante) && frmFiltros.tipoComprobante.length > 0;
    });

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

        if (!frmFiltros.tipo) {
            return true;
        }

        if (!tipoComprobanteValido.value) {
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

    // ============================================================
    // TOTALES
    // ============================================================

    const montoTotal = computed(() => {
        return cfdisSeleccionados.value.reduce((sum, item) => {
            return sum + Number(item.abonar || 0);
        }, 0);
    });

    const cantidadFacturasSeleccionadas = computed(() => {
        return cfdisSeleccionados.value.filter((item) => Number(item.abonar || 0) > 0).length;
    });

    const clientesSeleccionados = computed(() => {
        const clientes = new Set();

        cfdisSeleccionados.value.forEach((item) => {
            const rfc = String(item.receptorRfc || '').trim();

            if (rfc) {
                clientes.add(rfc);
            }
        });

        return Array.from(clientes);
    });

    const cantidadClientesSeleccionados = computed(() => {
        return clientesSeleccionados.value.length;
    });

    const labelBotonGenerar = computed(() => {
        const cantidad = cantidadClientesSeleccionados.value;

        if (cantidad <= 0) {
            return 'Generar Complementos';
        }

        if (cantidad === 1) {
            return 'Generar 1 complemento';
        }

        return `Generar ${cantidad} complementos`;
    });

    // ============================================================
    // PAGO VALIDO
    // ============================================================

    const pagoValido = computed(() => {
        return Boolean(montoTotal.value > 0 && cantidadFacturasSeleccionadas.value > 0 && cantidadClientesSeleccionados.value > 0 && fechaHoraPago.value && formaPago.value && !generando.value);
    });

    // ============================================================
    // EMPRESAS
    // ============================================================

    const handleCargarCompaniasSat = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: '/operacion_sat/companias_descarga_cfdi_sat'
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

    // ============================================================
    // CAMBIO EMPRESA
    // ============================================================

    const handleCambioEmpresa = () => {
        catCfdis.value = [];

        cfdisSeleccionados.value = [];

        fechaHoraPago.value = null;

        formaPago.value = '03';

        filtros.value.global.value = null;
    };

    // ============================================================
    // FECHAS
    // ============================================================

    const formatFechaLocal = (fecha, incluirHora = false) => {
        if (!fecha) {
            return null;
        }

        const pad = (n) => String(n).padStart(2, '0');

        const year = fecha.getFullYear();

        const month = pad(fecha.getMonth() + 1);

        const day = pad(fecha.getDate());

        if (!incluirHora) {
            return `${year}-${month}-${day}`;
        }

        const hours = pad(fecha.getHours());

        const minutes = pad(fecha.getMinutes());

        const seconds = pad(fecha.getSeconds());

        return `${year}-${month}-${day}` + 'T' + `${hours}:${minutes}:${seconds}`;
    };

    // ============================================================
    // ORDEN FOLIO
    // ============================================================

    const handleOrdenarPorFolio = (lista) => {
        return [...lista].sort((a, b) => {
            const folioA = String(a.folio ?? '').trim();

            const folioB = String(b.folio ?? '').trim();

            const numeroA = Number(folioA);

            const numeroB = Number(folioB);

            const esNumeroA = !Number.isNaN(numeroA);

            const esNumeroB = !Number.isNaN(numeroB);

            if (esNumeroA && esNumeroB) {
                return numeroA - numeroB;
            }

            return folioA.localeCompare(folioB, 'es', {
                numeric: true
            });
        });
    };

    // ============================================================
    // CONSULTAR
    // ============================================================

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

            tipo: frmFiltros.tipo,

            tipoComprobante: frmFiltros.tipoComprobante,

            metodoPago: ['PPD'],

            fechaInicial: formatFechaLocal(frmFiltros.fechaInicial),

            fechaFinal: formatFechaLocal(frmFiltros.fechaFinal)
        };

        const res = await store.dispatch('api/apiPostToken', {
            direccion: '/complementos_pago_masivos/consultar',

            datosJson: payload
        });

        if (res.estatus !== 200) {
            catCfdis.value = [];

            cfdisSeleccionados.value = [];

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: res.mensaje || 'No fue posible consultar los CFDI.',

                life: 3000
            });

            return;
        }

        const registros = (res.datos?.cfdis ?? []).map((item) => ({
            ...item,

            abonar: 0
        }));

        catCfdis.value = handleOrdenarPorFolio(registros);

        cfdisSeleccionados.value = [];

        fechaHoraPago.value = null;

        formaPago.value = '03';

        filtros.value.global.value = null;

        toast.add({
            severity: 'success',

            summary: 'Notificación',

            detail: res.mensaje || 'Consulta realizada correctamente.',

            life: 3000
        });
    };

    // ============================================================
    // SELECCION CFDI
    // ============================================================

    const handleSeleccionCfdis = (seleccionados) => {
        const seleccionNueva = seleccionados ?? [];

        const nuevos = seleccionNueva.map((item) => {
            const existente = cfdisSeleccionados.value.find((x) => x.uuid === item.uuid);

            if (existente) {
                return {
                    ...item,

                    abonar: Number(existente.abonar || 0)
                };
            }

            const restante = Number(item.saldoInsolutoPagos || item.total || 0);

            return {
                ...item,

                abonar: Number(restante.toFixed(2))
            };
        });

        cfdisSeleccionados.value = nuevos;

        catCfdis.value = catCfdis.value.map((item) => {
            const seleccionado = nuevos.find((x) => x.uuid === item.uuid);

            return {
                ...item,

                abonar: seleccionado ? Number(seleccionado.abonar || 0) : 0
            };
        });

        if (!nuevos.length) {
            fechaHoraPago.value = null;

            formaPago.value = '03';
        }
    };

    // ============================================================
    // ESTA SELECCIONADO
    // ============================================================

    const handleEstaSeleccionado = (rowData) => {
        return cfdisSeleccionados.value.some((item) => item.uuid === rowData.uuid);
    };

    // ============================================================
    // MONTO ABONAR
    // ============================================================

    const handleMontoAbonar = (rowData) => {
        const item = cfdisSeleccionados.value.find((x) => x.uuid === rowData.uuid);

        if (!item) {
            return '0.00';
        }

        return Number(item.abonar || 0).toFixed(2);
    };

    // ============================================================
    // CAMBIAR MONTO
    // ============================================================

    const handleCambiarAbonar = (rowData, value) => {
        let monto = Number(String(value || '').replace(/,/g, ''));

        const restante = Number(rowData.saldoInsolutoPagos || rowData.total || 0);

        if (Number.isNaN(monto)) {
            monto = 0;
        }

        if (monto > restante) {
            monto = restante;
        }

        if (monto < 0) {
            monto = 0;
        }

        monto = Number(monto.toFixed(2));

        catCfdis.value = catCfdis.value.map((item) =>
            item.uuid === rowData.uuid
                ? {
                      ...item,

                      abonar: monto
                  }
                : item
        );

        cfdisSeleccionados.value = cfdisSeleccionados.value.map((item) =>
            item.uuid === rowData.uuid
                ? {
                      ...item,

                      abonar: monto
                  }
                : item
        );
    };

    // ============================================================
    // FACTURAS PARA BACKEND
    // ============================================================

    const handlePrepararFacturas = () => {
        return cfdisSeleccionados.value
            .filter((item) => Number(item.abonar || 0) > 0)
            .map((item) => {
                const restante = Number(item.saldoInsolutoPagos || item.total || 0);

                const abonar = Number(item.abonar || 0);

                return {
                    uuid: item.uuid,

                    serie: item.serie,

                    folio: item.folio,

                    numeroPagos: Number(item.numeroPagos || 0),

                    total: Number(item.total || 0),

                    montoPagos: Number(item.montoPagos || 0),

                    saldoInsolutoPagos: restante,

                    abonar,

                    moneda: item.moneda,

                    metodoPago: item.metodoPago,

                    tipoDeComprobante: item.tipoDeComprobante,

                    fecha: item.fecha,

                    emisorRfc: item.emisorRfc,

                    emisorNombre: item.emisorNombre,

                    receptorRfc: item.receptorRfc,

                    receptorNombre: item.receptorNombre,

                    totalImpuestosRetenidos: Number(item.totalImpuestosRetenidos || 0),

                    totalImpuestosTrasladados: Number(item.totalImpuestosTrasladados || 0),

                    impuestosDr: item.impuestosDr ?? {
                        traslados: [],

                        retenciones: []
                    }
                };
            });
    };

    // ============================================================
    // GENERAR COMPLEMENTOS
    // ============================================================

    const handleGenerarPago = async () => {
        if (!pagoValido.value) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'Selecciona facturas y captura ' + 'fecha y forma de pago.',

                life: 3000
            });

            return;
        }

        const facturas = handlePrepararFacturas();

        if (!facturas.length) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'Selecciona al menos una factura ' + 'con monto a abonar.',

                life: 3000
            });

            return;
        }

        generando.value = true;

        try {
            const payload = {
                rfc_empresa: frmFiltros.empresa,

                fechaHoraPago: formatFechaLocal(fechaHoraPago.value, true),

                formaPago: formaPago.value,

                facturas
            };

            const res = await store.dispatch('api/apiPostToken', {
                direccion: '/complementos_pago_masivos/generar',

                datosJson: payload
            });

            if (res.estatus !== 200) {
                toast.add({
                    severity: 'error',

                    summary: 'Notificación',

                    detail: res.mensaje || 'Error al generar los complementos.',

                    life: 5000
                });

                return;
            }

            const cantidad = Number(res.datos?.cantidad_solicitudes ?? 0);

            toast.add({
                severity: 'success',

                summary: 'Notificación',

                detail: res.mensaje || `Se generaron ${cantidad} solicitudes.`,

                life: 5000
            });

            cfdisSeleccionados.value = [];

            fechaHoraPago.value = null;

            formaPago.value = '03';

            await handleConsultar();
        } catch (error) {
            console.error('ERROR GENERANDO COMPLEMENTOS MASIVOS:', error);

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: 'Ocurrió un error al generar ' + 'los complementos.',

                life: 5000
            });
        } finally {
            generando.value = false;
        }
    };

    // ============================================================
    // CANCELAR
    // ============================================================

    const handleCancelar = () => {
        Object.assign(frmFiltros, frmFiltrosInit());

        catCfdis.value = [];

        cfdisSeleccionados.value = [];

        fechaHoraPago.value = null;

        formaPago.value = '03';

        filtros.value.global.value = null;
    };

    // ============================================================
    // FORMATOS
    // ============================================================

    const handleFormatMX = (value) => {
        return Number(value || 0).toLocaleString('es-MX', {
            minimumFractionDigits: 2,

            maximumFractionDigits: 2
        });
    };

    const handleFormatFecha = (fecha) => {
        if (!fecha) {
            return '';
        }

        return String(fecha).substring(0, 10);
    };

    // ============================================================
    // INIT
    // ============================================================

    const handleInit = async () => {
        await handleCargarCompaniasSat();
    };

    handleInit();

    // ============================================================
    // RETURN
    // ============================================================

    return {
        frmFiltros,

        catCompaniasSat,
        catCfdis,

        catTipo,
        catTiposComprobantes,
        catFormaPago,

        fechaActual,

        cfdisSeleccionados,

        fechaHoraPago,
        formaPago,

        filtros,

        generando,

        montoTotal,

        cantidadFacturasSeleccionadas,

        cantidadClientesSeleccionados,

        labelBotonGenerar,

        tipoComprobanteValido,

        fechaInicialValida,

        fechaFinalValida,

        botonConsultarDeshabilitado,

        pagoValido,

        handleCambioEmpresa,

        handleConsultar,

        handleCancelar,

        handleSeleccionCfdis,

        handleEstaSeleccionado,

        handleMontoAbonar,

        handleCambiarAbonar,

        handleGenerarPago,

        handleFormatMX,

        handleFormatFecha
    };
};

export default useProceso;
