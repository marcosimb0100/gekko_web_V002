import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import * as XLSX from 'xlsx';

const useProceso = () => {
    const store = useStore();
    const toast = useToast();

    const empresas = ref([]);
    const empresaSeleccionada = ref(null);
    const cargandoEmpresas = ref(false);

    const cuentasBancarias = ref([]);
    const cuentaSeleccionada = ref(null);
    const cargandoCuentas = ref(false);

    const consultando = ref(false);
    const consultado = ref(false);

    const movimientos = ref([]);
    const resumen = ref({
        movimientos: 0,
        total_ingresos: 0,
        total_egresos: 0
    });

    const fechaActual = new Date();

    const fechaInicial = ref(new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1));

    const fechaFinal = ref(new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate()));

    const filtros = ref({
        global: {
            value: null,
            matchMode: 'contains'
        }
    });

    const etiquetasCampos = {
        fila_archivo: 'Fila',
        numero: 'Número',
        fecha: 'Fecha',
        hora: 'Hora',
        fecha_liquidacion: 'Fecha Liquidación',
        descripcion: 'Descripción',
        beneficiario_ordenante: 'Ordenante / Beneficiario',
        banco_movimiento: 'Banco Movimiento',
        cuenta_clabe: 'CLABE / Cuenta Movimiento',
        clave_rastreo: 'Clave de Rastreo',
        referencia: 'Referencia',
        referencia_ampliada: 'Referencia Ampliada',
        clasificacion: 'Clasificación',
        divisa: 'Divisa',
        emisora_serie: 'Emisora Serie',
        cantidad: 'Cantidad',
        plazo: 'Plazo',
        tasa: 'Tasa',
        precio_strike: 'Precio Strike',
        recibo: 'Recibo',
        importe: 'Importe',
        ingreso: 'Ingreso',
        egreso: 'Egreso',
        saldo: 'Saldo',
        clabe_banco: 'Clave Banco',
        clabe_cuenta: 'CLABE Empresa',
        cuenta_banco: 'Cuenta Empresa'
    };

    const camposMoneda = ['importe', 'ingreso', 'egreso', 'saldo', 'cargo', 'abono', 'cargos', 'abonos', 'monto'];

    const camposOcultos = ['clabe_banco', 'clabe_cuenta', 'cuenta_banco'];

    const prioridadColumnas = [
        'fila_archivo',
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
        'recibo',
        'importe',
        'ingreso',
        'egreso',
        'saldo'
    ];

    const handleToast = (severity, detail, summary = 'Notificación') => {
        toast.add({ severity, summary, detail, life: 3500 });
    };

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

    const handleFormatoFechaApi = (fecha) => {
        if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) {
            return '';
        }

        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');

        return `${anio}-${mes}-${dia}`;
    };

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

    const handleLimpiarResultado = () => {
        movimientos.value = [];
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

    const handleCambiarEmpresa = async () => {
        cuentaSeleccionada.value = null;
        cuentasBancarias.value = [];
        handleLimpiarResultado();

        if (!empresaSeleccionada.value?._id) {
            return;
        }

        await handleCargarCuentasEmpresa();
    };

    const handleCambiarCuenta = () => {
        handleLimpiarResultado();
    };

    const handleValidarConsulta = () => {
        if (!empresaSeleccionada.value?._id) {
            handleToast('warn', 'Debe seleccionar una empresa.');
            return false;
        }

        if (!cuentaSeleccionada.value) {
            handleToast('warn', 'Debe seleccionar un banco / cuenta bancaria.');
            return false;
        }

        if (!fechaInicial.value || !fechaFinal.value) {
            handleToast('warn', 'Debe seleccionar la fecha inicial y final.');
            return false;
        }

        if (fechaInicial.value > fechaFinal.value) {
            handleToast('warn', 'La fecha inicial no puede ser mayor a la fecha final.');
            return false;
        }

        return true;
    };

    const handleConsultar = async () => {
        if (!handleValidarConsulta() || consultando.value) {
            return;
        }

        consultando.value = true;

        try {
            const params = new URLSearchParams();

            params.append('company_id', String(empresaSeleccionada.value._id));
            params.append('clabe_cuenta', String(cuentaSeleccionada.value.clabe_bancaria ?? cuentaSeleccionada.value.clabe_banco ?? ''));
            params.append('fecha_inicial', handleFormatoFechaApi(fechaInicial.value));
            params.append('fecha_final', handleFormatoFechaApi(fechaFinal.value));

            const res = await store.dispatch('api/apiGetToken', {
                direccion: `/estados_cuenta/movimientos?${params.toString()}`
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
        } catch (error) {
            console.error('ERROR CONSULTANDO MOVIMIENTOS:', error);
            handleLimpiarResultado();
            handleToast('error', 'Ocurrió un error al consultar los movimientos bancarios.');
        } finally {
            consultando.value = false;
        }
    };

    const tieneValorCampo = (campo) => {
        return movimientos.value.some((movimiento) => {
            const valor = movimiento?.[campo];

            if (valor === null || valor === undefined || valor === '') {
                return false;
            }

            if (camposMoneda.includes(campo)) {
                return Number(valor) !== 0 || campo === 'saldo';
            }

            return true;
        });
    };

    const handleEtiquetaCampo = (campo) => {
        if (etiquetasCampos[campo]) {
            return etiquetasCampos[campo];
        }

        return String(campo ?? '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (letra) => letra.toUpperCase());
    };

    const columnasMovimientos = computed(() => {
        if (movimientos.value.length === 0) {
            return [];
        }

        const campos = new Set();

        movimientos.value.forEach((movimiento) => {
            Object.keys(movimiento ?? {}).forEach((campo) => {
                if (!camposOcultos.includes(campo)) {
                    campos.add(campo);
                }
            });
        });

        const columnas = [...campos]
            .filter((campo) => tieneValorCampo(campo))
            .sort((a, b) => {
                const pa = prioridadColumnas.indexOf(a);
                const pb = prioridadColumnas.indexOf(b);

                if (pa === -1 && pb === -1) {
                    return a.localeCompare(b, 'es');
                }

                if (pa === -1) return 1;
                if (pb === -1) return -1;
                return pa - pb;
            });

        return columnas.map((campo) => {
            let style = 'min-width: 150px';

            if (campo === 'descripcion') style = 'min-width: 300px';
            if (campo === 'beneficiario_ordenante') style = 'min-width: 220px';
            if (campo === 'fecha') style = 'min-width: 105px';
            if (campo === 'hora') style = 'min-width: 90px';
            if (campo === 'fila_archivo' || campo === 'numero') style = 'min-width: 70px';
            if (camposMoneda.includes(campo)) style = 'min-width: 120px';

            return {
                field: campo,
                header: handleEtiquetaCampo(campo),
                tipo: camposMoneda.includes(campo) ? 'moneda' : 'texto',
                style
            };
        });
    });

    const camposBusqueda = computed(() => {
        return columnasMovimientos.value.map((item) => item.field);
    });

    const handleFormatoMoneda = (valor) => {
        const numero = Number(valor ?? 0);

        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number.isNaN(numero) ? 0 : numero);
    };

    const handleClaseImporte = (campo, valor) => {
        if (['ingreso', 'abono', 'abonos'].includes(campo)) {
            return 'importe importe-ingreso';
        }

        if (['egreso', 'cargo', 'cargos'].includes(campo)) {
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

    const handleCuentaEnmascarada = (valor) => {
        const texto = String(valor ?? '').trim();

        if (!texto) return '-';
        if (texto.length <= 4) return texto;

        return `•••• ${texto.slice(-4)}`;
    };

    const handleLimpiarFiltrosTabla = () => {
        filtros.value = {
            global: {
                value: null,
                matchMode: 'contains'
            }
        };
    };

    const handleRestablecer = () => {
        empresaSeleccionada.value = null;
        cuentaSeleccionada.value = null;
        cuentasBancarias.value = [];

        const hoy = new Date();
        fechaInicial.value = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fechaFinal.value = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

        handleLimpiarResultado();
    };

    const handleExportarExcel = () => {
        if (movimientos.value.length === 0) {
            handleToast('warn', 'No existen movimientos para exportar.');
            return;
        }

        const columnas = columnasMovimientos.value;

        const filas = movimientos.value.map((movimiento) => {
            const fila = {};

            columnas.forEach((columna) => {
                let valor = movimiento?.[columna.field] ?? '';

                if (columna.tipo === 'moneda') {
                    valor = Number(valor ?? 0);
                }

                fila[columna.header] = valor;
            });

            return fila;
        });

        const hoja = XLSX.utils.json_to_sheet(filas);

        hoja['!cols'] = columnas.map((columna) => {
            if (columna.field === 'descripcion') return { wch: 42 };
            if (columna.field === 'beneficiario_ordenante') return { wch: 32 };
            if (['clave_rastreo', 'referencia', 'referencia_ampliada'].includes(columna.field)) return { wch: 28 };
            return { wch: 18 };
        });

        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, 'Movimientos');

        const empresa = String(empresaSeleccionada.value?.razon_social ?? empresaSeleccionada.value?.razon_social_nombre_completo ?? 'EMPRESA')
            .replace(/[^a-zA-Z0-9_-]+/g, '_')
            .substring(0, 35);

        const banco = String(cuentaSeleccionada.value?.clave_banco ?? 'BANCO').replace(/[^a-zA-Z0-9_-]+/g, '_');

        const inicio = handleFormatoFechaApi(fechaInicial.value);
        const fin = handleFormatoFechaApi(fechaFinal.value);

        XLSX.writeFile(libro, `Movimientos_${empresa}_${banco}_${inicio}_${fin}.xlsx`);
    };

    onMounted(async () => {
        await handleCargarEmpresas();
    });

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
        handleCambiarEmpresa,
        handleCambiarCuenta,
        handleConsultar,
        handleRestablecer,
        handleLimpiarFiltrosTabla,
        handleExportarExcel,
        handleFormatoMoneda,
        handleClaseImporte,
        handleCuentaEnmascarada
    };
};

export default useProceso;
