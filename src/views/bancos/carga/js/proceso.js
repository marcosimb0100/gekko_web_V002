import { useToast } from 'primevue/usetoast';
import { computed, onMounted, reactive, ref } from 'vue';
import { useStore } from 'vuex';

const useProceso = () => {
    const store = useStore();
    const toast = useToast();

    const empresas = ref([]);
    const empresaSeleccionada = ref(null);
    const cargandoEmpresas = ref(false);

    const cuentasBancarias = ref([]);
    const cuentaSeleccionada = ref(null);
    const cargandoCuentas = ref(false);

    const archivoSeleccionado = ref(null);
    const fileUpload = ref(null);

    const analizando = ref(false);
    const guardando = ref(false);
    const resultado = ref(null);
    const movimientos = ref([]);
    const validaciones = ref([]);
    const errores = ref([]);

    // const cargas = ref([]);
    // const cargandoCargas = ref(false);

    const frmCarga = reactive({
        anio: new Date().getFullYear()
    });

    const anios = ref([]);

    const filtros = ref({
        global: {
            value: null,
            matchMode: 'contains'
        }
    });

    // const filtrosCargas = ref({
    //     global: {
    //         value: null,
    //         matchMode: 'contains'
    //     }
    // });

    const camposMoneda = ['ingreso', 'egreso', 'saldo', 'importe', 'cargo', 'abono', 'cargos', 'abonos', 'monto'];

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

    const handleToast = (severity, detail, summary = 'Notificación') => {
        toast.add({ severity, summary, detail, life: 3500 });
    };

    const handleCargarAnios = () => {
        const actual = new Date().getFullYear();
        anios.value = [];

        for (let anio = actual; anio >= actual - 10; anio--) {
            anios.value.push({ label: String(anio), value: anio });
        }
    };

    const obtenerDatosRespuesta = (res) => {
        if (res?.datos?.datos && typeof res.datos.datos === 'object') return res.datos.datos;
        if (res?.datos && typeof res.datos === 'object') return res.datos;
        if (res?.data?.datos && typeof res.data.datos === 'object') return res.data.datos;
        if (res?.data && typeof res.data === 'object') return res.data;
        return {};
    };

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

    const handleLimpiarArchivo = () => {
        archivoSeleccionado.value = null;

        if (fileUpload.value && typeof fileUpload.value.clear === 'function') {
            fileUpload.value.clear();
        }

        handleLimpiarResultado();
    };

    const handleCargarEmpresas = async () => {
        cargandoEmpresas.value = true;

        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: '/estados_cuenta/empresas'
            });

            if (res.estatus !== 200) {
                empresas.value = [];
                handleToast('error', res.mensaje || 'No fue posible consultar las empresas.');
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

    const handleCargarCuentasEmpresa = async () => {
        if (!empresaSeleccionada.value?._id) {
            cuentasBancarias.value = [];
            return false;
        }

        cargandoCuentas.value = true;

        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: `/estados_cuenta/empresas/${empresaSeleccionada.value._id}/cuentas`
            });

            if (res.estatus !== 200) {
                cuentasBancarias.value = [];
                handleToast('error', res.mensaje || 'No fue posible consultar las cuentas bancarias.');
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

    const handleCambiarEmpresa = async () => {
        cuentaSeleccionada.value = null;
        cuentasBancarias.value = [];
        handleLimpiarArchivo();

        if (!empresaSeleccionada.value?._id) return;
        await handleCargarCuentasEmpresa();
    };

    const handleCambiarCuenta = () => {
        handleLimpiarArchivo();
    };

    const handleSeleccionarArchivo = (event) => {
        archivoSeleccionado.value = event.files?.[0] ?? null;
        handleLimpiarResultado();
    };

    const handleQuitarArchivo = () => {
        handleLimpiarArchivo();
    };

    const handleValidarAnalisis = () => {
        if (!empresaSeleccionada.value) {
            handleToast('warn', 'Debe seleccionar una empresa.');
            return false;
        }

        if (!cuentaSeleccionada.value) {
            handleToast('warn', 'Debe seleccionar una cuenta bancaria.');
            return false;
        }

        if (!frmCarga.anio) {
            handleToast('warn', 'Debe seleccionar el año.');
            return false;
        }

        if (!archivoSeleccionado.value) {
            handleToast('warn', 'Debe seleccionar un estado de cuenta.');
            return false;
        }

        return true;
    };

    const crearFormDataCarga = (usarLayoutDetectado = false) => {
        const formData = new FormData();

        formData.append('archivo', archivoSeleccionado.value);
        formData.append('company_id', String(empresaSeleccionada.value._id));
        formData.append('clabe_cuenta', String(cuentaSeleccionada.value.clabe_bancaria ?? cuentaSeleccionada.value.clabe_banco ?? ''));
        formData.append('cuenta_banco', String(cuentaSeleccionada.value.cuenta_banco ?? ''));
        formData.append('clabe_banco', String(cuentaSeleccionada.value.clave_banco ?? ''));
        formData.append('anio', String(frmCarga.anio));

        if (usarLayoutDetectado && resultado.value?.layout?._id) {
            formData.append('layout_id', String(resultado.value.layout._id));
        } else if (Array.isArray(cuentaSeleccionada.value.layouts) && cuentaSeleccionada.value.layouts.length === 1) {
            formData.append('layout_id', String(cuentaSeleccionada.value.layouts[0]._id));
        }

        return formData;
    };

    const handleAnalizar = async () => {
        if (!handleValidarAnalisis() || analizando.value) return;

        analizando.value = true;

        try {
            const formData = crearFormDataCarga(false);

            const res = await store.dispatch('api/apiPostTokenFormData', {
                direccion: '/estados_cuenta/analizar',
                formData
            });

            if (res?.estatus !== 200) {
                handleLimpiarResultado();
                handleToast('error', res?.mensaje || 'No fue posible analizar el estado de cuenta.');
                return;
            }

            const datos = obtenerDatosRespuesta(res);

            if (!datos || typeof datos !== 'object' || !datos.layout || !datos.archivo) {
                handleLimpiarResultado();
                handleToast('error', 'El servidor respondió sin los datos completos del análisis.');
                return;
            }

            resultado.value = datos;
            movimientos.value = Array.isArray(datos.movimientos) ? datos.movimientos : [];
            validaciones.value = Array.isArray(datos.validaciones) ? datos.validaciones : [];
            errores.value = Array.isArray(datos.errores) ? datos.errores : [];

            handleToast('success', res?.mensaje || 'Estado de cuenta analizado correctamente.');
        } catch (error) {
            console.error('ERROR ANALIZANDO ARCHIVO:', error);
            handleLimpiarResultado();
            handleToast('error', 'Ocurrió un error al analizar el estado de cuenta.');
        } finally {
            analizando.value = false;
        }
    };

    const handleGuardar = async () => {
        if (!resultado.value) {
            handleToast('warn', 'Primero debe analizar el estado de cuenta.');
            return;
        }

        if (!handleValidarAnalisis() || guardando.value) return;

        guardando.value = true;

        try {
            const formData = crearFormDataCarga(true);

            const res = await store.dispatch('api/apiPostTokenFormData', {
                direccion: '/estados_cuenta/guardar',
                formData
            });

            if (res?.estatus !== 200) {
                handleToast(res?.estatus === 409 ? 'warn' : 'error', res?.mensaje || 'No fue posible guardar el estado de cuenta.');
                return;
            }

            const datos = obtenerDatosRespuesta(res);

            handleToast('success', `Estado de cuenta guardado. Nuevos: ${datos.insertados ?? 0}. Duplicados: ${datos.duplicados ?? 0}.`);

            // await handleCargarHistorial();
        } catch (error) {
            console.error('ERROR GUARDANDO ESTADO DE CUENTA:', error);
            handleToast('error', 'Ocurrió un error al guardar el estado de cuenta.');
        } finally {
            guardando.value = false;
        }
    };

    // const handleCargarHistorial = async () => {
    //     cargandoCargas.value = true;

    //     try {
    //         const res = await store.dispatch('api/apiGetToken', {
    //             direccion: '/estados_cuenta/cargas'
    //         });

    //         if (res.estatus !== 200) {
    //             cargas.value = [];
    //             return false;
    //         }

    //         const datos = obtenerDatosRespuesta(res);
    //         cargas.value = Array.isArray(datos.cargas) ? datos.cargas : [];
    //         return true;
    //     } catch (error) {
    //         console.error('ERROR CARGANDO HISTORIAL:', error);
    //         cargas.value = [];
    //         return false;
    //     } finally {
    //         cargandoCargas.value = false;
    //     }
    // };

    // const handleEliminarCarga = async (carga) => {
    //     if (!carga?._id) return;

    //     const confirmar = window.confirm(`¿Desea eliminar la carga del archivo "${carga.archivo?.nombre_original ?? ''}"?\n\nSe borrará el archivo físico y únicamente los movimientos que no pertenezcan a otra carga.`);

    //     if (!confirmar) return;

    //     try {
    //         const res = await store.dispatch('api/apiPostToken', {
    //             direccion: `/estados_cuenta/cargas/${carga._id}/eliminar`,
    //             datosJson: {}
    //         });

    //         if (res.estatus !== 200) {
    //             handleToast('error', res.mensaje || 'No fue posible eliminar la carga.');
    //             return;
    //         }

    //         handleToast('success', res.mensaje || 'Carga eliminada correctamente.');
    //         await handleCargarHistorial();
    //     } catch (error) {
    //         console.error('ERROR ELIMINANDO CARGA:', error);
    //         handleToast('error', 'Ocurrió un error al eliminar la carga.');
    //     }
    // };

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

    const handleLimpiarFiltro = () => {
        filtros.value = {
            global: {
                value: null,
                matchMode: 'contains'
            }
        };
    };

    // const handleLimpiarFiltroCargas = () => {
    //     filtrosCargas.value = {
    //         global: {
    //             value: null,
    //             matchMode: 'contains'
    //         }
    //     };
    // };

    const handleEtiquetaCampo = (campo) => {
        if (etiquetasCampos[campo]) return etiquetasCampos[campo];

        return String(campo ?? '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (letra) => letra.toUpperCase());
    };

    const handleFormatoMoneda = (valor) => {
        const numero = Number(valor ?? 0);

        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number.isNaN(numero) ? 0 : numero);
    };

    const handleFormatoMetadata = (campo, valor) => {
        if (valor === null || valor === undefined || valor === '') return '-';

        if (['saldo_inicial', 'saldo_final', 'total_ingresos', 'total_egresos'].includes(campo)) {
            return handleFormatoMoneda(valor);
        }

        return String(valor);
    };

    const handleFormatoTamano = (bytes) => {
        const valor = Number(bytes ?? 0);
        if (valor < 1024) return `${valor} bytes`;
        if (valor < 1024 * 1024) return `${(valor / 1024).toFixed(2)} KB`;
        return `${(valor / 1024 / 1024).toFixed(2)} MB`;
    };

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

    const handleClaseImporte = (campo, valor) => {
        if (campo === 'ingreso' || campo === 'abono' || campo === 'abonos') return 'importe importe-ingreso';
        if (campo === 'egreso' || campo === 'cargo' || campo === 'cargos') return 'importe importe-egreso';
        if (campo === 'saldo') return 'importe importe-saldo';
        if (Number(valor ?? 0) < 0) return 'importe importe-egreso';
        return 'importe';
    };

    const handleCuentaEnmascarada = (valor) => {
        const texto = String(valor ?? '').trim();
        if (texto.length <= 4) return texto;
        return `•••• ${texto.slice(-4)}`;
    };

    const metadataArray = computed(() => {
        const metadata = resultado.value?.metadata ?? {};

        return Object.entries(metadata)
            .filter(([campo]) => campo !== 'anio')
            .map(([campo, valor]) => ({
                campo,
                etiqueta: handleEtiquetaCampo(campo),
                valor: handleFormatoMetadata(campo, valor)
            }));
    });

    const columnasMovimientos = computed(() => {
        if (movimientos.value.length === 0) return [];

        const campos = new Set();

        movimientos.value.slice(0, 50).forEach((movimiento) => {
            Object.keys(movimiento).forEach((campo) => {
                if (campo !== 'fila_archivo') campos.add(campo);
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

        return [...campos]
            .sort((a, b) => {
                const posA = prioridad.indexOf(a);
                const posB = prioridad.indexOf(b);
                if (posA === -1 && posB === -1) return a.localeCompare(b);
                if (posA === -1) return 1;
                if (posB === -1) return -1;
                return posA - posB;
            })
            .map((campo) => {
                const esMoneda = camposMoneda.includes(campo);
                let ancho = 'min-width: 160px';
                if (campo === 'descripcion') ancho = 'min-width: 320px';
                if (['fecha', 'hora', 'numero'].includes(campo)) ancho = 'min-width: 110px';
                if (esMoneda) ancho = 'min-width: 135px';

                return {
                    field: campo,
                    header: handleEtiquetaCampo(campo),
                    tipo: esMoneda ? 'moneda' : 'texto',
                    style: ancho
                };
            });
    });

    const camposBusqueda = computed(() => ['fila_archivo', ...columnasMovimientos.value.map((item) => item.field)]);

    onMounted(async () => {
        handleCargarAnios();
        await Promise.all([handleCargarEmpresas(), handleCargarHistorial()]);
    });

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
        guardando,
        resultado,
        movimientos,
        validaciones,
        errores,
        // cargas,
        // cargandoCargas,
        frmCarga,
        anios,
        filtros,
        // filtrosCargas,
        metadataArray,
        columnasMovimientos,
        camposBusqueda,
        handleCambiarEmpresa,
        handleCambiarCuenta,
        handleSeleccionarArchivo,
        handleQuitarArchivo,
        handleAnalizar,
        handleGuardar,
        handleNuevaCarga,
        // handleCargarHistorial,
        // handleEliminarCarga,
        handleLimpiarFiltro,
        // handleLimpiarFiltroCargas,
        handleFormatoMoneda,
        handleFormatoTamano,
        handleFormatoTipoArchivo,
        handleClaseImporte,
        handleCuentaEnmascarada
    };
};

export default useProceso;
