import { useToast } from 'primevue/usetoast';

import { computed, onMounted, ref } from 'vue';

import { useStore } from 'vuex';

const useProceso = () => {
    const store = useStore();

    const toast = useToast();

    const empresas = ref([]);

    const empresaSeleccionada = ref(null);

    const tipo = ref(1);

    const facturas = ref([]);

    const facturaSeleccionada = ref(null);

    const movimientos = ref([]);

    const movimientosSeleccionados = ref([]);

    const mostrarDialogo = ref(false);

    const mostrarDetalle = ref(false);

    const mostrarConfirmarDesconciliar = ref(false);

    const detalleConciliaciones = ref([]);

    const conciliacionSeleccionada = ref(null);

    const consultando = ref(false);

    const buscandoMovimientos = ref(false);

    const conciliando = ref(false);

    const consultandoDetalle = ref(false);

    const desconciliando = ref(false);

    const mostrarGlobal = ref(false);

    const analizandoGlobal = ref(false);

    const conciliandoGlobal = ref(false);

    const porcentajeGlobal = ref(72);

    const soloMontoExactoGlobal = ref(true);

    const soloUnicosGlobal = ref(true);

    const resultadosGlobal = ref([]);

    const seleccionGlobal = ref([]);

    const resumenGlobal = ref({
        facturas_analizadas: 0,

        conciliables: 0,

        ambiguas: 0,

        sin_coincidencia: 0
    });

    // ============================================================
    // BUSQUEDA MASIVA POR EXCEL
    // ============================================================
    const mostrarExcel = ref(false);
    const procesandoExcel = ref(false);
    const archivoExcel = ref(null);
    const nombreArchivoExcel = ref('');
    const resultadoExcelProcesado = ref(false);
    const bloquesExcel = ref([]);
    const erroresLayoutExcel = ref([]);

    const resumenExcel = ref({
        bloques: 0,
        facturas_solicitadas: 0,
        facturas_disponibles: 0,
        facturas_no_disponibles: 0,
        facturas_no_encontradas: 0,
        facturas_ambiguas: 0,
        movimientos_encontrados: 0
    });

    const totalProblemasExcel = computed(() => {
        return Number(resumenExcel.value.facturas_no_disponibles || 0) + Number(resumenExcel.value.facturas_no_encontradas || 0) + Number(resumenExcel.value.facturas_ambiguas || 0);
    });

    const hoy = new Date();

    const fechaInicial = ref(new Date(hoy.getFullYear(), hoy.getMonth(), 1));

    const fechaFinal = ref(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));

    const opcionesTipo = [
        { label: 'Emitidas / Cobros', value: 1 },

        { label: 'Recibidas / Pagos a proveedor', value: 2 }
    ];

    const opcionesEstado = [
        { label: 'Todos', value: 'Todos' },

        { label: 'Pendiente', value: 'Pendiente' },

        { label: 'Parcial', value: 'Parcial' },

        { label: 'Conciliada', value: 'Conciliada' }
    ];

    const estadoConciliacion = ref('Todos');

    const filtros = ref({
        global: { value: null, matchMode: 'contains' }
    });

    const camposBusqueda = ['serie', 'folio', 'uuid', 'rfc_contraparte', 'nombre_contraparte', 'metodo_pago', 'estado_pago_cfdi', 'estado_conciliacion_banco'];

    const handleToast = (severity, detail, summary = 'Notificación') => {
        toast.add({ severity, summary, detail, life: 3500 });
    };

    const obtenerDatosRespuesta = (res) => {
        if (res?.datos?.datos && typeof res.datos.datos === 'object') return res.datos.datos;

        if (res?.datos && typeof res.datos === 'object') return res.datos;

        if (res?.data?.datos && typeof res.data.datos === 'object') return res.data.datos;

        if (res?.data && typeof res.data === 'object') return res.data;

        return {};
    };

    const obtenerMensajeRespuesta = (res, fallback = '') => {
        return res?.mensaje || res?.datos?.mensaje || res?.data?.mensaje || fallback;
    };

    const fechaApi = (fecha) => {
        if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return '';

        const y = fecha.getFullYear();

        const m = String(fecha.getMonth() + 1).padStart(2, '0');

        const d = String(fecha.getDate()).padStart(2, '0');

        return `${y}-${m}-${d}`;
    };

    const moneda = (valor) => {
        const numero = Number(valor || 0);

        return new Intl.NumberFormat('es-MX', {
            style: 'currency',

            currency: 'MXN',

            minimumFractionDigits: 2
        }).format(Number.isFinite(numero) ? numero : 0);
    };

    const fechaTexto = (valor) => {
        if (!valor) return '-';

        return String(valor).replace('T', ' ').substring(0, 19);
    };

    const claseEstado = (estado) => {
        const value = String(estado || '').toLowerCase();

        if (value === 'conciliada') return 'estado estado-ok';

        if (value === 'parcial') return 'estado estado-parcial';

        return 'estado estado-pendiente';
    };

    const claseScore = (score) => {
        const n = Number(score || 0);

        if (n >= 85) return 'score score-alto';

        if (n >= 60) return 'score score-medio';

        return 'score score-bajo';
    };

    const totalSeleccionado = computed(() => movimientosSeleccionados.value.reduce((acc, item) => acc + Number(item.monto_aplicar || 0), 0));

    const pendienteFacturaDialogo = computed(() => Number(facturaSeleccionada.value?.pendiente_banco || 0));

    const diferenciaSeleccion = computed(() => pendienteFacturaDialogo.value - totalSeleccionado.value);

    const resumen = computed(() => ({
        facturas: facturas.value.length,

        pendientes: facturas.value.filter((x) => x.estado_conciliacion_banco === 'Pendiente').length,

        parciales: facturas.value.filter((x) => x.estado_conciliacion_banco === 'Parcial').length,

        conciliadas: facturas.value.filter((x) => x.estado_conciliacion_banco === 'Conciliada').length
    }));

    const handleCargarEmpresas = async () => {
        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: '/conciliacion_cfdi_bancaria/empresas'
            });

            if (res?.estatus !== 200) {
                empresas.value = [];

                handleToast('error', obtenerMensajeRespuesta(res, 'No fue posible consultar las empresas.'));

                return;
            }

            const datos = obtenerDatosRespuesta(res);

            empresas.value = Array.isArray(datos.empresas) ? datos.empresas : [];
        } catch (error) {
            console.error(error);

            handleToast('error', 'Ocurrió un error al consultar las empresas.');
        }
    };

    const handleConsultar = async () => {
        if (!empresaSeleccionada.value?._id) {
            handleToast('warn', 'Selecciona una empresa.');

            return;
        }

        if (!fechaInicial.value || !fechaFinal.value) {
            handleToast('warn', 'Selecciona el periodo a consultar.');

            return;
        }

        consultando.value = true;

        try {
            const res = await store.dispatch('api/apiPostToken', {
                direccion: '/conciliacion_cfdi_bancaria/facturas',

                datosJson: {
                    company_id: empresaSeleccionada.value._id,

                    tipo: tipo.value,

                    fecha_inicial: fechaApi(fechaInicial.value),

                    fecha_final: fechaApi(fechaFinal.value),

                    estado_conciliacion: estadoConciliacion.value === 'Todos' ? '' : estadoConciliacion.value,

                    solo_vigentes: true
                }
            });

            if (res?.estatus !== 200) {
                facturas.value = [];

                handleToast('error', obtenerMensajeRespuesta(res, 'No fue posible consultar las facturas.'));

                return;
            }

            const datos = obtenerDatosRespuesta(res);

            facturas.value = Array.isArray(datos.facturas) ? datos.facturas : [];
        } catch (error) {
            console.error(error);

            handleToast('error', 'Ocurrió un error al consultar las facturas.');
        } finally {
            consultando.value = false;
        }
    };

    const handleBuscarMovimientos = async (factura) => {
        facturaSeleccionada.value = factura;

        movimientos.value = [];

        movimientosSeleccionados.value = [];

        buscandoMovimientos.value = true;

        mostrarDialogo.value = true;

        try {
            const res = await store.dispatch('api/apiPostToken', {
                direccion: '/conciliacion_cfdi_bancaria/buscar_movimientos',

                datosJson: {
                    company_id: empresaSeleccionada.value._id,

                    uuid: factura.uuid,

                    tipo: factura.tipo,

                    dias_antes: 5,

                    dias_despues: 90,

                    min_score: 20
                }
            });

            if (res?.estatus !== 200) {
                handleToast('error', obtenerMensajeRespuesta(res, 'No fue posible buscar movimientos.'));

                return;
            }

            const datos = obtenerDatosRespuesta(res);

            movimientos.value = (Array.isArray(datos.movimientos) ? datos.movimientos : []).map((item) => ({
                ...item,

                monto_aplicar: Number(item.monto_sugerido || 0)
            }));
        } catch (error) {
            console.error(error);

            handleToast('error', 'Ocurrió un error al buscar movimientos bancarios.');
        } finally {
            buscandoMovimientos.value = false;
        }
    };

    const handleToggleMovimiento = (item) => {
        const existe = movimientosSeleccionados.value.some((x) => x._id === item._id);

        if (existe && (!item.monto_aplicar || Number(item.monto_aplicar) <= 0)) {
            item.monto_aplicar = Number(item.monto_sugerido || item.monto_disponible || 0);
        }
    };

    const handleConciliar = async () => {
        if (!facturaSeleccionada.value?.uuid) return;

        if (!movimientosSeleccionados.value.length) {
            handleToast('warn', 'Selecciona al menos un movimiento bancario.');

            return;
        }

        const aplicaciones = movimientosSeleccionados.value

            .map((item) => ({
                movimiento_id: item._id,

                monto_aplicado: Number(item.monto_aplicar || 0),

                score: Number(item.score || 0)
            }))

            .filter((item) => item.monto_aplicado > 0);

        if (!aplicaciones.length) {
            handleToast('warn', 'Captura un monto a aplicar mayor a cero.');

            return;
        }

        if (totalSeleccionado.value - pendienteFacturaDialogo.value > 0.01) {
            handleToast('warn', 'El monto seleccionado supera el pendiente bancario de la factura.');

            return;
        }

        conciliando.value = true;

        try {
            const res = await store.dispatch('api/apiPostToken', {
                direccion: '/conciliacion_cfdi_bancaria/conciliar',

                datosJson: {
                    company_id: empresaSeleccionada.value._id,

                    uuid: facturaSeleccionada.value.uuid,

                    tipo: facturaSeleccionada.value.tipo,

                    aplicaciones
                }
            });

            if (res?.estatus !== 200) {
                handleToast('error', obtenerMensajeRespuesta(res, 'No fue posible guardar la conciliación.'));

                return;
            }

            handleToast('success', obtenerMensajeRespuesta(res, 'Conciliación guardada correctamente.'));

            mostrarDialogo.value = false;

            movimientos.value = [];

            movimientosSeleccionados.value = [];

            await handleConsultar();
        } catch (error) {
            console.error(error);

            handleToast('error', 'Ocurrió un error al guardar la conciliación.');
        } finally {
            conciliando.value = false;
        }
    };

    const cargarDetalle = async (factura, abrirDialogo = true) => {
        if (!empresaSeleccionada.value?._id || !factura?.uuid) return;

        facturaSeleccionada.value = factura;

        detalleConciliaciones.value = [];

        consultandoDetalle.value = true;

        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: `/conciliacion_cfdi_bancaria/detalle/${empresaSeleccionada.value._id}/${factura.uuid}`
            });

            if (res?.estatus !== 200) {
                handleToast('error', obtenerMensajeRespuesta(res, 'No fue posible consultar el detalle.'));

                return;
            }

            const datos = obtenerDatosRespuesta(res);

            detalleConciliaciones.value = Array.isArray(datos.conciliaciones) ? datos.conciliaciones : [];

            if (abrirDialogo) {
                mostrarDetalle.value = true;
            }
        } catch (error) {
            console.error(error);

            handleToast('error', 'Ocurrió un error al consultar el detalle.');
        } finally {
            consultandoDetalle.value = false;
        }
    };

    const handleVerDetalle = async (factura) => {
        await cargarDetalle(factura, true);
    };

    const handleSolicitarDesconciliar = (conciliacion) => {
        conciliacionSeleccionada.value = conciliacion;

        mostrarConfirmarDesconciliar.value = true;
    };

    const handleDesconciliar = async () => {
        const conciliacionId = conciliacionSeleccionada.value?._id;

        if (!conciliacionId) {
            handleToast('warn', 'No se encontró la conciliación seleccionada.');

            return;
        }

        desconciliando.value = true;

        try {
            const res = await store.dispatch('api/apiDeleteToken', {
                direccion: `/conciliacion_cfdi_bancaria/desconciliar/${conciliacionId}`
            });

            if (res?.estatus !== 200) {
                handleToast('error', obtenerMensajeRespuesta(res, 'No fue posible desconciliar el movimiento.'));

                return;
            }

            handleToast('success', obtenerMensajeRespuesta(res, 'Conciliación eliminada correctamente.'));

            mostrarConfirmarDesconciliar.value = false;

            mostrarExcel.value = false;

            archivoExcel.value = null;

            nombreArchivoExcel.value = '';

            resetResultadoExcel();

            mostrarGlobal.value = false;

            resultadosGlobal.value = [];

            seleccionGlobal.value = [];

            resumenGlobal.value = {
                facturas_analizadas: 0,

                conciliables: 0,

                ambiguas: 0,

                sin_coincidencia: 0
            };

            mostrarGlobal.value = false;

            resultadosGlobal.value = [];

            seleccionGlobal.value = [];

            conciliacionSeleccionada.value = null;

            const uuidActual = facturaSeleccionada.value?.uuid;

            await handleConsultar();

            const facturaActualizada = facturas.value.find((item) => item.uuid === uuidActual);

            if (facturaActualizada) {
                await cargarDetalle(facturaActualizada, false);
            } else {
                detalleConciliaciones.value = [];

                mostrarDetalle.value = false;
            }
        } catch (error) {
            console.error(error);

            handleToast('error', 'Ocurrió un error al desconciliar. Verifica que tu módulo Vuex tenga la acción apiDeleteToken.');
        } finally {
            desconciliando.value = false;
        }
    };

    const claseEstadoExcel = (estado) => {
        const value = String(estado || '').toLowerCase();

        if (value === 'disponible') return 'estado estado-ok';

        if (value === 'ambigua') return 'estado estado-parcial';

        return 'estado estado-pendiente';
    };

    const handleDescargarLayoutExcel = async () => {
        try {
            // Evita que VITE_API_URL termine con /
            // Ejemplo:
            // http://localhost:7509/api/  -> http://localhost:7509/api
            const urlBase = String(import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

            // Token de sesión
            const token = localStorage.getItem('token');

            // Ruta actual, siguiendo el esquema de seguridad de Gekko
            const rutaActual = window.location.pathname;

            if (!token) {
                showNotification('No se encontró el token de autenticación.', 'error');
                return;
            }

            const response = await fetch(`${urlBase}/conciliacion_cfdi_bancaria/descargar_layout_excel`, {
                method: 'GET',
                headers: {
                    Authorization: token,
                    rutaActual: rutaActual
                }
            });

            // Si el backend respondió con error
            if (!response.ok) {
                let mensaje = 'No fue posible descargar el layout de Excel.';

                try {
                    const error = await response.json();

                    mensaje = error?.mensaje || error?.message || error?.datos?.mensaje || mensaje;
                } catch (error) {
                    // La respuesta no era JSON
                }

                showNotification(mensaje, 'error');
                return;
            }

            // Convertir respuesta a archivo
            const blob = await response.blob();

            if (!blob || blob.size === 0) {
                showNotification('El archivo recibido está vacío.', 'error');
                return;
            }

            // Crear URL temporal
            const downloadUrl = window.URL.createObjectURL(blob);

            // Crear enlace temporal
            const link = document.createElement('a');

            link.href = downloadUrl;
            link.download = 'FiltroMasivo.xlsx';

            document.body.appendChild(link);

            // Descargar
            link.click();

            // Limpiar
            document.body.removeChild(link);

            window.URL.revokeObjectURL(downloadUrl);

            showNotification('Layout de Excel descargado correctamente.', 'success');
        } catch (error) {
            console.error('Error al descargar layout Excel:', error);

            showNotification('No fue posible descargar el layout de Excel.', 'error');
        }
    };

    const resetResultadoExcel = () => {
        resultadoExcelProcesado.value = false;

        bloquesExcel.value = [];

        erroresLayoutExcel.value = [];

        resumenExcel.value = {
            bloques: 0,

            facturas_solicitadas: 0,

            facturas_disponibles: 0,

            facturas_no_disponibles: 0,

            facturas_no_encontradas: 0,

            facturas_ambiguas: 0,

            movimientos_encontrados: 0
        };
    };

    const handleAbrirExcel = () => {
        if (!empresaSeleccionada.value?._id) {
            handleToast('warn', 'Selecciona una empresa y consulta las facturas primero.');

            return;
        }

        archivoExcel.value = null;

        nombreArchivoExcel.value = '';

        resetResultadoExcel();

        mostrarExcel.value = true;
    };

    const handleArchivoExcel = (event) => {
        const archivo = event?.target?.files?.[0] || null;

        resetResultadoExcel();

        if (!archivo) {
            archivoExcel.value = null;

            nombreArchivoExcel.value = '';

            return;
        }

        const nombre = String(archivo.name || '').toLowerCase();

        if (!nombre.endsWith('.xlsx') && !nombre.endsWith('.xlsm')) {
            archivoExcel.value = null;

            nombreArchivoExcel.value = '';

            event.target.value = '';

            handleToast('warn', 'Selecciona un archivo .xlsx o .xlsm.');

            return;
        }

        archivoExcel.value = archivo;

        nombreArchivoExcel.value = archivo.name;
    };

    const handleProcesarExcel = async () => {
        if (!empresaSeleccionada.value?._id) {
            handleToast('warn', 'Selecciona una empresa.');

            return;
        }

        if (!archivoExcel.value) {
            handleToast('warn', 'Selecciona el archivo Excel.');

            return;
        }

        procesandoExcel.value = true;

        resetResultadoExcel();

        try {
            const formData = new FormData();

            formData.append('archivo', archivoExcel.value);

            formData.append('company_id', empresaSeleccionada.value._id);

            formData.append('tipo', String(tipo.value));

            const res = await store.dispatch('api/apiPostTokenFormData', {
                direccion: '/conciliacion_cfdi_bancaria/busqueda_masiva_excel',

                formData
            });

            if (res?.estatus !== 200) {
                handleToast('error', obtenerMensajeRespuesta(res, 'No fue posible procesar el archivo Excel.'));

                return;
            }

            const datos = obtenerDatosRespuesta(res);

            bloquesExcel.value = Array.isArray(datos.bloques) ? datos.bloques : [];

            erroresLayoutExcel.value = Array.isArray(datos.errores_layout) ? datos.errores_layout : [];

            resumenExcel.value = {
                bloques: Number(datos.resumen?.bloques || 0),

                facturas_solicitadas: Number(datos.resumen?.facturas_solicitadas || 0),

                facturas_disponibles: Number(datos.resumen?.facturas_disponibles || 0),

                facturas_no_disponibles: Number(datos.resumen?.facturas_no_disponibles || 0),

                facturas_no_encontradas: Number(datos.resumen?.facturas_no_encontradas || 0),

                facturas_ambiguas: Number(datos.resumen?.facturas_ambiguas || 0),

                movimientos_encontrados: Number(datos.resumen?.movimientos_encontrados || 0)
            };

            resultadoExcelProcesado.value = true;

            handleToast('success', obtenerMensajeRespuesta(res, 'Archivo analizado correctamente.'));
        } catch (error) {
            console.error(error);

            handleToast('error', 'Ocurrió un error al procesar el archivo Excel.');
        } finally {
            procesandoExcel.value = false;
        }
    };

    const handleCerrarExcel = () => {
        if (procesandoExcel.value) return;

        mostrarExcel.value = false;

        archivoExcel.value = null;

        nombreArchivoExcel.value = '';

        resetResultadoExcel();
    };

    const claseEstadoGlobal = (estado) => {
        const value = String(estado || '').toLowerCase();

        if (value === 'conciliable') return 'estado estado-ok';

        if (value === 'ambigua') return 'estado estado-parcial';

        return 'estado estado-pendiente';
    };

    const puedeSeleccionarGlobal = (fila) => {
        return fila?.estado_global === 'Conciliable' && !!fila?.movimiento_id;
    };

    const estaSeleccionadoGlobal = (fila) => {
        if (!fila?.uuid) return false;

        return seleccionGlobal.value.some((item) => item.uuid === fila.uuid);
    };

    const conciliablesGlobal = computed(() => {
        return resultadosGlobal.value.filter(puedeSeleccionarGlobal);
    });

    const cantidadSeleccionadaGlobal = computed(() => {
        return seleccionGlobal.value.filter(puedeSeleccionarGlobal).length;
    });

    const todosGlobalSeleccionados = computed(() => {
        const conciliables = conciliablesGlobal.value;

        if (!conciliables.length) return false;

        return conciliables.every((fila) => seleccionGlobal.value.some((item) => item.uuid === fila.uuid));
    });

    const handleSeleccionGlobal = (fila, seleccionado) => {
        if (!puedeSeleccionarGlobal(fila)) {
            return;
        }

        if (seleccionado) {
            if (!estaSeleccionadoGlobal(fila)) {
                seleccionGlobal.value = [...seleccionGlobal.value, fila];
            }

            return;
        }

        seleccionGlobal.value = seleccionGlobal.value.filter((item) => item.uuid !== fila.uuid);
    };

    const handleSeleccionarTodosGlobal = (seleccionar) => {
        if (seleccionar) {
            seleccionGlobal.value = [...conciliablesGlobal.value];

            return;
        }

        seleccionGlobal.value = [];
    };

    const handleCerrarGlobal = () => {
        if (analizandoGlobal.value || conciliandoGlobal.value) {
            return;
        }

        mostrarGlobal.value = false;

        seleccionGlobal.value = [];

        resultadosGlobal.value = [];

        resumenGlobal.value = {
            facturas_analizadas: 0,

            conciliables: 0,

            ambiguas: 0,

            sin_coincidencia: 0
        };
    };

    const handleAbrirGlobal = () => {
        if (!empresaSeleccionada.value?._id) {
            handleToast('warn', 'Selecciona una empresa y consulta las facturas primero.');

            return;
        }

        if (!facturas.value.length) {
            handleToast('warn', 'Consulta las facturas antes de ejecutar la conciliación global.');

            return;
        }

        porcentajeGlobal.value = Math.max(72, Number(porcentajeGlobal.value || 72));

        resultadosGlobal.value = [];

        seleccionGlobal.value = [];

        resumenGlobal.value = {
            facturas_analizadas: 0,

            conciliables: 0,

            ambiguas: 0,

            sin_coincidencia: 0
        };

        mostrarGlobal.value = true;
    };

    const handleAnalizarGlobal = async () => {
        if (!empresaSeleccionada.value?._id) return;

        porcentajeGlobal.value = Math.max(72, Math.min(100, Number(porcentajeGlobal.value || 72)));

        analizandoGlobal.value = true;

        resultadosGlobal.value = [];

        seleccionGlobal.value = [];

        try {
            const res = await store.dispatch('api/apiPostToken', {
                direccion: '/conciliacion_cfdi_bancaria/analizar_global',

                datosJson: {
                    company_id: empresaSeleccionada.value._id,

                    tipo: tipo.value,

                    fecha_inicial: fechaApi(fechaInicial.value),

                    fecha_final: fechaApi(fechaFinal.value),

                    porcentaje_minimo: porcentajeGlobal.value,

                    solo_monto_exacto: soloMontoExactoGlobal.value,

                    solo_unicos: soloUnicosGlobal.value,

                    dias_antes: 5,

                    dias_despues: 90
                }
            });

            if (res?.estatus !== 200) {
                handleToast('error', obtenerMensajeRespuesta(res, 'No fue posible realizar el análisis global.'));

                return;
            }

            const datos = obtenerDatosRespuesta(res);

            resultadosGlobal.value = Array.isArray(datos.resultados) ? datos.resultados : [];

            resumenGlobal.value = {
                facturas_analizadas: Number(datos.facturas_analizadas || 0),

                conciliables: Number(datos.conciliables || 0),

                ambiguas: Number(datos.ambiguas || 0),

                sin_coincidencia: Number(datos.sin_coincidencia || 0)
            };

            seleccionGlobal.value = resultadosGlobal.value.filter(puedeSeleccionarGlobal);

            if (!resultadosGlobal.value.length) {
                handleToast('info', 'No existen facturas pendientes para analizar.');
            }
        } catch (error) {
            console.error(error);

            handleToast('error', 'Ocurrió un error al realizar el análisis global.');
        } finally {
            analizandoGlobal.value = false;
        }
    };

    const handleConciliarGlobal = async () => {
        const seleccionables = [...seleccionGlobal.value].filter(puedeSeleccionarGlobal);

        if (!seleccionables.length) {
            handleToast('warn', 'Selecciona por lo menos una coincidencia conciliable.');

            return;
        }

        conciliandoGlobal.value = true;

        try {
            const res = await store.dispatch('api/apiPostToken', {
                direccion: '/conciliacion_cfdi_bancaria/conciliar_global',

                datosJson: {
                    company_id: empresaSeleccionada.value._id,

                    tipo: tipo.value,

                    aplicaciones: seleccionables.map((item) => ({
                        uuid: item.uuid,

                        tipo: item.tipo,

                        movimiento_id: item.movimiento_id,

                        monto_aplicado: Number(item.monto_aplicar || 0),

                        score: Number(item.score || 0)
                    }))
                }
            });

            if (res?.estatus !== 200) {
                handleToast('error', obtenerMensajeRespuesta(res, 'No fue posible guardar la conciliación global.'));

                return;
            }

            const datos = obtenerDatosRespuesta(res);

            const errores = Array.isArray(datos.errores) ? datos.errores.length : 0;

            handleToast(errores ? 'warn' : 'success', obtenerMensajeRespuesta(res, 'Conciliación global completada.'));

            mostrarGlobal.value = false;

            resultadosGlobal.value = [];

            seleccionGlobal.value = [];

            await handleConsultar();
        } catch (error) {
            console.error(error);

            handleToast('error', 'Ocurrió un error al guardar la conciliación global.');
        } finally {
            conciliandoGlobal.value = false;
        }
    };

    const handleLimpiar = () => {
        empresaSeleccionada.value = null;

        tipo.value = 1;

        estadoConciliacion.value = 'Todos';

        facturas.value = [];

        facturaSeleccionada.value = null;

        movimientos.value = [];

        movimientosSeleccionados.value = [];

        detalleConciliaciones.value = [];

        conciliacionSeleccionada.value = null;

        mostrarDialogo.value = false;

        mostrarDetalle.value = false;

        mostrarConfirmarDesconciliar.value = false;

        filtros.value.global.value = null;

        fechaInicial.value = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

        fechaFinal.value = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    };

    onMounted(async () => {
        await handleCargarEmpresas();
    });

    return {
        empresas,

        empresaSeleccionada,

        tipo,

        opcionesTipo,

        opcionesEstado,

        estadoConciliacion,

        facturas,

        facturaSeleccionada,

        movimientos,

        movimientosSeleccionados,

        mostrarDialogo,

        mostrarDetalle,

        mostrarConfirmarDesconciliar,

        detalleConciliaciones,

        conciliacionSeleccionada,

        consultando,

        buscandoMovimientos,

        conciliando,

        consultandoDetalle,

        desconciliando,

        mostrarGlobal,

        analizandoGlobal,

        conciliandoGlobal,

        porcentajeGlobal,

        soloMontoExactoGlobal,

        soloUnicosGlobal,

        resultadosGlobal,

        seleccionGlobal,

        resumenGlobal,

        mostrarExcel,

        procesandoExcel,

        archivoExcel,

        nombreArchivoExcel,

        resultadoExcelProcesado,

        bloquesExcel,

        erroresLayoutExcel,

        resumenExcel,

        totalProblemasExcel,

        fechaInicial,

        fechaFinal,

        filtros,

        camposBusqueda,

        resumen,

        totalSeleccionado,

        pendienteFacturaDialogo,

        diferenciaSeleccion,

        moneda,

        fechaTexto,

        claseEstado,

        claseScore,

        handleConsultar,

        handleBuscarMovimientos,

        handleToggleMovimiento,

        handleConciliar,

        handleVerDetalle,

        handleSolicitarDesconciliar,

        handleDesconciliar,

        claseEstadoExcel,

        handleAbrirExcel,

        handleArchivoExcel,

        handleProcesarExcel,

        handleCerrarExcel,

        claseEstadoGlobal,

        puedeSeleccionarGlobal,

        estaSeleccionadoGlobal,

        conciliablesGlobal,

        cantidadSeleccionadaGlobal,

        todosGlobalSeleccionados,

        handleSeleccionGlobal,

        handleSeleccionarTodosGlobal,

        handleCerrarGlobal,

        handleAbrirGlobal,

        handleAnalizarGlobal,

        handleConciliarGlobal,

        handleLimpiar,
        handleDescargarLayoutExcel
    };
};

export default useProceso;
