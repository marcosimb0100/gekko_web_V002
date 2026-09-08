import { useToast } from 'primevue/usetoast';
import { computed, reactive, ref } from 'vue';
import { useStore } from 'vuex';
import * as XLSX from 'xlsx';

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

    const catCompaniasSat = ref([]);
    const catCfdis = ref([]);
    const ctrlBuscar = ref('');

    const catTipo = [
        {
            id: 1,
            description: 'Emitidos'
        },
        {
            id: 2,
            description: 'Recibidos'
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
    // BUSQUEDA LOCAL
    // -------------------------------------------------------------------------

    const catCfdisFiltrados = computed(() => {
        if (!ctrlBuscar.value.trim()) {
            return catCfdis.value;
        }

        const buscar = ctrlBuscar.value.trim().toLowerCase();

        return catCfdis.value.filter((item) => {
            return [item.uuid, item.emisorRfc, item.emisorNombre, item.receptorRfc, item.receptorNombre, item.tipoDeComprobante].filter(Boolean).join(' ').toLowerCase().includes(buscar);
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
    // FECHA API
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

            tipo: frmFiltros.tipo,

            tipoComprobante: frmFiltros.tipoComprobante.join(','),

            metodoPago: 'PPD',

            fechaInicial: formatFechaLocal(frmFiltros.fechaInicial),

            fechaFinal: formatFechaLocal(frmFiltros.fechaFinal)
        };

        const res = await store.dispatch('api/apiPostToken', {
            direccion: `/operacion_sat/cfdis_pagos`,

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
    // FORMATO MONEDA
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

    const handleExportarExcel = () => {
        if (!catCfdisFiltrados.value.length) {
            toast.add({
                severity: 'warn',
                summary: 'Excel',
                detail: 'No existen registros para exportar.',
                life: 3000
            });

            return;
        }

        try {
            const datosExcel = catCfdisFiltrados.value.map((item) => ({
                UUID: item.uuid ?? '',

                Fecha: handleFormatFecha(item.fecha),

                'RFC Emisor': item.emisorRfc ?? '',

                'Nombre Emisor': item.emisorNombre ?? '',

                'RFC Receptor': item.receptorRfc ?? '',

                'Nombre Receptor': item.receptorNombre ?? '',

                Comprobante: item.tipoDeComprobante ?? '',

                Total: Number(item.total ?? 0),

                'Número Pagos': Number(item.numeroPagos ?? item.numero_pagos ?? 0),

                'Total Pagos': Number(item.montoPagos ?? item.monto_pagos ?? 0),

                'Saldo Insoluto': Number(item.saldoInsolutoPagos ?? item.saldo_insoluto_pagos ?? 0),

                'Método Pago': item.metodoPago ?? '',

                Estatus: Number(item.estatusCFDI) === 1 ? 'VIGENTE' : 'CANCELADO'
            }));

            const hoja = XLSX.utils.json_to_sheet(datosExcel);

            hoja['!cols'] = [{ wch: 38 }, { wch: 14 }, { wch: 18 }, { wch: 38 }, { wch: 18 }, { wch: 38 }, { wch: 15 }, { wch: 16 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 14 }];

            hoja['!autofilter'] = {
                ref: `A1:M${datosExcel.length + 1}`
            };

            const libro = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(libro, hoja, 'Complementos');

            const fecha = new Date();

            const nombreArchivo = `Complementos_Pago_${fecha.getFullYear()}-` + `${String(fecha.getMonth() + 1).padStart(2, '0')}-` + `${String(fecha.getDate()).padStart(2, '0')}.xlsx`;

            XLSX.writeFile(libro, nombreArchivo);

            toast.add({
                severity: 'success',
                summary: 'Excel',
                detail: `${datosExcel.length} registros exportados.`,
                life: 3000
            });
        } catch (error) {
            console.error('EXPORTAR COMPLEMENTOS:', error);

            toast.add({
                severity: 'error',
                summary: 'Excel',
                detail: 'No fue posible generar el archivo Excel.',
                life: 3000
            });
        }
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

        catTipo,
        catTiposComprobantes,

        fechaActual,

        catCfdis,
        catCfdisFiltrados,

        ctrlBuscar,

        tipoComprobanteValido,
        fechaInicialValida,
        fechaFinalValida,

        botonConsultarDeshabilitado,

        handleConsultar,
        handleCancelar,

        handleFormatMX,
        handleFormatFecha,
        handleExportarExcel
    };
};

export default useProceso;
