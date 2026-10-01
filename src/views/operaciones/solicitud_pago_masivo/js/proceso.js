import { FilterMatchMode } from '@primevue/core/api';

import { useToast } from 'primevue/usetoast';

import { computed, reactive, ref } from 'vue';

import { useStore } from 'vuex';

import * as XLSX from 'xlsx';

/* ============================================================
   FECHAS DEFAULT
============================================================ */

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

/* ============================================================
   FILTROS DEFAULT
============================================================ */

const frmFiltrosInit = () => ({
    empresa: '',

    tipo: 1,

    tipoComprobante: ['I', 'E'],

    fechaInicial: getFechaInicialDefault(),

    fechaFinal: getFechaFinalDefault()
});

/* ============================================================
   PROCESO
============================================================ */

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

    // ------------------------------------------------------------
    // RESPALDO DE LA CONSULTA COMPLETA
    //
    // catCfdis:
    //     datos visibles.
    //
    // catCfdisOriginal:
    //     consulta completa antes del filtro Excel.
    // ------------------------------------------------------------

    const catCfdisOriginal = ref([]);

    const cfdisSeleccionados = ref([]);

    // ============================================================
    // PAGO
    // ============================================================

    const fechaHoraCfdi = ref(null);

    const fechaHoraPago = ref(null);

    const formaPago = ref('03');

    const generando = ref(false);

    // ============================================================
    // MODO DE GENERACION
    // ============================================================

    const modoGeneracion = ref('cliente_fecha');

    // ============================================================
    // FILTRO EXCEL
    // ============================================================

    const inputExcel = ref(null);

    const filtroExcelActivo = ref(false);

    const archivoExcelNombre = ref('');

    const registrosExcel = ref([]);

    const cantidadExcelRegistros = ref(0);

    const cantidadExcelEncontradas = ref(0);

    const cantidadExcelNoEncontradas = ref(0);

    const cantidadExcelSinSaldo = ref(0);

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

    const cantidadComplementosGenerar = computed(() => {
        if (modoGeneracion.value === 'factura') {
            return cantidadFacturasSeleccionadas.value;
        }

        return cantidadClientesSeleccionados.value;
    });

    // ============================================================
    // LABEL BOTON
    // ============================================================

    const labelBotonGenerar = computed(() => {
        const cantidad = cantidadComplementosGenerar.value;

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
        return Boolean(montoTotal.value > 0 && cantidadFacturasSeleccionadas.value > 0 && cantidadComplementosGenerar.value > 0 && fechaHoraCfdi.value && fechaHoraPago.value && formaPago.value && !generando.value);
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
    // LIMPIAR FILTRO EXCEL
    // ============================================================

    const handleLimpiarEstadoExcel = (restaurar = false) => {
        if (restaurar && catCfdisOriginal.value.length) {
            catCfdis.value = handleOrdenarPorFolio(catCfdisOriginal.value);
        }

        filtroExcelActivo.value = false;

        archivoExcelNombre.value = '';

        registrosExcel.value = [];

        cantidadExcelRegistros.value = 0;

        cantidadExcelEncontradas.value = 0;

        cantidadExcelNoEncontradas.value = 0;

        cantidadExcelSinSaldo.value = 0;

        if (inputExcel.value) {
            inputExcel.value.value = '';
        }
    };

    // ============================================================
    // CAMBIO EMPRESA
    // ============================================================

    const handleCambioEmpresa = () => {
        catCfdis.value = [];

        catCfdisOriginal.value = [];

        cfdisSeleccionados.value = [];

        fechaHoraCfdi.value = null;

        fechaHoraPago.value = null;

        formaPago.value = '03';

        filtros.value.global.value = null;

        handleLimpiarEstadoExcel(false);
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
    // NORMALIZAR TEXTO EXCEL
    // ============================================================

    const handleNormalizarTexto = (value) => {
        return String(value ?? '')
            .trim()
            .toUpperCase();
    };

    // ============================================================
    // NORMALIZAR FOLIO
    //
    // 000123 -> 123
    // 123.0  -> 123
    // ============================================================

    const handleNormalizarFolio = (value) => {
        let texto = String(value ?? '')
            .trim()
            .toUpperCase();

        texto = texto.replace(/\.0+$/, '');

        if (/^\d+$/.test(texto)) {
            texto = texto.replace(/^0+(?=\d)/, '');
        }

        return texto;
    };

    // ============================================================
    // NORMALIZAR ENCABEZADO
    // ============================================================

    const handleNormalizarEncabezado = (value) => {
        return String(value ?? '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_');
    };

    // ============================================================
    // APLICAR FILTRO EXCEL
    // ============================================================

    const handleAplicarFiltroExcel = (registros) => {
        if (!frmFiltros.empresa) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Primero selecciona una empresa.',
                life: 3000
            });

            return;
        }

        if (!catCfdisOriginal.value.length) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Primero consulta los CFDI de la empresa.',
                life: 3000
            });

            return;
        }

        // ============================================================
        // NORMALIZAR CRITERIOS DEL EXCEL
        //
        // serie:
        //     opcional
        //
        // folio:
        //     obligatorio
        //
        // uuid:
        //     si viene, tiene prioridad
        // ============================================================

        const criterios = [];

        registros.forEach((item, index) => {
            const serie = handleNormalizarTexto(item.serie);

            const folio = handleNormalizarFolio(item.folio);

            const uuid = handleNormalizarTexto(item.uuid);

            // --------------------------------------------------------
            // NECESITAMOS AL MENOS FOLIO O UUID
            // --------------------------------------------------------

            if (!folio && !uuid) {
                return;
            }

            criterios.push({
                serie,
                folio,
                uuid,
                index
            });
        });

        if (!criterios.length) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'El Excel no contiene registros válidos. ' + 'El folio es obligatorio y la serie es opcional.',
                life: 4000
            });

            return;
        }

        // ============================================================
        // RESULTADOS
        // ============================================================

        const encontrados = [];

        const noEncontrados = [];

        const sinSaldo = [];

        const ambiguos = [];

        // ============================================================
        // EVITAR DUPLICADOS
        //
        // Si el Excel repite el mismo folio o UUID,
        // no queremos mostrar el CFDI dos veces.
        // ============================================================

        const uuidsAgregados = new Set();

        // ============================================================
        // RECORRER CADA REGISTRO DEL EXCEL
        // ============================================================

        criterios.forEach((criterio) => {
            let coincidencias = [];

            // ========================================================
            // 1. SI VIENE UUID
            //
            // UUID tiene prioridad y es la coincidencia más segura.
            // ========================================================

            if (criterio.uuid) {
                coincidencias = catCfdisOriginal.value.filter((cfdi) => {
                    const uuidCfdi = handleNormalizarTexto(cfdi.uuid);

                    return uuidCfdi === criterio.uuid;
                });
            }

            // ========================================================
            // 2. SI VIENE SERIE
            //
            // Buscar por:
            // serie + folio
            // ========================================================
            else if (criterio.serie) {
                coincidencias = catCfdisOriginal.value.filter((cfdi) => {
                    const serieCfdi = handleNormalizarTexto(cfdi.serie);

                    const folioCfdi = handleNormalizarFolio(cfdi.folio);

                    return serieCfdi === criterio.serie && folioCfdi === criterio.folio;
                });
            }

            // ========================================================
            // 3. NO VIENE SERIE
            //
            // Buscar únicamente por folio.
            // ========================================================
            else {
                coincidencias = catCfdisOriginal.value.filter((cfdi) => {
                    const folioCfdi = handleNormalizarFolio(cfdi.folio);

                    return folioCfdi === criterio.folio;
                });
            }

            // ========================================================
            // NO ENCONTRADO
            // ========================================================

            if (!coincidencias.length) {
                noEncontrados.push({
                    ...criterio
                });

                return;
            }

            // ========================================================
            // AMBIGUO
            //
            // Esto principalmente puede pasar cuando NO viene serie:
            //
            // Excel:
            // serie: ""
            // folio: 123
            //
            // CFDI:
            // A-123
            // B-123
            //
            // No escogemos ninguno automáticamente.
            // ========================================================

            if (coincidencias.length > 1) {
                ambiguos.push({
                    ...criterio,

                    coincidencias: coincidencias.map((cfdi) => ({
                        uuid: cfdi.uuid,

                        serie: cfdi.serie,

                        folio: cfdi.folio,

                        receptorRfc: cfdi.receptorRfc,

                        receptorNombre: cfdi.receptorNombre
                    }))
                });

                return;
            }

            // ========================================================
            // TENEMOS UNA SOLA COINCIDENCIA
            // ========================================================

            const cfdi = coincidencias[0];

            const saldo = Number(cfdi.saldoInsolutoPagos ?? 0);

            // ========================================================
            // SIN SALDO PENDIENTE
            // ========================================================

            if (saldo <= 0) {
                sinSaldo.push({
                    ...criterio,

                    uuid: cfdi.uuid,

                    serieCfdi: cfdi.serie,

                    folioCfdi: cfdi.folio
                });

                return;
            }

            // ========================================================
            // EVITAR DUPLICADOS
            // ========================================================

            const uuidCfdi = String(cfdi.uuid ?? '').trim();

            if (uuidCfdi && uuidsAgregados.has(uuidCfdi)) {
                return;
            }

            if (uuidCfdi) {
                uuidsAgregados.add(uuidCfdi);
            }

            // ========================================================
            // ENCONTRADO CON SALDO
            // ========================================================

            encontrados.push({
                ...cfdi,

                abonar: 0
            });
        });

        // ============================================================
        // GUARDAR ESTADISTICAS
        // ============================================================

        registrosExcel.value = criterios;

        cantidadExcelRegistros.value = criterios.length;

        cantidadExcelEncontradas.value = encontrados.length;

        cantidadExcelNoEncontradas.value = noEncontrados.length;

        cantidadExcelSinSaldo.value = sinSaldo.length;

        // ============================================================
        // NUEVO:
        // SI QUIERES MOSTRAR AMBIGUOS EN PANTALLA,
        // agrega también:
        //
        // cantidadExcelAmbiguos.value = ambiguos.length;
        // ============================================================

        filtroExcelActivo.value = true;

        // ============================================================
        // MOSTRAR SOLO CFDI ENCONTRADOS CON SALDO
        // ============================================================

        catCfdis.value = handleOrdenarPorFolio(encontrados);

        // ============================================================
        // LIMPIAR SELECCION
        //
        // El Excel solamente filtra.
        // NO selecciona automáticamente.
        // ============================================================

        cfdisSeleccionados.value = [];

        fechaHoraCfdi.value = null;

        fechaHoraPago.value = null;

        formaPago.value = '03';

        filtros.value.global.value = null;

        // ============================================================
        // DEBUG
        // ============================================================

        console.log('==============================================');

        console.log('RESULTADO FILTRO EXCEL');

        console.log('==============================================');

        console.log('REGISTROS:', criterios.length);

        console.log('ENCONTRADOS:', encontrados.length);

        console.log('NO ENCONTRADOS:', noEncontrados.length);

        console.log('SIN SALDO:', sinSaldo.length);

        console.log('AMBIGUOS:', ambiguos.length);

        if (ambiguos.length) {
            console.table(ambiguos);
        }

        console.log('==============================================');

        // ============================================================
        // MENSAJE
        // ============================================================

        let detalle = `Encontradas: ${encontrados.length}. ` + `No encontradas: ${noEncontrados.length}. ` + `Sin saldo pendiente: ${sinSaldo.length}.`;

        if (ambiguos.length) {
            detalle += ` Ambiguas: ${ambiguos.length}.`;
        }

        toast.add({
            severity: encontrados.length ? 'success' : 'warn',

            summary: 'Filtro Excel',

            detail,

            life: 7000
        });
    };

    // ============================================================
    // ABRIR EXCEL
    // ============================================================

    const handleAbrirExcel = () => {
        if (!frmFiltros.empresa) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'Primero selecciona una empresa.',

                life: 3000
            });

            return;
        }

        if (!catCfdisOriginal.value.length) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'Primero consulta los CFDI de la empresa.',

                life: 3000
            });

            return;
        }

        if (inputExcel.value) {
            inputExcel.value.value = '';

            inputExcel.value.click();
        }
    };

    // ============================================================
    // CARGAR EXCEL
    // ============================================================

    const handleCargarExcel = async (event) => {
        const archivo = event.target?.files?.[0];

        if (!archivo) {
            return;
        }

        if (!frmFiltros.empresa) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'Primero selecciona una empresa.',

                life: 3000
            });

            event.target.value = '';

            return;
        }

        try {
            const buffer = await archivo.arrayBuffer();

            const workbook = XLSX.read(buffer, {
                type: 'array'
            });

            if (!workbook.SheetNames.length) {
                throw new Error('El archivo no contiene hojas.');
            }

            const nombreHoja = workbook.SheetNames[0];

            const hoja = workbook.Sheets[nombreHoja];

            const filas = XLSX.utils.sheet_to_json(hoja, {
                defval: '',

                raw: false
            });

            if (!filas.length) {
                toast.add({
                    severity: 'warn',

                    summary: 'Filtro Excel',

                    detail: 'El archivo no contiene registros.',

                    life: 4000
                });

                return;
            }

            const registros = filas.map((fila) => {
                const normalizado = {};

                Object.keys(fila).forEach((key) => {
                    const nuevoKey = handleNormalizarEncabezado(key);

                    normalizado[nuevoKey] = fila[key];
                });

                return {
                    serie: normalizado.serie ?? '',

                    folio: normalizado.folio ?? '',

                    uuid: normalizado.uuid ?? ''
                };
            });

            archivoExcelNombre.value = archivo.name;

            handleAplicarFiltroExcel(registros);
        } catch (error) {
            console.error('ERROR LEYENDO EXCEL:', error);

            toast.add({
                severity: 'error',

                summary: 'Filtro Excel',

                detail: 'No fue posible leer el archivo Excel. Verifica que tenga las columnas serie y folio.',

                life: 5000
            });
        } finally {
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    // ============================================================
    // QUITAR FILTRO EXCEL
    // ============================================================

    const handleQuitarFiltroExcel = () => {
        handleLimpiarEstadoExcel(true);

        cfdisSeleccionados.value = [];

        fechaHoraCfdi.value = null;

        fechaHoraPago.value = null;

        formaPago.value = '03';

        filtros.value.global.value = null;

        toast.add({
            severity: 'info',

            summary: 'Filtro Excel',

            detail: 'Se quitó el filtro Excel y se restauró la consulta completa.',

            life: 3000
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

            catCfdisOriginal.value = [];

            cfdisSeleccionados.value = [];

            fechaHoraCfdi.value = null;

            fechaHoraPago.value = null;

            handleLimpiarEstadoExcel(false);

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

        const registrosOrdenados = handleOrdenarPorFolio(registros);

        catCfdisOriginal.value = registrosOrdenados;

        catCfdis.value = registrosOrdenados;

        cfdisSeleccionados.value = [];

        fechaHoraCfdi.value = null;

        fechaHoraPago.value = null;

        formaPago.value = '03';

        filtros.value.global.value = null;

        // ====================================================
        // UNA NUEVA CONSULTA QUITA EL FILTRO EXCEL ANTERIOR
        // ====================================================

        handleLimpiarEstadoExcel(false);

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

        if (nuevos.length && !fechaHoraCfdi.value) {
            fechaHoraCfdi.value = new Date();
        }

        catCfdis.value = catCfdis.value.map((item) => {
            const seleccionado = nuevos.find((x) => x.uuid === item.uuid);

            return {
                ...item,

                abonar: seleccionado ? Number(seleccionado.abonar || 0) : 0
            };
        });

        if (!nuevos.length) {
            fechaHoraCfdi.value = null;

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

                detail: 'Selecciona facturas y captura fecha CFDI, fecha de pago y forma de pago.',

                life: 3000
            });

            return;
        }

        const facturas = handlePrepararFacturas();

        if (!facturas.length) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'Selecciona al menos una factura con monto a abonar.',

                life: 3000
            });

            return;
        }

        generando.value = true;

        try {
            const payload = {
                rfc_empresa: frmFiltros.empresa,

                modo_generacion: modoGeneracion.value,

                fecha_factura: formatFechaLocal(fechaHoraCfdi.value, true),

                fechaHoraPago: formatFechaLocal(fechaHoraPago.value, true),

                formaPago: formaPago.value,

                facturas
            };

            console.log('==============================================');

            console.log('GENERAR COMPLEMENTOS MASIVOS');

            console.log('==============================================');

            console.log('MODO GENERACION:', payload.modo_generacion);

            console.log('FECHA CFDI:', payload.fecha_factura);

            console.log('FECHA PAGO:', payload.fechaHoraPago);

            console.log('FORMA PAGO:', payload.formaPago);

            console.log('FACTURAS:', payload.facturas.length);

            console.log('COMPLEMENTOS A GENERAR:', cantidadComplementosGenerar.value);

            console.log('==============================================');

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

            fechaHoraCfdi.value = null;

            fechaHoraPago.value = null;

            formaPago.value = '03';

            await handleConsultar();
        } catch (error) {
            console.error('ERROR GENERANDO COMPLEMENTOS MASIVOS:', error);

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: 'Ocurrió un error al generar los complementos.',

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

        catCfdisOriginal.value = [];

        cfdisSeleccionados.value = [];

        fechaHoraCfdi.value = null;

        fechaHoraPago.value = null;

        formaPago.value = '03';

        modoGeneracion.value = 'cliente_fecha';

        filtros.value.global.value = null;

        handleLimpiarEstadoExcel(false);
    };

    const handleDescargarLayoutExcel = async () => {
        try {
            const res = await store.dispatch('api/apiGetblob', {
                direccion: '/complementos_pago_masivos/descargar_layout_excel'
            });

            if (res?.estatus !== 200 || !res?.data) {
                toast.add({
                    severity: 'error',

                    summary: 'Notificación',

                    detail: res?.mensaje || 'No fue posible descargar el layout de Excel.',

                    life: 4000
                });

                return;
            }

            const url = window.URL.createObjectURL(res.data);

            const link = document.createElement('a');

            link.href = url;

            link.download = 'FiltroPagos.xlsx';

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);

            toast.add({
                severity: 'success',

                summary: 'Notificación',

                detail: 'Layout de Excel descargado correctamente.',

                life: 3000
            });
        } catch (error) {
            console.error('Error al descargar layout Excel:', error);

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: 'No fue posible descargar el layout de Excel.',

                life: 4000
            });
        }
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

        catCfdisOriginal,

        catTipo,

        catTiposComprobantes,

        catFormaPago,

        fechaActual,

        cfdisSeleccionados,

        // ========================================================
        // MODO GENERACION
        // ========================================================

        modoGeneracion,

        // ========================================================
        // EXCEL
        // ========================================================

        inputExcel,

        filtroExcelActivo,

        archivoExcelNombre,

        cantidadExcelRegistros,

        cantidadExcelEncontradas,

        cantidadExcelNoEncontradas,

        cantidadExcelSinSaldo,

        handleAbrirExcel,

        handleCargarExcel,

        handleQuitarFiltroExcel,

        // ========================================================
        // FECHAS
        // ========================================================

        fechaHoraCfdi,

        fechaHoraPago,

        formaPago,

        filtros,

        generando,

        montoTotal,

        cantidadFacturasSeleccionadas,

        cantidadClientesSeleccionados,

        cantidadComplementosGenerar,

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

        handleFormatFecha,
        handleDescargarLayoutExcel
    };
};

export default useProceso;
