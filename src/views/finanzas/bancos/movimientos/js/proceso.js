import { useToast } from 'primevue/usetoast';

import { computed, onMounted, ref } from 'vue';

import { useStore } from 'vuex';

import * as XLSX from 'xlsx';

const useProceso = () => {
    const store = useStore();

    const toast = useToast();

    // ============================================================
    // EMPRESAS
    // ============================================================

    const empresas = ref([]);

    const empresaSeleccionada = ref(null);

    const cargandoEmpresas = ref(false);

    // ============================================================
    // CUENTAS
    // ============================================================

    const cuentasBancarias = ref([]);

    const cuentaSeleccionada = ref(null);

    const cargandoCuentas = ref(false);

    // ============================================================
    // CONSULTA
    // ============================================================

    const consultando = ref(false);

    const consultado = ref(false);

    const movimientos = ref([]);

    // ============================================================
    // SELECCIÓN MOVIMIENTOS
    // ============================================================

    const movimientosSeleccionados = ref([]);

    // ============================================================
    // CONCEPTOS
    // ============================================================

    const conceptosDisponibles = ref([]);

    const conceptoSeleccionado = ref(null);

    const cargandoConceptos = ref(false);

    const aplicandoConcepto = ref(false);

    // ============================================================
    // RESUMEN
    // ============================================================

    const resumen = ref({
        movimientos: 0,
        total_ingresos: 0,
        total_egresos: 0
    });

    // ============================================================
    // FECHAS
    // ============================================================

    const fechaActual = new Date();

    const fechaInicial = ref(new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1));

    const fechaFinal = ref(new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate()));

    // ============================================================
    // FILTROS
    // ============================================================

    const filtros = ref({
        global: {
            value: null,
            matchMode: 'contains'
        }
    });

    // ============================================================
    // COLUMNAS HOMOLOGADAS
    // ============================================================

    const columnasMovimientos = computed(() => {
        return [
            {
                field: 'fila_archivo',
                header: 'Fila',
                tipo: 'texto',
                style: 'width: 3%'
            },
            {
                field: 'fecha_hora',
                header: 'Fecha / Hora',
                tipo: 'texto',
                style: 'width: 8%'
            },
            {
                field: 'descripcion',
                header: 'Descripción',
                tipo: 'texto',
                style: 'width: 31%'
            },
            {
                field: 'descripcion_2',
                header: 'Descripción 2',
                tipo: 'texto',
                style: 'width: 10%'
            },
            {
                field: 'clave_rastreo',
                header: 'Clave de Rastreo',
                tipo: 'texto',
                style: 'width: 9%'
            },
            {
                field: 'referencia',
                header: 'Referencia',
                tipo: 'texto',
                style: 'width: 6%'
            },
            {
                field: 'ingreso',
                header: 'Ingreso',
                tipo: 'moneda',
                style: 'width: 7%'
            },
            {
                field: 'egreso',
                header: 'Egreso',
                tipo: 'moneda',
                style: 'width: 7%'
            },
            {
                field: 'saldo',
                header: 'Saldo',
                tipo: 'moneda',
                style: 'width: 7%'
            },

            // ====================================================
            // SIEMPRE AL FINAL
            // ====================================================

            {
                field: 'conciliacion',
                header: 'Concepto Conciliación',
                tipo: 'conciliacion',
                style: 'width: 12%'
            }
        ];
    });

    // ============================================================
    // BUSCADOR
    //
    // Puede buscar también datos que no mostramos.
    // ============================================================

    const camposBusqueda = computed(() => {
        return ['fecha_hora', 'descripcion', 'descripcion_2', 'conciliacion.nombre', 'conciliacion.ruta', 'beneficiario_ordenante', 'banco_movimiento', 'cuenta_clabe', 'clave_rastreo', 'referencia'];
    });

    // ============================================================
    // TOAST
    // ============================================================

    const handleToast = (severity, detail, summary = 'Notificación') => {
        toast.add({
            severity,
            summary,
            detail,
            life: 3500
        });
    };

    // ============================================================
    // RESPUESTA API
    // ============================================================

    const obtenerDatosRespuesta = (res) => {
        if (res?.datos?.datos && typeof res.datos.datos === 'object') {
            return res.datos.datos;
        }

        if (res?.datos && typeof res.datos === 'object') {
            return res.datos;
        }

        if (res?.data?.datos && typeof res.data.datos === 'object') {
            return res.data.datos;
        }

        if (res?.data && typeof res.data === 'object') {
            return res.data;
        }

        return {};
    };

    // ============================================================
    // FECHA API
    // ============================================================

    const handleFormatoFechaApi = (fecha) => {
        if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) {
            return '';
        }

        const anio = fecha.getFullYear();

        const mes = String(fecha.getMonth() + 1).padStart(2, '0');

        const dia = String(fecha.getDate()).padStart(2, '0');

        return `${anio}-${mes}-${dia}`;
    };

    // ============================================================
    // EMPRESAS
    // ============================================================

    const handleCargarEmpresas = async () => {
        cargandoEmpresas.value = true;

        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: '/estados_cuenta/empresas'
            });

            if (res?.estatus !== 200) {
                empresas.value = [];

                handleToast('error', res?.mensaje || 'No fue posible consultar las empresas.');

                return false;
            }

            const datos = obtenerDatosRespuesta(res);

            empresas.value = Array.isArray(datos.empresas) ? datos.empresas : [];

            return true;
        } catch (error) {
            console.error('ERROR CARGANDO EMPRESAS:', error);

            empresas.value = [];

            handleToast('error', 'Ocurrió un error al consultar las empresas.');

            return false;
        } finally {
            cargandoEmpresas.value = false;
        }
    };

    // ============================================================
    // CUENTAS
    // ============================================================

    const handleCargarCuentasEmpresa = async () => {
        if (!empresaSeleccionada.value?._id) {
            cuentasBancarias.value = [];

            return false;
        }

        cargandoCuentas.value = true;

        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: `/estados_cuenta/empresas/` + `${empresaSeleccionada.value._id}/cuentas`
            });

            if (res?.estatus !== 200) {
                cuentasBancarias.value = [];

                handleToast('error', res?.mensaje || 'No fue posible consultar las cuentas bancarias.');

                return false;
            }

            const datos = obtenerDatosRespuesta(res);

            cuentasBancarias.value = Array.isArray(datos.cuentas) ? datos.cuentas : [];

            if (cuentasBancarias.value.length === 1) {
                cuentaSeleccionada.value = cuentasBancarias.value[0];
            }

            return true;
        } catch (error) {
            console.error('ERROR CARGANDO CUENTAS:', error);

            cuentasBancarias.value = [];

            handleToast('error', 'Ocurrió un error al consultar las cuentas bancarias.');

            return false;
        } finally {
            cargandoCuentas.value = false;
        }
    };

    // ============================================================
    // CONCEPTOS DISPONIBLES
    // ============================================================

    const handleCargarConceptos = async () => {
        conceptosDisponibles.value = [];

        conceptoSeleccionado.value = null;

        if (!empresaSeleccionada.value?._id || !cuentaSeleccionada.value?._id) {
            return false;
        }

        cargandoConceptos.value = true;

        try {
            const params = new URLSearchParams();

            params.append('company_id', String(empresaSeleccionada.value._id));

            params.append('cuenta_bancaria_id', String(cuentaSeleccionada.value._id));

            const res = await store.dispatch('api/apiGetToken', {
                direccion: `/estados_cuenta/` + `movimientos/conceptos-disponibles?` + params.toString()
            });

            if (res?.estatus !== 200) {
                conceptosDisponibles.value = [];

                handleToast('error', res?.mensaje || 'No fue posible consultar los conceptos.');

                return false;
            }

            const datos = obtenerDatosRespuesta(res);

            conceptosDisponibles.value = Array.isArray(datos.conceptos) ? datos.conceptos : [];

            return true;
        } catch (error) {
            console.error('ERROR CARGANDO CONCEPTOS:', error);

            conceptosDisponibles.value = [];

            handleToast('error', 'Ocurrió un error al consultar los conceptos.');

            return false;
        } finally {
            cargandoConceptos.value = false;
        }
    };

    // ============================================================
    // LIMPIAR RESULTADO
    // ============================================================

    const handleLimpiarResultado = () => {
        movimientos.value = [];

        movimientosSeleccionados.value = [];

        conceptosDisponibles.value = [];

        conceptoSeleccionado.value = null;

        resumen.value = {
            movimientos: 0,
            total_ingresos: 0,
            total_egresos: 0
        };

        consultado.value = false;

        filtros.value = {
            global: {
                value: null,
                matchMode: 'contains'
            }
        };
    };

    // ============================================================
    // CAMBIAR EMPRESA
    // ============================================================

    const handleCambiarEmpresa = async () => {
        cuentaSeleccionada.value = null;

        cuentasBancarias.value = [];

        handleLimpiarResultado();

        if (!empresaSeleccionada.value?._id) {
            return;
        }

        await handleCargarCuentasEmpresa();
    };

    // ============================================================
    // CAMBIAR CUENTA
    // ============================================================

    const handleCambiarCuenta = () => {
        handleLimpiarResultado();
    };

    // ============================================================
    // VALIDAR CONSULTA
    // ============================================================

    const handleValidarConsulta = () => {
        if (!empresaSeleccionada.value?._id) {
            handleToast('warn', 'Debe seleccionar una empresa.');

            return false;
        }

        if (!cuentaSeleccionada.value) {
            handleToast('warn', 'Debe seleccionar un banco / ' + 'cuenta bancaria.');

            return false;
        }

        if (!fechaInicial.value || !fechaFinal.value) {
            handleToast('warn', 'Debe seleccionar la fecha ' + 'inicial y final.');

            return false;
        }

        if (fechaInicial.value > fechaFinal.value) {
            handleToast('warn', 'La fecha inicial no puede ' + 'ser mayor a la fecha final.');

            return false;
        }

        return true;
    };

    // ============================================================
    // NOMBRE CONCEPTO CONCILIACIÓN
    // ============================================================

    const handleNombreConciliacion = (conciliacion) => {
        if (!conciliacion) {
            return 'Sin conciliar';
        }

        if (typeof conciliacion === 'string') {
            return conciliacion;
        }

        // ========================================================
        // PRIORIDAD:
        // EL CONCEPTO EXACTO SELECCIONADO
        // ========================================================

        if (conciliacion.concepto_nombre) {
            return String(conciliacion.concepto_nombre);
        }

        // ========================================================
        // FALLBACK:
        // ÚLTIMO ELEMENTO DE LA RUTA
        // ========================================================

        if (Array.isArray(conciliacion.ruta) && conciliacion.ruta.length > 0) {
            return String(conciliacion.ruta[conciliacion.ruta.length - 1]);
        }

        // ========================================================
        // OTROS FALLBACKS
        // ========================================================

        if (conciliacion.nombre) {
            return String(conciliacion.nombre);
        }

        if (conciliacion.concepto) {
            return String(conciliacion.concepto);
        }

        return 'Conciliado';
    };

    // ============================================================
    // CONSULTAR MOVIMIENTOS
    // ============================================================

    const handleConsultar = async () => {
        if (!handleValidarConsulta() || consultando.value) {
            return;
        }

        consultando.value = true;

        movimientosSeleccionados.value = [];

        conceptoSeleccionado.value = null;

        try {
            const params = new URLSearchParams();

            params.append('company_id', String(empresaSeleccionada.value._id));

            params.append('clabe_cuenta', String(cuentaSeleccionada.value.clabe_bancaria ?? cuentaSeleccionada.value.clabe_banco ?? ''));

            params.append('fecha_inicial', handleFormatoFechaApi(fechaInicial.value));

            params.append('fecha_final', handleFormatoFechaApi(fechaFinal.value));

            const res = await store.dispatch('api/apiGetToken', {
                direccion: `/estados_cuenta/movimientos?` + params.toString()
            });

            if (res?.estatus !== 200) {
                handleLimpiarResultado();

                handleToast('error', res?.mensaje || 'No fue posible consultar los movimientos bancarios.');

                return;
            }

            const datos = obtenerDatosRespuesta(res);

            movimientos.value = Array.isArray(datos.movimientos) ? datos.movimientos : [];

            resumen.value = {
                movimientos: Number(datos?.resumen?.movimientos ?? movimientos.value.length),

                total_ingresos: Number(datos?.resumen?.total_ingresos ?? 0),

                total_egresos: Number(datos?.resumen?.total_egresos ?? 0)
            };

            consultado.value = true;

            // ================================================
            // CARGAR CONCEPTOS PARA ESA EMPRESA / CUENTA
            // ================================================

            await handleCargarConceptos();
        } catch (error) {
            console.error('ERROR CONSULTANDO MOVIMIENTOS:', error);

            handleLimpiarResultado();

            handleToast('error', 'Ocurrió un error al consultar ' + 'los movimientos bancarios.');
        } finally {
            consultando.value = false;
        }
    };

    // ============================================================
    // OBTENER ID DEL TREESELECT
    // ============================================================

    const handleConceptoIdSeleccionado = () => {
        const valor = conceptoSeleccionado.value;

        if (!valor) {
            return null;
        }

        // PrimeVue single
        if (typeof valor === 'string') {
            return valor;
        }

        // Por compatibilidad si entrega objeto
        if (typeof valor === 'object') {
            if (valor.key) {
                return String(valor.key);
            }

            if (valor._id) {
                return String(valor._id);
            }

            const claves = Object.keys(valor);

            if (claves.length === 1) {
                return claves[0];
            }
        }

        return null;
    };

    // ============================================================
    // APLICAR CONCEPTO
    // ============================================================

    const handleAplicarConcepto = async () => {
        if (aplicandoConcepto.value) {
            return;
        }

        if (movimientosSeleccionados.value.length === 0) {
            handleToast('warn', 'Debe seleccionar al menos ' + 'un movimiento.');

            return;
        }

        const conceptoId = handleConceptoIdSeleccionado();

        if (!conceptoId) {
            handleToast('warn', 'Debe seleccionar un concepto ' + 'de conciliación.');

            return;
        }

        const ids = movimientosSeleccionados.value.map((item) => item?._id).filter(Boolean);

        if (ids.length === 0) {
            handleToast('warn', 'No existen movimientos válidos seleccionados.');

            return;
        }

        aplicandoConcepto.value = true;

        try {
            const res = await store.dispatch('api/apiPutToken', {
                direccion: '/estados_cuenta/movimientos/concepto/masivo',

                datosJson: {
                    concepto_id: conceptoId,

                    movimientos: ids
                }
            });

            if (res?.estatus !== 200) {
                handleToast(
                    res?.estatus === 409 ? 'warn' : 'error',

                    res?.mensaje || 'No fue posible asignar el concepto.'
                );

                return;
            }

            const datos = obtenerDatosRespuesta(res);

            handleToast('success', `Concepto aplicado a ` + `${datos.actualizados ?? ids.length} ` + `movimiento(s).`);

            movimientosSeleccionados.value = [];

            conceptoSeleccionado.value = null;

            // Volver a consultar para traer
            // conciliacion actualizada desde Mongo.
            await handleConsultar();
        } catch (error) {
            console.error('ERROR APLICANDO CONCEPTO:', error);

            handleToast('error', 'Ocurrió un error al aplicar ' + 'el concepto de conciliación.');
        } finally {
            aplicandoConcepto.value = false;
        }
    };

    // ============================================================
    // FORMATO MONEDA
    // ============================================================

    const handleFormatoMoneda = (valor) => {
        const numero = Number(valor ?? 0);

        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number.isNaN(numero) ? 0 : numero);
    };

    // ============================================================
    // CLASE IMPORTE
    // ============================================================

    const handleClaseImporte = (campo, valor) => {
        if (campo === 'ingreso') {
            return 'importe importe-ingreso';
        }

        if (campo === 'egreso') {
            return 'importe importe-egreso';
        }

        if (campo === 'saldo') {
            return 'importe importe-saldo';
        }

        if (Number(valor ?? 0) < 0) {
            return 'importe importe-egreso';
        }

        return 'importe';
    };

    // ============================================================
    // CUENTA ENMASCARADA
    // ============================================================

    const handleCuentaEnmascarada = (valor) => {
        const texto = String(valor ?? '').trim();

        if (!texto) {
            return '-';
        }

        if (texto.length <= 4) {
            return texto;
        }

        return `•••• ` + texto.slice(-4);
    };

    // ============================================================
    // LIMPIAR FILTRO TABLA
    // ============================================================

    const handleLimpiarFiltrosTabla = () => {
        filtros.value = {
            global: {
                value: null,
                matchMode: 'contains'
            }
        };
    };

    // ============================================================
    // RESTABLECER
    // ============================================================

    const handleRestablecer = () => {
        empresaSeleccionada.value = null;

        cuentaSeleccionada.value = null;

        cuentasBancarias.value = [];

        const hoy = new Date();

        fechaInicial.value = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

        fechaFinal.value = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

        handleLimpiarResultado();
    };

    // ============================================================
    // EXPORTAR EXCEL
    // ============================================================

    // ============================================================
    // EXPORTAR EXCEL
    // ============================================================

    const handleExportarExcel = () => {
        // ========================================================
        // VALIDAR MOVIMIENTOS
        // ========================================================

        if (movimientos.value.length === 0) {
            handleToast('warn', 'No existen movimientos para exportar.');

            return;
        }

        // ========================================================
        // COLUMNAS
        // ========================================================

        const columnas = columnasMovimientos.value;

        // ========================================================
        // GENERAR FILAS
        // ========================================================

        const filas = movimientos.value.map((movimiento) => {
            const fila = {};

            columnas.forEach((columna) => {
                let valor = movimiento?.[columna.field] ?? '';

                // ========================================
                // MONEDA
                // ========================================

                if (columna.tipo === 'moneda') {
                    valor = Number(valor ?? 0);

                    if (Number.isNaN(valor)) {
                        valor = 0;
                    }
                }

                // ========================================
                // CONCEPTO CONCILIACIÓN
                // ========================================

                if (columna.tipo === 'conciliacion') {
                    valor = movimiento?.conciliacion ? handleNombreConciliacion(movimiento.conciliacion) : '';
                }

                // ========================================
                // GUARDAR COLUMNA
                // ========================================

                fila[columna.header] = valor;
            });

            return fila;
        });

        // ========================================================
        // CREAR HOJA
        // ========================================================

        const hoja = XLSX.utils.json_to_sheet(filas);

        // ========================================================
        // ANCHO DE COLUMNAS
        // ========================================================

        hoja['!cols'] = columnas.map((columna) => {
            // --------------------------------------------
            // FILA
            // --------------------------------------------

            if (columna.field === 'fila_archivo') {
                return {
                    wch: 10
                };
            }

            // --------------------------------------------
            // FECHA / HORA
            // --------------------------------------------

            if (columna.field === 'fecha_hora') {
                return {
                    wch: 22
                };
            }

            // --------------------------------------------
            // DESCRIPCIÓN
            // --------------------------------------------

            if (columna.field === 'descripcion') {
                return {
                    wch: 45
                };
            }

            // --------------------------------------------
            // DESCRIPCIÓN 2
            // --------------------------------------------

            if (columna.field === 'descripcion_2') {
                return {
                    wch: 38
                };
            }

            // --------------------------------------------
            // CONCEPTO CONCILIACIÓN
            // --------------------------------------------

            if (columna.field === 'conciliacion') {
                return {
                    wch: 30
                };
            }

            // --------------------------------------------
            // CLAVE DE RASTREO
            // --------------------------------------------

            if (columna.field === 'clave_rastreo') {
                return {
                    wch: 32
                };
            }

            // --------------------------------------------
            // REFERENCIA
            // --------------------------------------------

            if (columna.field === 'referencia') {
                return {
                    wch: 22
                };
            }

            // --------------------------------------------
            // IMPORTES
            // --------------------------------------------

            if (columna.tipo === 'moneda') {
                return {
                    wch: 18
                };
            }

            // --------------------------------------------
            // DEFAULT
            // --------------------------------------------

            return {
                wch: 18
            };
        });

        // ========================================================
        // CREAR LIBRO
        // ========================================================

        const libro = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(libro, hoja, 'Movimientos');

        // ========================================================
        // NOMBRE EMPRESA
        // ========================================================

        const empresa = String(empresaSeleccionada.value?.razon_social ?? empresaSeleccionada.value?.razon_social_nombre_completo ?? 'EMPRESA')
            .replace(/[^a-zA-Z0-9_-]+/g, '_')
            .substring(0, 35);

        // ========================================================
        // BANCO
        // ========================================================

        const banco = String(cuentaSeleccionada.value?.clave_banco ?? 'BANCO').replace(/[^a-zA-Z0-9_-]+/g, '_');

        // ========================================================
        // FECHAS
        // ========================================================

        const inicio = handleFormatoFechaApi(fechaInicial.value);

        const fin = handleFormatoFechaApi(fechaFinal.value);

        // ========================================================
        // NOMBRE ARCHIVO
        // ========================================================

        const nombreArchivo = `Movimientos_` + `${empresa}_` + `${banco}_` + `${inicio}_` + `${fin}.xlsx`;

        // ========================================================
        // DESCARGAR
        // ========================================================

        XLSX.writeFile(libro, nombreArchivo);
    };

    // ============================================================
    // MOUNTED
    // ============================================================

    onMounted(async () => {
        await handleCargarEmpresas();
    });

    // ============================================================
    // RETURN
    // ============================================================

    return {
        empresas,
        empresaSeleccionada,
        cargandoEmpresas,

        cuentasBancarias,
        cuentaSeleccionada,
        cargandoCuentas,

        fechaInicial,
        fechaFinal,

        consultando,
        consultado,

        movimientos,
        resumen,

        filtros,

        columnasMovimientos,
        camposBusqueda,

        movimientosSeleccionados,

        conceptosDisponibles,
        conceptoSeleccionado,
        cargandoConceptos,
        aplicandoConcepto,

        handleCambiarEmpresa,
        handleCambiarCuenta,

        handleConsultar,
        handleRestablecer,

        handleLimpiarFiltrosTabla,

        handleAplicarConcepto,

        handleExportarExcel,

        handleFormatoMoneda,
        handleClaseImporte,
        handleCuentaEnmascarada,
        handleNombreConciliacion
    };
};

export default useProceso;
