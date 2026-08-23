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
    cliente: '',
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

    const catCompaniasSat = ref([]);
    const catClientesPpd = ref([]);
    const catCfdis = ref([]);

    const cfdisSeleccionados = ref([]);

    const fechaHoraPago = ref(null);
    const formaPago = ref('03');

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

    // -------------------------------------------------------------------------
    // VALIDACIONES
    // -------------------------------------------------------------------------

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

        if (!frmFiltros.cliente) {
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

    // -------------------------------------------------------------------------
    // MONTO TOTAL
    // -------------------------------------------------------------------------

    const montoTotal = computed(() => {
        return cfdisSeleccionados.value.reduce((sum, item) => sum + Number(item.abonar || 0), 0);
    });

    // -------------------------------------------------------------------------
    // PAGO VALIDO
    // -------------------------------------------------------------------------

    const pagoValido = computed(() => {
        return Boolean(montoTotal.value > 0 && fechaHoraPago.value && formaPago.value);
    });

    // -------------------------------------------------------------------------
    // CLIENTE SELECCIONADO
    // -------------------------------------------------------------------------

    const clienteSeleccionado = computed(() => {
        return catClientesPpd.value.find((item) => item.rfc === frmFiltros.cliente) ?? null;
    });

    // -------------------------------------------------------------------------
    // EMPRESAS
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
    // CAMBIO EMPRESA
    // -------------------------------------------------------------------------

    const handleCambioEmpresa = async () => {
        frmFiltros.cliente = '';

        catClientesPpd.value = [];

        catCfdis.value = [];

        cfdisSeleccionados.value = [];

        if (!frmFiltros.empresa) {
            return;
        }

        const res = await store.dispatch('api/apiPostToken', {
            direccion: `/operacion_sat/clientes_ppd`,

            datosJson: {
                rfc: frmFiltros.empresa,

                tipo: frmFiltros.tipo
            }
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

        catClientesPpd.value = res.datos?.clientes ?? [];
    };

    // -------------------------------------------------------------------------
    // FECHA
    // -------------------------------------------------------------------------

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

        return `${year}-${month}-${day}T` + `${hours}:${minutes}:${seconds}`;
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

            rfcCliente: frmFiltros.cliente || '',

            tipo: frmFiltros.tipo,

            tipoComprobante: frmFiltros.tipoComprobante.join(','),

            metodoPago: 'PPD',

            fechaInicial: formatFechaLocal(frmFiltros.fechaInicial),

            fechaFinal: formatFechaLocal(frmFiltros.fechaFinal)
        };

        const res = await store.dispatch('api/apiPostToken', {
            direccion: `/operacion_sat/cfdis_pagos_generar`,

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

        catCfdis.value = (res.datos?.cfdis ?? []).map((item) => ({
            ...item,
            abonar: 0
        }));

        cfdisSeleccionados.value = [];

        fechaHoraPago.value = null;

        formaPago.value = '03';

        toast.add({
            severity: 'success',
            summary: 'Notificación',
            detail: res.mensaje,
            life: 3000
        });
    };

    // -------------------------------------------------------------------------
    // SELECCION CFDI
    // -------------------------------------------------------------------------

    const handleSeleccionCfdis = (seleccionados) => {
        const nuevos = (seleccionados ?? []).map((item) => {
            const existente = cfdisSeleccionados.value.find((x) => x.uuid === item.uuid);

            if (existente) {
                return existente;
            }

            return {
                ...item,

                abonar: Number(item.saldoInsolutoPagos || item.total || 0)
            };
        });

        cfdisSeleccionados.value = nuevos;

        catCfdis.value = catCfdis.value.map((item) => {
            const seleccionado = nuevos.find((x) => x.uuid === item.uuid);

            return {
                ...item,

                abonar: seleccionado ? seleccionado.abonar : 0
            };
        });

        if (!nuevos.length) {
            fechaHoraPago.value = null;

            formaPago.value = '03';
        }
    };

    // -------------------------------------------------------------------------
    // ESTA SELECCIONADO
    // -------------------------------------------------------------------------

    const handleEstaSeleccionado = (rowData) => {
        return cfdisSeleccionados.value.some((item) => item.uuid === rowData.uuid);
    };

    // -------------------------------------------------------------------------
    // OBTENER MONTO ABONAR
    // -------------------------------------------------------------------------

    const handleMontoAbonar = (rowData) => {
        const item = cfdisSeleccionados.value.find((x) => x.uuid === rowData.uuid);

        return item?.abonar ?? '';
    };

    // -------------------------------------------------------------------------
    // CAMBIAR MONTO
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // GENERAR PAGO
    // -------------------------------------------------------------------------

    const handleGenerarPago = async () => {
        if (!pagoValido.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Captura fecha, forma de pago y monto.',
                life: 3000
            });

            return;
        }

        const facturas = cfdisSeleccionados.value
            .filter((item) => Number(item.abonar || 0) > 0)
            .map((item) => {
                const restante = Number(item.saldoInsolutoPagos || item.total || 0);

                const abonar = Number(item.abonar || 0);

                return {
                    uuid: item.uuid,

                    serie: item.serie,

                    folio: item.folio,

                    numero_pago: Number(item.numeroPagos || 0) + 1,

                    total: Number(item.total || 0),

                    pagado: Number(item.montoPagos || 0),

                    restante,

                    abonar,

                    saldo_insoluto: Number((restante - abonar).toFixed(2)),

                    moneda: item.moneda,

                    metodo_pago: item.metodoPago,

                    tipo_comprobante: item.tipoDeComprobante,

                    fecha: item.fecha,

                    emisor_rfc: item.emisorRfc,

                    emisor_nombre: item.emisorNombre,

                    receptor_rfc: item.receptorRfc,

                    receptor_nombre: item.receptorNombre,

                    total_impuestos_retenidos: Number(item.totalImpuestosRetenidos || 0),

                    total_impuestos_trasladados: Number(item.totalImpuestosTrasladados || 0),

                    impuestos_dr: item.impuestosDr ?? {
                        traslados: [],
                        retenciones: []
                    }
                };
            });

        if (!facturas.length) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Selecciona al menos una factura con monto a abonar.',
                life: 3000
            });

            return;
        }

        const payload = {
            tipo_solicitud: 'complemento_pago',

            company_id: null,

            client_id: null,

            bank_id: null,

            rfc_empresa: frmFiltros.empresa,

            rfc_cliente: frmFiltros.cliente || (frmFiltros.tipo === 1 ? facturas[0].receptor_rfc : facturas[0].emisor_rfc),

            tipo: frmFiltros.tipo,

            tipo_comprobante: 'P',

            uso_cfdi: 'CP01',

            metodo_pago: '',

            forma_pago: formaPago.value,

            moneda: 'XXX',

            subtotal: 0,

            traslados: 0,

            retenciones: 0,

            total: 0,

            cliente: {
                rfc: clienteSeleccionado.value?.rfc || (frmFiltros.tipo === 1 ? facturas[0].receptor_rfc : facturas[0].emisor_rfc),

                nombre: clienteSeleccionado.value?.nombre || (frmFiltros.tipo === 1 ? facturas[0].receptor_nombre : facturas[0].emisor_nombre)
            },

            complemento_pago: {
                version: '2.0',

                fecha_pago: formatFechaLocal(fechaHoraPago.value, true),

                forma_pago_p: formaPago.value,

                moneda_p: 'MXN',

                tipo_cambio_p: '1',

                monto: Number(montoTotal.value.toFixed(2)),

                monto_total_pagos: Number(montoTotal.value.toFixed(2))
            },

            conceptos: [
                {
                    prod_serv: '84111506',

                    descripcion_sat: '',

                    descripcion: 'Pago',

                    cuenta_predial: '',

                    clave_unidad: 'ACT',

                    unidad: '',

                    objeto_imp: '01',

                    cantidad: 1,

                    valor_unitario: 0,

                    importe: 0,

                    descuento: 0,

                    impuestos: {
                        retencion: [],
                        traslado: []
                    },

                    total_traslados: 0,

                    total_retenciones: 0,

                    total: 0
                }
            ],

            montoTotal: Number(montoTotal.value.toFixed(2)),

            fechaHoraPago: formatFechaLocal(fechaHoraPago.value, true),

            formaPago: formaPago.value,

            cantidad_documentos: facturas.length,

            facturas,

            estatus: 'pendiente'
        };

        const res = await store.dispatch('api/apiPostToken', {
            direccion: `/solicitud_detallada/guardar_complemento_pago`,

            datosJson: payload
        });

        if (res.estatus !== 200) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje || 'Error al guardar la solicitud.',
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

        cfdisSeleccionados.value = [];

        fechaHoraPago.value = null;

        formaPago.value = '03';

        await handleConsultar();
    };

    // -------------------------------------------------------------------------
    // CANCELAR / LIMPIAR
    // -------------------------------------------------------------------------

    const handleCancelar = () => {
        Object.assign(frmFiltros, frmFiltrosInit());

        catClientesPpd.value = [];

        catCfdis.value = [];

        cfdisSeleccionados.value = [];

        fechaHoraPago.value = null;

        formaPago.value = '03';
    };

    // -------------------------------------------------------------------------
    // FORMATOS
    // -------------------------------------------------------------------------

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
        catClientesPpd,
        catCfdis,

        catTipo,
        catTiposComprobantes,
        catFormaPago,

        fechaActual,

        cfdisSeleccionados,

        fechaHoraPago,
        formaPago,

        montoTotal,

        tipoComprobanteValido,
        fechaInicialValida,
        fechaFinalValida,

        botonConsultarDeshabilitado,

        pagoValido,

        clienteSeleccionado,

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
