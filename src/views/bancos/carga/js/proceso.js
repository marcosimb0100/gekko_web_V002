import { computed, onMounted, reactive, ref } from 'vue';

import { useToast } from 'primevue/usetoast';

import { useStore } from 'vuex';

const useProceso = () => {
    // ============================================================
    // STORE / TOAST
    // ============================================================

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
    // ARCHIVO
    // ============================================================

    const archivoSeleccionado = ref(null);

    const fileUpload = ref(null);

    // ============================================================
    // ANALISIS
    // ============================================================

    const analizando = ref(false);

    const resultado = ref(null);

    const movimientos = ref([]);

    const validaciones = ref([]);

    const errores = ref([]);

    // ============================================================
    // FORMULARIO
    // ============================================================

    const frmCarga = reactive({
        anio: new Date().getFullYear()
    });

    // ============================================================
    // AÑOS
    // ============================================================

    const anios = ref([]);

    const handleCargarAnios = () => {
        const actual = new Date().getFullYear();

        anios.value = [];

        for (let anio = actual; anio >= actual - 10; anio--) {
            anios.value.push({
                label: String(anio),

                value: anio
            });
        }
    };

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
    // CAMPOS MONEDA
    // ============================================================

    const camposMoneda = ['ingreso', 'egreso', 'saldo', 'importe', 'cargo', 'abono', 'cargos', 'abonos', 'monto'];

    // ============================================================
    // ETIQUETAS
    // ============================================================

    const etiquetasCampos = {
        numero: 'Número',

        fecha: 'Fecha',

        hora: 'Hora',

        descripcion: 'Descripción',

        referencia: 'Referencia',

        referencia_ampliada: 'Referencia Ampliada',

        beneficiario_ordenante: 'Ordenante / Beneficiario',

        banco_movimiento: 'Banco',

        cuenta_clabe: 'CLABE / Cuenta',

        clave_rastreo: 'Clave de Rastreo',

        ingreso: 'Ingreso',

        egreso: 'Egreso',

        saldo: 'Saldo',

        importe: 'Importe',

        clasificacion: 'Clasificación',

        divisa: 'Divisa',

        fecha_liquidacion: 'Fecha Liquidación',

        emisora_serie: 'Emisora Serie',

        cantidad: 'Cantidad',

        plazo: 'Plazo',

        tasa: 'Tasa',

        precio_strike: 'Precio Strike',

        recibo: 'Recibo'
    };

    // ============================================================
    // TOAST
    // ============================================================

    const handleToast = (severity, detail, summary = 'Notificación') => {
        toast.add({
            severity: severity,

            summary: summary,

            detail: detail,

            life: 3500
        });
    };

    // ============================================================
    // LIMPIAR RESULTADO
    // ============================================================

    const handleLimpiarResultado = () => {
        resultado.value = null;

        movimientos.value = [];

        validaciones.value = [];

        errores.value = [];

        filtros.value = {
            global: {
                value: null,

                matchMode: 'contains'
            }
        };
    };

    // ============================================================
    // LIMPIAR ARCHIVO
    // ============================================================

    const handleLimpiarArchivo = () => {
        archivoSeleccionado.value = null;

        if (fileUpload.value && typeof fileUpload.value.clear === 'function') {
            fileUpload.value.clear();
        }

        handleLimpiarResultado();
    };

    // ============================================================
    // CARGAR EMPRESAS
    // ============================================================

    const handleCargarEmpresas = async () => {
        cargandoEmpresas.value = true;

        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: '/estados_cuenta/empresas'
            });

            if (res.estatus !== 200) {
                empresas.value = [];

                handleToast('error', res.mensaje || 'No fue posible ' + 'consultar las empresas.');

                return false;
            }

            empresas.value = Array.isArray(res.datos?.empresas) ? res.datos.empresas : [];

            return true;
        } catch (error) {
            console.error('ERROR CARGANDO EMPRESAS:', error);

            empresas.value = [];

            handleToast('error', 'Ocurrió un error al ' + 'consultar las empresas.');

            return false;
        } finally {
            cargandoEmpresas.value = false;
        }
    };

    // ============================================================
    // CAMBIO EMPRESA
    // ============================================================

    const handleCambiarEmpresa = async () => {
        // ====================================================
        // LIMPIAR CUENTA
        // ====================================================

        cuentaSeleccionada.value = null;

        cuentasBancarias.value = [];

        // ====================================================
        // LIMPIAR ARCHIVO
        // ====================================================

        handleLimpiarArchivo();

        // ====================================================
        // SIN EMPRESA
        // ====================================================

        if (!empresaSeleccionada.value || !empresaSeleccionada.value._id) {
            return;
        }

        // ====================================================
        // CONSULTAR CUENTAS
        // ====================================================

        await handleCargarCuentasEmpresa();
    };

    // ============================================================
    // CARGAR CUENTAS EMPRESA
    // ============================================================

    const handleCargarCuentasEmpresa = async () => {
        if (!empresaSeleccionada.value?._id) {
            cuentasBancarias.value = [];

            return false;
        }

        cargandoCuentas.value = true;

        try {
            const companyId = empresaSeleccionada.value._id;

            const res = await store.dispatch('api/apiGetToken', {
                direccion: '/estados_cuenta/empresas/' + companyId + '/cuentas'
            });

            if (res.estatus !== 200) {
                cuentasBancarias.value = [];

                handleToast('error', res.mensaje || 'No fue posible consultar ' + 'las cuentas bancarias.');

                return false;
            }

            cuentasBancarias.value = Array.isArray(res.datos?.cuentas) ? res.datos.cuentas : [];

            // =================================================
            // SI SOLO TIENE UNA CUENTA DISPONIBLE
            // LA SELECCIONAMOS AUTOMATICAMENTE
            // =================================================

            if (cuentasBancarias.value.length === 1) {
                cuentaSeleccionada.value = cuentasBancarias.value[0];
            }

            return true;
        } catch (error) {
            console.error('ERROR CARGANDO CUENTAS:', error);

            cuentasBancarias.value = [];

            handleToast('error', 'Ocurrió un error al consultar ' + 'las cuentas bancarias.');

            return false;
        } finally {
            cargandoCuentas.value = false;
        }
    };

    // ============================================================
    // CAMBIO CUENTA
    // ============================================================

    const handleCambiarCuenta = () => {
        handleLimpiarArchivo();
    };

    // ============================================================
    // SELECCIONAR ARCHIVO
    // ============================================================

    const handleSeleccionarArchivo = (event) => {
        const archivos = event.files ?? [];

        if (archivos.length === 0) {
            archivoSeleccionado.value = null;

            return;
        }

        archivoSeleccionado.value = archivos[0];

        handleLimpiarResultado();
    };

    // ============================================================
    // QUITAR ARCHIVO
    // ============================================================

    const handleQuitarArchivo = () => {
        handleLimpiarArchivo();
    };

    // ============================================================
    // VALIDAR ANALISIS
    // ============================================================

    const handleValidarAnalisis = () => {
        if (!empresaSeleccionada.value) {
            handleToast('warn', 'Debe seleccionar una empresa.');

            return false;
        }

        if (!cuentaSeleccionada.value) {
            handleToast('warn', 'Debe seleccionar una ' + 'cuenta bancaria.');

            return false;
        }

        if (!frmCarga.anio) {
            handleToast('warn', 'Debe seleccionar el año.');

            return false;
        }

        if (!archivoSeleccionado.value) {
            handleToast('warn', 'Debe seleccionar un ' + 'estado de cuenta.');

            return false;
        }

        return true;
    };

    // ============================================================
    // ANALIZAR
    // ============================================================

    const handleAnalizar = async () => {
        if (!handleValidarAnalisis()) {
            return;
        }

        if (analizando.value) {
            return;
        }

        analizando.value = true;

        try {
            // =================================================
            // FORMDATA
            // =================================================

            const formData = new FormData();

            // =================================================
            // ARCHIVO
            // =================================================

            formData.append('archivo', archivoSeleccionado.value);

            // =================================================
            // EMPRESA
            // =================================================

            formData.append('company_id', String(empresaSeleccionada.value._id));

            // =================================================
            // CLABE DE LA CUENTA
            // =================================================

            formData.append('clabe_cuenta', String(cuentaSeleccionada.value.clabe_bancaria ?? ''));

            // =================================================
            // CUENTA
            // =================================================

            formData.append('cuenta_banco', String(cuentaSeleccionada.value.cuenta_banco ?? ''));

            // =================================================
            // BANCO
            // =================================================

            formData.append('clabe_banco', String(cuentaSeleccionada.value.clave_banco));

            // =================================================
            // AÑO
            // =================================================

            formData.append('anio', String(frmCarga.anio));

            // =================================================
            // UN SOLO LAYOUT
            //
            // Si solo existe uno, lo mandamos directamente.
            //
            // Si tiene 2 o más:
            // no mandamos layout_id y dejamos que el Helper
            // detecte automáticamente cuál corresponde.
            // =================================================

            if (Array.isArray(cuentaSeleccionada.value.layouts) && cuentaSeleccionada.value.layouts.length === 1) {
                formData.append('layout_id', String(cuentaSeleccionada.value.layouts[0]._id));
            }

            // =================================================
            // DEBUG
            // =================================================

            console.log('==========================================');

            console.log('ANALIZAR ESTADO DE CUENTA');

            console.log('EMPRESA:', empresaSeleccionada.value);

            console.log('CUENTA:', cuentaSeleccionada.value);

            console.log('AÑO:', frmCarga.anio);

            console.log('ARCHIVO:', archivoSeleccionado.value.name);

            console.log('==========================================');

            // =================================================
            // API
            // =================================================

            const res = await store.dispatch('api/apiPostTokenFormData', {
                direccion: '/estados_cuenta/analizar',

                formData: formData
            });

            console.log('RESPUESTA ANALISIS:', res);

            // =================================================
            // ERROR
            // =================================================

            if (res?.estatus !== 200) {
                handleLimpiarResultado();

                handleToast('error', res?.mensaje || 'No fue posible analizar ' + 'el estado de cuenta.');

                return;
            }

            // =================================================
            // DATOS
            // =================================================

            const datos = res.datos ?? {};

            // =================================================
            // VALIDAR RESPUESTA
            // =================================================

            if (!datos || typeof datos !== 'object' || !datos.layout || !datos.archivo) {
                handleLimpiarResultado();

                handleToast('error', 'El servidor respondió ' + 'sin datos del análisis.');

                return;
            }

            // =================================================
            // RESULTADO
            // =================================================

            resultado.value = datos;

            movimientos.value = Array.isArray(datos.movimientos) ? datos.movimientos : [];

            validaciones.value = Array.isArray(datos.validaciones) ? datos.validaciones : [];

            errores.value = Array.isArray(datos.errores) ? datos.errores : [];

            // =================================================
            // OK
            // =================================================

            handleToast('success', res.mensaje || 'Estado de cuenta ' + 'analizado correctamente.');
        } catch (error) {
            console.error('ERROR ANALIZANDO ARCHIVO:', error);

            handleLimpiarResultado();

            handleToast('error', 'Ocurrió un error al analizar ' + 'el estado de cuenta.');
        } finally {
            analizando.value = false;
        }
    };

    // ============================================================
    // NUEVA CARGA
    // ============================================================

    const handleNuevaCarga = () => {
        handleLimpiarResultado();

        empresaSeleccionada.value = null;

        cuentaSeleccionada.value = null;

        cuentasBancarias.value = [];

        archivoSeleccionado.value = null;

        frmCarga.anio = new Date().getFullYear();

        if (fileUpload.value && typeof fileUpload.value.clear === 'function') {
            fileUpload.value.clear();
        }
    };

    // ============================================================
    // LIMPIAR FILTRO
    // ============================================================

    const handleLimpiarFiltro = () => {
        filtros.value = {
            global: {
                value: null,

                matchMode: 'contains'
            }
        };
    };

    // ============================================================
    // METADATA
    // ============================================================

    const metadataArray = computed(() => {
        const metadata = resultado.value?.metadata ?? {};

        return Object.entries(metadata)
            .filter(([campo]) => campo !== 'anio')
            .map(([campo, valor]) => ({
                campo: campo,

                etiqueta: handleEtiquetaCampo(campo),

                valor: handleFormatoMetadata(campo, valor)
            }));
    });

    // ============================================================
    // COLUMNAS
    // ============================================================

    const columnasMovimientos = computed(() => {
        if (movimientos.value.length === 0) {
            return [];
        }

        const campos = new Set();

        movimientos.value.slice(0, 50).forEach((movimiento) => {
            Object.keys(movimiento).forEach((campo) => {
                if (campo !== 'fila_archivo') {
                    campos.add(campo);
                }
            });
        });

        const prioridad = [
            'numero',
            'fecha',
            'hora',
            'fecha_liquidacion',
            'descripcion',
            'beneficiario_ordenante',
            'banco_movimiento',
            'cuenta_clabe',
            'clave_rastreo',
            'referencia',
            'referencia_ampliada',
            'clasificacion',
            'divisa',
            'emisora_serie',
            'cantidad',
            'plazo',
            'tasa',
            'precio_strike',
            'importe',
            'ingreso',
            'egreso',
            'saldo'
        ];

        const ordenados = [...campos].sort((a, b) => {
            const posA = prioridad.indexOf(a);

            const posB = prioridad.indexOf(b);

            if (posA === -1 && posB === -1) {
                return a.localeCompare(b);
            }

            if (posA === -1) {
                return 1;
            }

            if (posB === -1) {
                return -1;
            }

            return posA - posB;
        });

        return ordenados.map((campo) => {
            const esMoneda = camposMoneda.includes(campo);

            let ancho = 'min-width: 160px';

            if (campo === 'descripcion') {
                ancho = 'min-width: 320px';
            }

            if (['fecha', 'hora', 'numero'].includes(campo)) {
                ancho = 'min-width: 110px';
            }

            if (esMoneda) {
                ancho = 'min-width: 135px';
            }

            return {
                field: campo,

                header: handleEtiquetaCampo(campo),

                tipo: esMoneda ? 'moneda' : 'texto',

                style: ancho
            };
        });
    });

    // ============================================================
    // CAMPOS BUSQUEDA
    // ============================================================

    const camposBusqueda = computed(() => {
        return ['fila_archivo', ...columnasMovimientos.value.map((item) => item.field)];
    });

    // ============================================================
    // ETIQUETA
    // ============================================================

    const handleEtiquetaCampo = (campo) => {
        if (etiquetasCampos[campo]) {
            return etiquetasCampos[campo];
        }

        return String(campo ?? '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (letra) => letra.toUpperCase());
    };

    // ============================================================
    // MONEDA
    // ============================================================

    const handleFormatoMoneda = (valor) => {
        const numero = Number(valor ?? 0);

        if (Number.isNaN(numero)) {
            return '$0.00';
        }

        return new Intl.NumberFormat('es-MX', {
            style: 'currency',

            currency: 'MXN',

            minimumFractionDigits: 2,

            maximumFractionDigits: 2
        }).format(numero);
    };

    // ============================================================
    // METADATA FORMATO
    // ============================================================

    const handleFormatoMetadata = (campo, valor) => {
        if (valor === null || valor === undefined || valor === '') {
            return '-';
        }

        if (['saldo_inicial', 'saldo_final', 'total_ingresos', 'total_egresos'].includes(campo)) {
            return handleFormatoMoneda(valor);
        }

        return String(valor);
    };

    // ============================================================
    // TAMAÑO
    // ============================================================

    const handleFormatoTamano = (bytes) => {
        const valor = Number(bytes ?? 0);

        if (valor < 1024) {
            return `${valor} bytes`;
        }

        if (valor < 1024 * 1024) {
            return (valor / 1024).toFixed(2) + ' KB';
        }

        return (valor / 1024 / 1024).toFixed(2) + ' MB';
    };

    // ============================================================
    // TIPO
    // ============================================================

    const handleFormatoTipoArchivo = (tipo) => {
        const catalogo = {
            xls: 'Excel XLS',

            xlsx: 'Excel XLSX',

            excel_xml: 'Excel XML 2003',

            csv: 'CSV',

            csv_semicolon: 'CSV ;',

            txt_tab: 'Texto TAB',

            txt_pipe: 'Texto Pipe',

            txt: 'Texto'
        };

        return catalogo[tipo] ?? tipo ?? '-';
    };

    // ============================================================
    // CLASE IMPORTE
    // ============================================================

    const handleClaseImporte = (campo, valor) => {
        if (campo === 'ingreso' || campo === 'abono' || campo === 'abonos') {
            return 'importe importe-ingreso';
        }

        if (campo === 'egreso' || campo === 'cargo' || campo === 'cargos') {
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

        if (texto.length <= 4) {
            return texto;
        }

        return '•••• ' + texto.slice(-4);
    };

    // ============================================================
    // INIT
    // ============================================================

    onMounted(async () => {
        handleCargarAnios();

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

        archivoSeleccionado,

        fileUpload,

        analizando,

        resultado,

        movimientos,

        validaciones,

        errores,

        frmCarga,

        anios,

        filtros,

        metadataArray,

        columnasMovimientos,

        camposBusqueda,

        handleCambiarEmpresa,

        handleCambiarCuenta,

        handleSeleccionarArchivo,

        handleQuitarArchivo,

        handleAnalizar,

        handleNuevaCarga,

        handleLimpiarFiltro,

        handleFormatoMoneda,

        handleFormatoTamano,

        handleFormatoTipoArchivo,

        handleClaseImporte,

        handleCuentaEnmascarada
    };
};

export default useProceso;
