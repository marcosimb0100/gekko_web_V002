import { computed, onMounted, reactive, ref } from 'vue';

import { useStore } from 'vuex';

import { useToast } from 'primevue/usetoast';

import * as XLSX from 'xlsx';

// ============================================================
// PRIMER DÍA DEL AÑO
// ============================================================

const fechaInicialDefault = () => {
    const fecha = new Date();

    fecha.setMonth(0);

    fecha.setDate(1);

    fecha.setHours(0, 0, 0, 0);

    return fecha;
};

// ============================================================
// HOY
// ============================================================

const fechaFinalDefault = () => {
    const fecha = new Date();

    fecha.setHours(0, 0, 0, 0);

    return fecha;
};

// ============================================================
// PROCESO
// ============================================================

const useProceso = () => {
    const store = useStore();

    const toast = useToast();

    // ========================================================
    // FORMULARIO
    // ========================================================

    const frmFiltros = reactive({
        empresa: null,

        fechaInicial: fechaInicialDefault(),

        fechaFinal: fechaFinalDefault()
    });

    const fechaActual = new Date();

    // ========================================================
    // EMPRESAS
    // ========================================================

    const empresas = ref([]);

    // ========================================================
    // REGISTROS
    // ========================================================

    const registros = ref([]);

    // ========================================================
    // RESUMEN
    // ========================================================

    const resumen = ref({
        empresas: 0,

        conceptos: 0,

        totalUsos: 0,

        conceptosUtilizados: 0,

        conceptosSinUso: 0,

        masUtilizado: null,

        menosUtilizado: null
    });

    // ========================================================
    // ESTADOS
    // ========================================================

    const cargando = ref(false);

    const exportando = ref(false);

    // ========================================================
    // BUSQUEDA
    // ========================================================

    const buscar = ref('');

    // ========================================================
    // FECHA API
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
    // RESET RESUMEN
    // ========================================================

    const handleResetResumen = () => {
        resumen.value = {
            empresas: 0,

            conceptos: 0,

            totalUsos: 0,

            conceptosUtilizados: 0,

            conceptosSinUso: 0,

            masUtilizado: null,

            menosUtilizado: null
        };
    };

    // ========================================================
    // EMPRESAS
    // ========================================================

    const handleEmpresas = async () => {
        try {
            const response = await store.dispatch('api/apiGetToken', {
                direccion: '/reportes/empresas'
            });

            if (response.estatus !== 200) {
                empresas.value = [];

                notificar('error', response.mensaje || 'No fue posible consultar ' + 'las empresas.');

                return;
            }

            empresas.value = response.datos?.empresas ?? response.datos?.datos?.empresas ?? [];
        } catch (error) {
            console.error('EMPRESAS:', error);

            empresas.value = [];

            notificar('error', 'Ocurrió un error al ' + 'consultar las empresas.');
        }
    };

    // ========================================================
    // CONSULTAR
    // ========================================================

    const handleConsultar = async () => {
        if (!frmFiltros.fechaInicial) {
            notificar('warn', 'Selecciona la ' + 'fecha inicial.');

            return;
        }

        if (!frmFiltros.fechaFinal) {
            notificar('warn', 'Selecciona la ' + 'fecha final.');

            return;
        }

        if (frmFiltros.fechaFinal < frmFiltros.fechaInicial) {
            notificar('warn', 'La fecha final no puede ' + 'ser menor a la fecha inicial.');

            return;
        }

        cargando.value = true;

        try {
            const payload = {
                fechaInicial: formatFechaApi(frmFiltros.fechaInicial),

                fechaFinal: formatFechaApi(frmFiltros.fechaFinal),

                company_id: frmFiltros.empresa?._id ?? ''
            };

            const response = await store.dispatch('api/apiPostToken', {
                direccion: '/reportes/conceptos_uso',

                datosJson: payload
            });

            if (response.estatus !== 200) {
                registros.value = [];

                handleResetResumen();

                notificar('error', response.mensaje || 'No fue posible consultar ' + 'el reporte.');

                return;
            }

            const datos = response.datos?.datos ?? response.datos ?? {};

            registros.value = Array.isArray(datos.conceptos) ? datos.conceptos : [];

            resumen.value = {
                empresas: datos.resumen?.empresas ?? 0,

                conceptos: datos.resumen?.conceptos ?? 0,

                totalUsos: datos.resumen?.totalUsos ?? 0,

                conceptosUtilizados: datos.resumen?.conceptosUtilizados ?? 0,

                conceptosSinUso: datos.resumen?.conceptosSinUso ?? 0,

                masUtilizado: datos.resumen?.masUtilizado ?? null,

                menosUtilizado: datos.resumen?.menosUtilizado ?? null
            };
        } catch (error) {
            console.error('REPORTE CONCEPTOS:', error);

            registros.value = [];

            handleResetResumen();

            notificar('error', 'Ocurrió un error al consultar ' + 'el reporte de conceptos.');
        } finally {
            cargando.value = false;
        }
    };

    // ========================================================
    // LIMPIAR
    // ========================================================

    const handleLimpiar = async () => {
        frmFiltros.empresa = null;

        frmFiltros.fechaInicial = fechaInicialDefault();

        frmFiltros.fechaFinal = fechaFinalDefault();

        buscar.value = '';

        registros.value = [];

        handleResetResumen();

        await handleConsultar();
    };

    // ========================================================
    // REGISTROS FILTRADOS
    // ========================================================

    const registrosFiltrados = computed(() => {
        const texto = String(buscar.value ?? '')
            .trim()
            .toLowerCase();

        if (!texto) {
            return registros.value;
        }

        return registros.value.filter((item) => {
            const valores = [item.empresa, item.razonSocial, item.rfc, item.prod_serv, item.descripcion, item.descripcion_sat, item.clave_unidad, item.unidad, item.objeto_imp, item.numeroFacturado, item.ranking];

            return valores.some((valor) =>
                String(valor ?? '')
                    .toLowerCase()
                    .includes(texto)
            );
        });
    });

    // ========================================================
    // MÁS UTILIZADO
    // ========================================================

    const textoMasUtilizado = computed(() => {
        const item = resumen.value.masUtilizado;

        if (!item) {
            return '-';
        }

        return `${item.prod_serv || ''}` + (item.descripcion ? ` - ${item.descripcion}` : '');
    });

    // ========================================================
    // MENOS UTILIZADO
    // ========================================================

    const textoMenosUtilizado = computed(() => {
        const item = resumen.value.menosUtilizado;

        if (!item) {
            return '-';
        }

        return `${item.prod_serv || ''}` + (item.descripcion ? ` - ${item.descripcion}` : '');
    });

    // ========================================================
    // EXPORTAR EXCEL
    // ========================================================

    const handleExportarExcel = async () => {
        if (registrosFiltrados.value.length === 0) {
            notificar('warn', 'No existen datos ' + 'para exportar.', 'Excel');

            return;
        }

        exportando.value = true;

        try {
            const datosExcel = registrosFiltrados.value.map((item) => ({
                Ranking: Number(item.ranking ?? 0),

                Empresa: item.empresa ?? '',

                'Razón Social': item.razonSocial ?? '',

                RFC: item.rfc ?? '',

                ProdServ: item.prod_serv ?? '',

                Descripción: item.descripcion ?? '',

                'Clave Unidad': item.clave_unidad ?? '',

                Unidad: item.unidad ?? '',

                'Objeto Imp.': item.objeto_imp ?? '',

                'Número Facturado': Number(item.numeroFacturado ?? 0)
            }));

            const hoja = XLSX.utils.json_to_sheet(datosExcel);

            hoja['!cols'] = [
                {
                    wch: 10
                },

                {
                    wch: 25
                },

                {
                    wch: 42
                },

                {
                    wch: 16
                },

                {
                    wch: 14
                },

                {
                    wch: 60
                },

                {
                    wch: 15
                },

                {
                    wch: 25
                },

                {
                    wch: 14
                },

                {
                    wch: 18
                }
            ];

            hoja['!autofilter'] = {
                ref: `A1:J` + (datosExcel.length + 1)
            };

            const libro = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(libro, hoja, 'Uso Conceptos');

            const fechaInicial = formatFechaApi(frmFiltros.fechaInicial);

            const fechaFinal = formatFechaApi(frmFiltros.fechaFinal);

            XLSX.writeFile(libro, 'Uso_Conceptos_' + fechaInicial + '_' + fechaFinal + '.xlsx');

            notificar('success', 'Reporte Excel generado ' + 'correctamente.', 'Excel');
        } catch (error) {
            console.error('EXCEL:', error);

            notificar('error', 'No fue posible generar ' + 'el Excel.', 'Excel');
        } finally {
            exportando.value = false;
        }
    };

    // ========================================================
    // INIT
    // ========================================================

    onMounted(async () => {
        await handleEmpresas();

        await handleConsultar();
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

        textoMasUtilizado,

        textoMenosUtilizado,

        handleConsultar,

        handleLimpiar,

        handleExportarExcel
    };
};

export default useProceso;
