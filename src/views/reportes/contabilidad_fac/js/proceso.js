import { computed, onMounted, reactive, ref } from 'vue';

import { useStore } from 'vuex';

import { useToast } from 'primevue/usetoast';

import * as XLSX from 'xlsx';

// ============================================================
// FECHA INICIAL
// PRIMER DIA DEL MES ACTUAL
// ============================================================

const fechaInicialDefault = () => {
    const fecha = new Date();

    fecha.setDate(1);

    fecha.setHours(0, 0, 0, 0);

    return fecha;
};

// ============================================================
// FECHA FINAL
// HOY
// ============================================================

const fechaFinalDefault = () => {
    const fecha = new Date();

    fecha.setHours(0, 0, 0, 0);

    return fecha;
};

// ============================================================
// FORMULARIO INICIAL
// ============================================================

const formularioInicial = () => ({
    empresa: null,

    fechaInicial: fechaInicialDefault(),

    fechaFinal: fechaFinalDefault()
});

const useProceso = () => {
    // ========================================================
    // GENERAL
    // ========================================================

    const store = useStore();

    const toast = useToast();

    // ========================================================
    // FILTROS
    // ========================================================

    const frmFiltros = reactive(formularioInicial());

    const fechaActual = new Date();

    // ========================================================
    // EMPRESAS
    // ========================================================

    const empresas = ref([]);

    // ========================================================
    // REPORTE
    // ========================================================

    const registros = ref([]);

    const resumen = ref({
        cantidad: 0,

        totalFacturado: '0.00',

        totalPagado: '0.00',

        totalRestante: '0.00',

        pagadas: 0,

        parciales: 0,

        sinPago: 0,

        vigentes: 0,

        canceladas: 0
    });

    // ========================================================
    // ESTADOS
    // ========================================================

    const cargando = ref(false);

    const exportando = ref(false);

    // ========================================================
    // BUSCADOR
    // ========================================================

    const buscar = ref('');

    // ========================================================
    // FORMATO FECHA API
    // ========================================================

    const formatFechaApi = (fecha) => {
        if (!fecha) {
            return '';
        }

        const valor = new Date(fecha);

        const year = valor.getFullYear();

        const month = String(valor.getMonth() + 1).padStart(2, '0');

        const day = String(valor.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    // ========================================================
    // FORMATO FECHA TABLA
    // ========================================================

    const formatoFecha = (fecha) => {
        if (!fecha) {
            return '';
        }

        return String(fecha).replace('T', ' ').substring(0, 19);
    };

    // ========================================================
    // MONEDA
    // ========================================================

    const formatoMoneda = (valor) => {
        const numero = Number(valor ?? 0);

        return new Intl.NumberFormat('es-MX', {
            style: 'currency',

            currency: 'MXN',

            minimumFractionDigits: 2,

            maximumFractionDigits: 2
        }).format(Number.isFinite(numero) ? numero : 0);
    };

    // ========================================================
    // NOTIFICACION
    // ========================================================

    const notificar = (severity, detail, summary = 'Notificación') => {
        toast.add({
            severity,

            summary,

            detail,

            life: 3500
        });
    };

    // ========================================================
    // CARGAR EMPRESAS
    // ========================================================

    const handleEmpresas = async () => {
        try {
            const response = await store.dispatch('api/apiGetToken', {
                direccion: '/reportes/empresas'
            });

            if (response.estatus !== 200) {
                empresas.value = [];

                notificar('error', response.mensaje || 'No fue posible consultar las empresas.');

                return;
            }

            empresas.value = response.datos?.empresas ?? response.datos?.datos?.empresas ?? [];
        } catch (error) {
            console.error('EMPRESAS:', error);

            empresas.value = [];

            notificar('error', 'Ocurrió un error al consultar las empresas.');
        }
    };

    // ========================================================
    // CONSULTAR REPORTE
    // ========================================================

    const handleConsultar = async () => {
        if (!frmFiltros.empresa) {
            notificar('warn', 'Selecciona una empresa.');

            return;
        }

        if (!frmFiltros.fechaInicial) {
            notificar('warn', 'Selecciona la fecha inicial.');

            return;
        }

        if (!frmFiltros.fechaFinal) {
            notificar('warn', 'Selecciona la fecha final.');

            return;
        }

        if (frmFiltros.fechaFinal < frmFiltros.fechaInicial) {
            notificar('warn', 'La fecha final no puede ser ' + 'menor a la fecha inicial.');

            return;
        }

        cargando.value = true;

        try {
            const payload = {
                rfc: frmFiltros.empresa.rfc,

                fechaInicial: formatFechaApi(frmFiltros.fechaInicial),

                fechaFinal: formatFechaApi(frmFiltros.fechaFinal)
            };

            const response = await store.dispatch('api/apiPostToken', {
                direccion: '/reportes/cfdi',

                datosJson: payload
            });

            if (response.estatus !== 200) {
                registros.value = [];

                notificar('error', response.mensaje || 'No fue posible consultar el reporte.');

                return;
            }

            const datos = response.datos?.datos ?? response.datos ?? {};

            registros.value = Array.isArray(datos.registros) ? datos.registros : [];

            resumen.value = {
                cantidad: datos.resumen?.cantidad ?? 0,

                totalFacturado: datos.resumen?.totalFacturado ?? '0.00',

                totalPagado: datos.resumen?.totalPagado ?? '0.00',

                totalRestante: datos.resumen?.totalRestante ?? '0.00',

                pagadas: datos.resumen?.pagadas ?? 0,

                parciales: datos.resumen?.parciales ?? 0,

                sinPago: datos.resumen?.sinPago ?? 0,

                vigentes: datos.resumen?.vigentes ?? 0,

                canceladas: datos.resumen?.canceladas ?? 0
            };

            notificar('success', response.mensaje || 'Consulta realizada correctamente.');
        } catch (error) {
            console.error('REPORTE:', error);

            registros.value = [];

            notificar('error', 'Ocurrió un error al consultar el reporte.');
        } finally {
            cargando.value = false;
        }
    };

    // ========================================================
    // LIMPIAR
    // ========================================================

    const handleLimpiar = () => {
        Object.assign(frmFiltros, formularioInicial());

        registros.value = [];

        buscar.value = '';

        resumen.value = {
            cantidad: 0,

            totalFacturado: '0.00',

            totalPagado: '0.00',

            totalRestante: '0.00',

            pagadas: 0,

            parciales: 0,

            sinPago: 0,

            vigentes: 0,

            canceladas: 0
        };
    };

    // ========================================================
    // FILTRO
    // ========================================================

    const registrosFiltrados = computed(() => {
        const texto = String(buscar.value ?? '')
            .trim()
            .toLowerCase();

        if (!texto) {
            return registros.value;
        }

        return registros.value.filter((item) => {
            const valores = [
                item.uuid,

                item.serie,

                item.folio,

                item.emisorRfc,

                item.emisorNombre,

                item.receptorRfc,

                item.receptorNombre,

                item.pacCertifico,

                item.efecto,

                item.estatusCancelacion,

                item.estado,

                item.estatusPago,

                item.numeroPagos,

                item.total,

                item.montoPagado,

                item.montoRestante
            ];

            return valores.some((valor) => {
                return String(valor ?? '')
                    .toLowerCase()
                    .includes(texto);
            });
        });
    });

    // ========================================================
    // TOTAL FILTRADO
    // ========================================================

    const totalFiltrado = computed(() => {
        return registrosFiltrados.value.reduce((total, item) => {
            return total + Number(item.total ?? 0);
        }, 0);
    });

    const pagadoFiltrado = computed(() => {
        return registrosFiltrados.value.reduce((total, item) => {
            return total + Number(item.montoPagado ?? 0);
        }, 0);
    });

    const restanteFiltrado = computed(() => {
        return registrosFiltrados.value.reduce((total, item) => {
            return total + Number(item.montoRestante ?? 0);
        }, 0);
    });

    // ========================================================
    // SEVERITY PAGO
    // ========================================================

    const severityPago = (estatus) => {
        switch (String(estatus ?? '').toUpperCase()) {
            case 'PAGADA':
                return 'success';

            case 'PARCIAL':
                return 'warn';

            default:
                return 'danger';
        }
    };

    // ========================================================
    // SEVERITY CFDI
    // ========================================================

    const severityEstado = (estado) => {
        return String(estado ?? '').toLowerCase() === 'vigente' ? 'success' : 'danger';
    };

    // ========================================================
    // EXPORTAR EXCEL
    // ========================================================

    const handleExportarExcel = () => {
        if (registrosFiltrados.value.length === 0) {
            notificar('warn', 'No existen registros para exportar.');

            return;
        }

        exportando.value = true;

        try {
            const datosExcel = registrosFiltrados.value.map((item) => ({
                'Folio Fiscal': item.uuid ?? '',

                'RFC Emisor': item.emisorRfc ?? '',

                'Nombre Emisor': item.emisorNombre ?? '',

                'RFC Receptor': item.receptorRfc ?? '',

                'Nombre Receptor': item.receptorNombre ?? '',

                'Fecha de Emisión': formatoFecha(item.fechaEmision),

                'Fecha de Certificación': formatoFecha(item.fechaCertificacion),

                'PAC que Certificó': item.pacCertifico ?? '',

                Total: Number(item.total ?? 0),

                Efecto: item.efecto ?? '',

                'Estatus de cancelación': item.estatusCancelacion ?? '',

                Estado: item.estado ?? '',

                'Número de pagos': Number(item.numeroPagos ?? 0),

                'Monto pagado': Number(item.montoPagado ?? 0),

                'Monto restante': Number(item.montoRestante ?? 0),

                'Estatus de pago': item.estatusPago ?? ''
            }));

            // ==================================================
            // TOTAL
            // ==================================================

            datosExcel.push({
                'Folio Fiscal': '',

                'RFC Emisor': '',

                'Nombre Emisor': '',

                'RFC Receptor': '',

                'Nombre Receptor': '',

                'Fecha de Emisión': '',

                'Fecha de Certificación': '',

                'PAC que Certificó': 'TOTALES',

                Total: Number(totalFiltrado.value),

                Efecto: '',

                'Estatus de cancelación': '',

                Estado: '',

                'Número de pagos': '',

                'Monto pagado': Number(pagadoFiltrado.value),

                'Monto restante': Number(restanteFiltrado.value),

                'Estatus de pago': ''
            });

            const hoja = XLSX.utils.json_to_sheet(datosExcel);

            // ==================================================
            // ANCHOS
            // ==================================================

            hoja['!cols'] = [
                {
                    wch: 40
                },

                {
                    wch: 18
                },

                {
                    wch: 35
                },

                {
                    wch: 18
                },

                {
                    wch: 35
                },

                {
                    wch: 22
                },

                {
                    wch: 22
                },

                {
                    wch: 18
                },

                {
                    wch: 18
                },

                {
                    wch: 15
                },

                {
                    wch: 30
                },

                {
                    wch: 15
                },

                {
                    wch: 15
                },

                {
                    wch: 18
                },

                {
                    wch: 18
                },

                {
                    wch: 18
                }
            ];

            hoja['!autofilter'] = {
                ref: `A1:P${datosExcel.length + 1}`
            };

            const libro = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(libro, hoja, 'Reporte CFDI');

            const nombreEmpresa = String(frmFiltros.empresa?.nombre ?? frmFiltros.empresa?.rfc ?? 'Empresa').replace(/[^a-zA-Z0-9_-]/g, '_');

            const fechaInicial = formatFechaApi(frmFiltros.fechaInicial);

            const fechaFinal = formatFechaApi(frmFiltros.fechaFinal);

            XLSX.writeFile(libro, `Reporte_CFDI_` + `${nombreEmpresa}_` + `${fechaInicial}_` + `${fechaFinal}.xlsx`);

            notificar('success', 'Reporte Excel generado correctamente.', 'Excel');
        } catch (error) {
            console.error('EXCEL:', error);

            notificar('error', 'No fue posible generar el Excel.', 'Excel');
        } finally {
            exportando.value = false;
        }
    };

    // ========================================================
    // INIT
    // ========================================================

    onMounted(async () => {
        await handleEmpresas();
    });

    // ========================================================
    // RETURN
    // ========================================================

    return {
        frmFiltros,

        fechaActual,

        empresas,

        registros,

        registrosFiltrados,

        resumen,

        buscar,

        cargando,

        exportando,

        totalFiltrado,

        pagadoFiltrado,

        restanteFiltrado,

        handleConsultar,

        handleLimpiar,

        handleExportarExcel,

        formatoMoneda,

        formatoFecha,

        severityPago,

        severityEstado
    };
};

export default useProceso;
