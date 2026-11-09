import { onMounted, reactive, ref } from 'vue';

import { useToast } from 'primevue/usetoast';

import { useStore } from 'vuex';

const useProceso = () => {
    const store = useStore();

    const toast = useToast();

    // ============================================================
    // VARIABLES
    // ============================================================

    const bancos = ref([]);

    const bancoSeleccionado = ref(null);

    const mostrarFormulario = ref(false);

    const cargando = ref(false);

    const guardando = ref(false);

    // ============================================================
    // FILTROS
    // ============================================================

    const filtros = ref({
        global: {
            value: null,
            matchMode: 'contains'
        }
    });

    const filtrosLayouts = ref({
        global: {
            value: null,
            matchMode: 'contains'
        }
    });

    // ============================================================
    // CATÁLOGOS
    // ============================================================

    const catalogoTiposArchivo = ref([
        {
            label: 'CSV',
            value: 'csv'
        },
        {
            label: 'Excel XLS',
            value: 'xls'
        },
        {
            label: 'Excel XLSX',
            value: 'xlsx'
        },
        {
            label: 'Excel XML 2003',
            value: 'excel_xml'
        },
        {
            label: 'Texto TAB',
            value: 'txt_tab'
        },
        {
            label: 'Texto',
            value: 'txt'
        }
    ]);

    const catalogoOrden = ref([
        {
            label: 'Ascendente',
            value: 'asc'
        },
        {
            label: 'Descendente',
            value: 'desc'
        }
    ]);

    const catalogoSeparadores = ref([
        {
            label: 'Coma (,)',
            value: ','
        },
        {
            label: 'Punto y coma (;)',
            value: ';'
        },
        {
            label: 'Tabulador',
            value: 'TAB'
        },
        {
            label: 'Pipe (|)',
            value: '|'
        },
        {
            label: 'Espacios',
            value: 'ESPACIO'
        }
    ]);

    const catalogoModoHoja = ref([
        {
            label: 'Primera hoja',
            value: 'primera'
        },
        {
            label: 'Nombre exacto',
            value: 'nombre'
        },
        {
            label: 'Nombre contiene',
            value: 'contiene'
        }
    ]);

    const catalogoTiposDato = ref([
        {
            label: 'Texto',
            value: 'texto'
        },
        {
            label: 'Fecha',
            value: 'fecha'
        },
        {
            label: 'Hora',
            value: 'hora'
        },
        {
            label: 'Moneda',
            value: 'moneda'
        },
        {
            label: 'Entero',
            value: 'entero'
        }
    ]);

    // ============================================================
    // FORMULARIO
    // ============================================================

    const frmLayout = reactive({
        _id: null,

        clabe_banco: '',

        nombre: '',

        descripcion: '',

        orden_layout: 1,

        tipo_archivo: 'csv',

        tipos_reales: [],

        extensiones: [],

        extensionesTexto: '',

        separador: '',

        fila_encabezados: 1,

        fila_inicial: 2,

        orden: 'asc',

        filas_vacias_fin: 5,

        hoja: {
            modo: 'primera',
            valor: ''
        },

        encabezadosArray: [],

        columnas: [],

        metadataArray: [],

        validaciones: {
            saldo: false,
            totales: false,
            tolerancia: 0.05
        },

        activo: true
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
    // CARGAR BANCOS
    // ============================================================

    const handleCargarBancos = async () => {
        cargando.value = true;

        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: '/estados_cuenta/bancos'
            });

            if (res.estatus === 200) {
                bancos.value = res.datos?.bancos ?? res.datos?.datos?.bancos ?? [];

                return true;
            }

            bancos.value = [];

            handleToast('error', res.mensaje || 'No fue posible ' + 'consultar los bancos.');

            return false;
        } catch (error) {
            console.error('ERROR CARGANDO BANCOS:', error);

            bancos.value = [];

            handleToast('error', 'Ocurrió un error ' + 'al consultar los bancos.');

            return false;
        } finally {
            cargando.value = false;
        }
    };

    // ============================================================
    // BUSCAR BANCO
    // ============================================================

    const handleBuscarBancoPorClave = (clabe) => {
        return bancos.value.find((item) => String(item.clabe_banco) === String(clabe)) ?? null;
    };

    // ============================================================
    // ABRIR BANCO
    // ============================================================

    const handleAbrirBanco = (banco) => {
        bancoSeleccionado.value = banco;

        filtrosLayouts.value = {
            global: {
                value: null,
                matchMode: 'contains'
            }
        };

        // if (!banco.configurado) {
        //     handleNuevoLayout();
        // }
    };

    // ============================================================
    // REGRESAR
    // ============================================================

    const handleRegresar = () => {
        bancoSeleccionado.value = null;

        mostrarFormulario.value = false;

        handleLimpiarFormulario();
    };

    // ============================================================
    // FILTROS
    // ============================================================

    const handleLimpiarFiltro = () => {
        filtros.value = {
            global: {
                value: null,
                matchMode: 'contains'
            }
        };
    };

    const handleLimpiarFiltroLayouts = () => {
        filtrosLayouts.value = {
            global: {
                value: null,
                matchMode: 'contains'
            }
        };
    };

    // ============================================================
    // LIMPIAR FORMULARIO
    // ============================================================

    const handleLimpiarFormulario = () => {
        frmLayout._id = null;

        frmLayout.clabe_banco = bancoSeleccionado.value?.clabe_banco ?? '';

        frmLayout.nombre = '';

        frmLayout.descripcion = '';

        frmLayout.orden_layout = (bancoSeleccionado.value?.layouts?.length ?? 0) + 1;

        frmLayout.tipo_archivo = 'csv';

        frmLayout.tipos_reales = ['csv'];

        frmLayout.extensiones = ['.csv'];

        frmLayout.extensionesTexto = '.csv';

        frmLayout.separador = ',';

        frmLayout.fila_encabezados = 1;

        frmLayout.fila_inicial = 2;

        frmLayout.orden = 'asc';

        frmLayout.filas_vacias_fin = 5;

        frmLayout.hoja = {
            modo: 'primera',
            valor: ''
        };

        frmLayout.encabezadosArray = [];

        frmLayout.columnas = [];

        frmLayout.metadataArray = [];

        frmLayout.validaciones = {
            saldo: false,
            totales: false,
            tolerancia: 0.05
        };

        frmLayout.activo = true;
    };

    // ============================================================
    // NUEVO
    // ============================================================

    const handleNuevoLayout = () => {
        if (!bancoSeleccionado.value) {
            handleToast('warn', 'Debe seleccionar un banco.');

            return;
        }

        handleLimpiarFormulario();

        // ========================================================
        // PRECONFIGURACION PEIBO
        // ========================================================

        if (String(bancoSeleccionado.value.clabe_banco) === '732') {
            frmLayout.nombre = 'PEIBO Estado de Cuenta';

            frmLayout.descripcion = 'Estado de cuenta PEIBO formato XLS';

            frmLayout.tipo_archivo = 'xls';

            frmLayout.tipos_reales = ['xls'];

            frmLayout.extensiones = ['.xls'];

            frmLayout.extensionesTexto = '.xls';

            frmLayout.separador = '';

            frmLayout.fila_encabezados = 17;

            frmLayout.fila_inicial = 18;

            frmLayout.orden = 'asc';

            frmLayout.filas_vacias_fin = 5;

            frmLayout.hoja = {
                modo: 'contiene',
                valor: 'EdoCta'
            };

            frmLayout.encabezadosArray = [
                {
                    indice: 0,
                    texto: '#'
                },
                {
                    indice: 1,
                    texto: 'Fecha'
                },
                {
                    indice: 2,
                    texto: 'Hora'
                },
                {
                    indice: 3,
                    texto: 'Ordenante/Beneficiario'
                },
                {
                    indice: 4,
                    texto: 'Banco'
                },
                {
                    indice: 5,
                    texto: 'CLABE/TDD'
                },
                {
                    indice: 6,
                    texto: 'Clave de Rastreo'
                },
                {
                    indice: 7,
                    texto: 'Descripción'
                },
                {
                    indice: 8,
                    texto: 'Referencia'
                },
                {
                    indice: 9,
                    texto: 'Montos Recibidos'
                },
                {
                    indice: 10,
                    texto: 'Montos Enviados'
                },
                {
                    indice: 11,
                    texto: 'Saldo'
                }
            ];

            frmLayout.columnas = [
                {
                    campo: 'numero',
                    indice: 0,
                    tipo: 'entero'
                },
                {
                    campo: 'fecha',
                    indice: 1,
                    tipo: 'fecha'
                },
                {
                    campo: 'hora',
                    indice: 2,
                    tipo: 'hora'
                },
                {
                    campo: 'beneficiario_ordenante',
                    indice: 3,
                    tipo: 'texto'
                },
                {
                    campo: 'banco_movimiento',
                    indice: 4,
                    tipo: 'texto'
                },
                {
                    campo: 'cuenta_clabe',
                    indice: 5,
                    tipo: 'texto'
                },
                {
                    campo: 'clave_rastreo',
                    indice: 6,
                    tipo: 'texto'
                },
                {
                    campo: 'descripcion',
                    indice: 7,
                    tipo: 'texto'
                },
                {
                    campo: 'referencia',
                    indice: 8,
                    tipo: 'texto'
                },
                {
                    campo: 'ingreso',
                    indice: 9,
                    tipo: 'moneda'
                },
                {
                    campo: 'egreso',
                    indice: 10,
                    tipo: 'moneda'
                },
                {
                    campo: 'saldo',
                    indice: 11,
                    tipo: 'moneda'
                }
            ];
        }

        mostrarFormulario.value = true;
    };

    // ============================================================
    // CANCELAR
    // ============================================================

    const handleCancelarFormulario = () => {
        mostrarFormulario.value = false;

        handleLimpiarFormulario();
    };

    // ============================================================
    // EDITAR
    // ============================================================

    const handleEditar = (layout) => {
        handleLimpiarFormulario();

        frmLayout._id = layout._id ?? null;

        frmLayout.clabe_banco = bancoSeleccionado.value?.clabe_banco ?? '';

        frmLayout.nombre = layout.nombre ?? '';

        frmLayout.descripcion = layout.descripcion ?? '';

        frmLayout.orden_layout = Number(layout.orden_layout ?? 1);

        frmLayout.tipo_archivo = layout.tipo_archivo ?? 'csv';

        frmLayout.tipos_reales = [...(layout.tipos_reales ?? [])];

        frmLayout.extensiones = [...(layout.extensiones ?? [])];

        frmLayout.extensionesTexto = frmLayout.extensiones.join(', ');

        frmLayout.separador = layout.separador ?? '';

        frmLayout.fila_encabezados = Number(layout.fila_encabezados ?? 1);

        frmLayout.fila_inicial = Number(layout.fila_inicial ?? 2);

        frmLayout.orden = layout.orden ?? 'asc';

        frmLayout.filas_vacias_fin = Number(layout.filas_vacias_fin ?? 5);

        frmLayout.hoja = {
            modo: layout.hoja?.modo ?? 'primera',

            valor: layout.hoja?.valor ?? ''
        };

        frmLayout.encabezadosArray = Object.entries(layout.encabezados ?? {}).map(([indice, texto]) => ({
            indice: Number(indice),
            texto: texto
        }));

        frmLayout.columnas = Object.entries(layout.columnas ?? {}).map(([campo, config]) => ({
            campo: campo,
            indice: Number(config.indice ?? 0),
            tipo: config.tipo ?? 'texto'
        }));

        frmLayout.metadataArray = Object.entries(layout.metadata ?? {}).map(([campo, config]) => ({
            campo: campo,
            celda: config.celda ?? '',
            tipo: config.tipo ?? 'texto',
            regex: config.regex ?? ''
        }));

        frmLayout.validaciones = {
            saldo: layout.validaciones?.saldo === true,

            totales: layout.validaciones?.totales === true,

            tolerancia: Number(layout.validaciones?.tolerancia ?? 0.05)
        };

        frmLayout.activo = layout.activo !== false;

        mostrarFormulario.value = true;
    };

    // ============================================================
    // CAMBIAR TIPO ARCHIVO
    // ============================================================

    const handleCambiarTipoArchivo = () => {
        const tipo = frmLayout.tipo_archivo;

        switch (tipo) {
            case 'csv':
                frmLayout.tipos_reales = ['csv'];

                frmLayout.extensionesTexto = '.csv';

                frmLayout.separador = ',';

                break;

            case 'xls':
                frmLayout.tipos_reales = ['xls'];

                frmLayout.extensionesTexto = '.xls';

                frmLayout.separador = '';

                break;

            case 'xlsx':
                frmLayout.tipos_reales = ['xlsx'];

                frmLayout.extensionesTexto = '.xlsx';

                frmLayout.separador = '';

                break;

            case 'excel_xml':
                frmLayout.tipos_reales = ['excel_xml'];

                frmLayout.extensionesTexto = '.xls';

                frmLayout.separador = '';

                break;

            case 'txt_tab':
                frmLayout.tipos_reales = ['txt_tab'];

                frmLayout.extensionesTexto = '.txt';

                frmLayout.separador = 'TAB';

                break;

            case 'txt':
                frmLayout.tipos_reales = ['txt'];

                frmLayout.extensionesTexto = '.txt';

                frmLayout.separador = '';

                break;
        }
    };

    // ============================================================
    // ENCABEZADOS
    // ============================================================

    const handleAgregarEncabezado = () => {
        frmLayout.encabezadosArray.push({
            indice: frmLayout.encabezadosArray.length,

            texto: ''
        });
    };

    const handleEliminarEncabezado = (index) => {
        frmLayout.encabezadosArray.splice(index, 1);
    };

    // ============================================================
    // COLUMNAS
    // ============================================================

    const handleAgregarColumna = () => {
        let indice = 0;

        if (frmLayout.columnas.length > 0) {
            indice = Math.max(...frmLayout.columnas.map((item) => Number(item.indice ?? 0))) + 1;
        }

        frmLayout.columnas.push({
            campo: '',
            indice: indice,
            tipo: 'texto'
        });
    };

    const handleEliminarColumna = (index) => {
        frmLayout.columnas.splice(index, 1);
    };

    // ============================================================
    // METADATA
    // ============================================================

    const handleAgregarMetadata = () => {
        frmLayout.metadataArray.push({
            campo: '',
            celda: '',
            tipo: 'texto',
            regex: ''
        });
    };

    const handleEliminarMetadata = (index) => {
        frmLayout.metadataArray.splice(index, 1);
    };

    // ============================================================
    // ES EXCEL
    // ============================================================

    const handleEsExcel = () => {
        return ['xls', 'xlsx', 'excel_xml'].includes(frmLayout.tipo_archivo);
    };

    // ============================================================
    // FORMATO ARCHIVO
    // ============================================================

    const handleFormatoArchivo = (tipo) => {
        const item = catalogoTiposArchivo.value.find((registro) => registro.value === tipo);

        return item?.label ?? tipo ?? '';
    };

    // ============================================================
    // VALIDAR
    // ============================================================

    const handleValidarFormulario = () => {
        if (!frmLayout.nombre.trim()) {
            handleToast('warn', 'El nombre del layout es obligatorio.');

            return false;
        }

        if (Number(frmLayout.fila_inicial) <= Number(frmLayout.fila_encabezados)) {
            handleToast('warn', 'La fila inicial ' + 'debe ser posterior ' + 'a la fila de encabezados.');

            return false;
        }

        const campos = new Set();

        for (const columna of frmLayout.columnas) {
            const campo = String(columna.campo ?? '').trim();

            if (!campo) {
                handleToast('warn', 'Todas las columnas deben tener un campo.');

                return false;
            }

            if (campos.has(campo)) {
                handleToast('warn', `El campo "${campo}" está repetido.`);

                return false;
            }

            campos.add(campo);
        }

        return true;
    };

    // ============================================================
    // PREPARAR EXTENSIONES
    // ============================================================

    const handlePrepararExtensiones = () => {
        return [
            ...new Set(
                String(frmLayout.extensionesTexto ?? '')
                    .split(',')
                    .map((item) => item.trim().toLowerCase())
                    .filter(Boolean)
                    .map((item) => (item.startsWith('.') ? item : `.${item}`))
            )
        ];
    };

    // ============================================================
    // PREPARAR ENCABEZADOS
    // ============================================================

    const handlePrepararEncabezados = () => {
        const encabezados = {};

        frmLayout.encabezadosArray.forEach((item) => {
            if (String(item.texto ?? '').trim()) {
                encabezados[String(Number(item.indice))] = String(item.texto).trim();
            }
        });

        return encabezados;
    };

    // ============================================================
    // PREPARAR COLUMNAS
    // ============================================================

    const handlePrepararColumnas = () => {
        const columnas = {};

        frmLayout.columnas.forEach((item) => {
            columnas[String(item.campo).trim()] = {
                indice: Number(item.indice),
                tipo: item.tipo
            };
        });

        return columnas;
    };

    // ============================================================
    // PREPARAR METADATA
    // ============================================================

    const handlePrepararMetadata = () => {
        const metadata = {};

        frmLayout.metadataArray.forEach((item) => {
            const campo = String(item.campo ?? '').trim();

            if (!campo) {
                return;
            }

            metadata[campo] = {
                celda: String(item.celda ?? '').trim(),

                tipo: item.tipo ?? 'texto'
            };

            if (String(item.regex ?? '').trim()) {
                metadata[campo].regex = String(item.regex).trim();
            }
        });

        return metadata;
    };

    // ============================================================
    // PREPARAR DATOS
    // ============================================================

    const handlePrepararDatos = () => {
        const datos = {
            clabe_banco: String(bancoSeleccionado.value.clabe_banco),

            nombre: frmLayout.nombre.trim(),

            descripcion: String(frmLayout.descripcion ?? '').trim(),

            orden_layout: Number(frmLayout.orden_layout ?? 1),

            tipo_archivo: frmLayout.tipo_archivo,

            tipos_reales: [...(frmLayout.tipos_reales ?? [])],

            extensiones: handlePrepararExtensiones(),

            fila_encabezados: Number(frmLayout.fila_encabezados),

            fila_inicial: Number(frmLayout.fila_inicial),

            orden: frmLayout.orden,

            filas_vacias_fin: Number(frmLayout.filas_vacias_fin ?? 5),

            encabezados: handlePrepararEncabezados(),

            columnas: handlePrepararColumnas(),

            metadata: handlePrepararMetadata(),

            validaciones: {
                saldo: frmLayout.validaciones.saldo === true,

                totales: frmLayout.validaciones.totales === true,

                tolerancia: Number(frmLayout.validaciones.tolerancia ?? 0.05)
            },

            activo: frmLayout.activo === true
        };

        if (frmLayout.separador) {
            datos.separador = frmLayout.separador;
        }

        if (handleEsExcel()) {
            datos.hoja = {
                modo: frmLayout.hoja.modo,

                valor: frmLayout.hoja.valor ?? ''
            };
        }

        return datos;
    };

    // ============================================================
    // GUARDAR
    // ============================================================

    const handleGuardar = async () => {
        if (!handleValidarFormulario()) {
            return;
        }

        if (guardando.value) {
            return;
        }

        guardando.value = true;

        try {
            const datos = handlePrepararDatos();

            console.log('LAYOUT A GUARDAR:', datos);

            let res;

            if (frmLayout._id) {
                res = await store.dispatch('api/apiPutToken', {
                    direccion: '/estados_cuenta' + '/layouts/' + frmLayout._id,

                    datosJson: datos
                });
            } else {
                res = await store.dispatch('api/apiPostToken', {
                    direccion: '/estados_cuenta/layouts',

                    datosJson: datos
                });
            }

            if (res.estatus !== 200) {
                handleToast('error', res.mensaje || 'No fue posible ' + 'guardar el layout.');

                return;
            }

            handleToast('success', res.mensaje || 'Layout guardado correctamente.');

            const clabe = bancoSeleccionado.value.clabe_banco;

            mostrarFormulario.value = false;

            await handleCargarBancos();

            bancoSeleccionado.value = handleBuscarBancoPorClave(clabe);

            handleLimpiarFormulario();
        } catch (error) {
            console.error('ERROR GUARDANDO LAYOUT:', error);

            handleToast('error', 'Ocurrió un error al guardar el layout.');
        } finally {
            guardando.value = false;
        }
    };

    // ============================================================
    // INIT
    // ============================================================

    onMounted(async () => {
        await handleCargarBancos();
    });

    // ============================================================
    // RETURN
    // ============================================================

    return {
        bancos,

        bancoSeleccionado,

        mostrarFormulario,

        cargando,

        guardando,

        filtros,

        filtrosLayouts,

        frmLayout,

        catalogoTiposArchivo,

        catalogoOrden,

        catalogoSeparadores,

        catalogoModoHoja,

        catalogoTiposDato,

        handleAbrirBanco,

        handleRegresar,

        handleLimpiarFiltro,

        handleLimpiarFiltroLayouts,

        handleNuevoLayout,

        handleCancelarFormulario,

        handleEditar,

        handleCambiarTipoArchivo,

        handleAgregarEncabezado,

        handleEliminarEncabezado,

        handleAgregarColumna,

        handleEliminarColumna,

        handleAgregarMetadata,

        handleEliminarMetadata,

        handleEsExcel,

        handleFormatoArchivo,

        handleGuardar
    };
};

export default useProceso;
