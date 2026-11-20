import { useToast } from 'primevue/usetoast';

import { computed, onMounted, reactive, ref } from 'vue';

import { useStore } from 'vuex';

const useProceso = () => {
    const store = useStore();

    const toast = useToast();

    // ============================================================
    // VARIABLES
    // ============================================================

    const conceptos = ref([]);

    const arbol = ref([]);

    const buscar = ref('');
    const vista = ref('lista');
    const tipoBloqueado = ref(false);
    const tiposCatalogo = [
        { nombre: 'Lista sencilla', valor: 'lista' },
        { nombre: 'Agrupado', valor: 'agrupado' },
        { nombre: 'Especial 1', valor: 'especial_1' }
    ];
    const camposReporte = [
        { campo: 'saldos_diarios', nombre: 'Saldos diarios' },
        { campo: 'detalle', nombre: 'Detalle' },
        { campo: 'gastos_informe', nombre: 'Gastos informe' },
        { campo: 'tipo', nombre: 'Tipo' },
        { campo: 'presentacion', nombre: 'Presentación' },
        { campo: 'numero_catalogo', nombre: 'Número de catálogo' }
    ];

    const cargando = ref(false);

    const guardando = ref(false);

    const visibleFormulario = ref(false);

    const expandedKeys = ref({});

    // ============================================================
    // FORM
    // ============================================================

    const frmConcepto = reactive({
        clasificacion_reportes: {},
        _id: null,

        parent_id: null,

        nombre: '',

        clave: '',

        descripcion: '',

        orden: 1,

        activo: true
    });

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
    // RESET
    // ============================================================

    const handleLimpiarFormulario = () => {
        frmConcepto.clasificacion_reportes = Object.fromEntries(camposReporte.map(({ campo }) => [campo, '']));
        frmConcepto._id = null;

        frmConcepto.parent_id = null;

        frmConcepto.nombre = '';

        frmConcepto.clave = '';

        frmConcepto.descripcion = '';

        frmConcepto.orden = 1;

        frmConcepto.activo = true;
    };

    // ============================================================
    // CONSULTAR
    // ============================================================

    const handleConsultar = async () => {
        cargando.value = true;

        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: '/conciliacion_bancaria/conceptos?incluir_inactivos=true'
            });

            if (res?.estatus !== 200) {
                conceptos.value = [];

                arbol.value = [];

                handleToast('error', res?.mensaje || 'No fue posible consultar los conceptos.');

                return false;
            }

            const datos = obtenerDatosRespuesta(res);

            conceptos.value = Array.isArray(datos.conceptos) ? datos.conceptos : [];

            arbol.value = Array.isArray(datos.arbol) ? datos.arbol : [];
            tipoBloqueado.value = datos.configuracion?.bloqueado === true;
            if (datos.configuracion?.tipo) vista.value = datos.configuracion.tipo;

            return true;
        } catch (error) {
            console.error('ERROR CONSULTANDO CONCEPTOS:', error);

            conceptos.value = [];

            arbol.value = [];

            handleToast('error', 'Ocurrió un error al consultar los conceptos.');

            return false;
        } finally {
            cargando.value = false;
        }
    };

    // ============================================================
    // DESCENDIENTES
    // ============================================================

    const idsDescendientes = computed(() => {
        if (!frmConcepto._id) {
            return [];
        }

        return conceptos.value.filter((item) => Array.isArray(item.ancestros) && item.ancestros.some((id) => String(id) === String(frmConcepto._id))).map((item) => String(item._id));
    });

    // ============================================================
    // OPCIONES DE PADRE
    // ============================================================

    const opcionesPadres = computed(() => {
        const excluidos = new Set([String(frmConcepto._id || ''), ...idsDescendientes.value]);

        return conceptos.value
            .filter((item) => item.activo && !excluidos.has(String(item._id)))
            .map((item) => ({
                _id: item._id,

                nivel: item.nivel,

                label: `${'— '.repeat(Math.max(Number(item.nivel) - 1, 0))}` + `${item.nombre}`
            }))
            .sort((a, b) => {
                if (a.nivel !== b.nivel) {
                    return a.nivel - b.nivel;
                }

                return a.label.localeCompare(b.label, 'es');
            });
    });

    // ============================================================
    // NUEVO
    // ============================================================

    const handleNuevo = () => {
        handleLimpiarFormulario();

        visibleFormulario.value = true;
    };

    // ============================================================
    // NUEVO HIJO
    // ============================================================

    const handleNuevoHijo = (concepto) => {
        if (vista.value !== 'agrupado') return;
        handleLimpiarFormulario();

        frmConcepto.parent_id = concepto._id;

        visibleFormulario.value = true;
    };

    // ============================================================
    // EDITAR
    // ============================================================

    const handleEditar = (concepto) => {
        handleLimpiarFormulario();

        frmConcepto._id = concepto._id;

        frmConcepto.parent_id = concepto.parent_id || null;

        frmConcepto.nombre = concepto.nombre || '';

        frmConcepto.clave = concepto.clave || '';

        frmConcepto.descripcion = concepto.descripcion || '';
        frmConcepto.clasificacion_reportes = Object.fromEntries(camposReporte.map(({ campo }) => [campo, concepto.clasificacion_reportes?.[campo] || '']));

        frmConcepto.orden = Number(concepto.orden || 1);

        frmConcepto.activo = concepto.activo !== false;

        visibleFormulario.value = true;
    };

    // ============================================================
    // VALIDAR
    // ============================================================

    const handleValidar = () => {
        if (!String(frmConcepto.nombre || '').trim()) {
            handleToast('warn', 'Ingrese el nombre del concepto.');

            return false;
        }

        if (Number(frmConcepto.orden) <= 0) {
            handleToast('warn', 'El orden debe ser mayor a cero.');

            return false;
        }

        return true;
    };

    // ============================================================
    // PAYLOAD
    // ============================================================

    const handlePayload = () => ({
        tipo_catalogo: vista.value,
        ...(vista.value === 'especial_1' ? { clasificacion_reportes: Object.fromEntries(camposReporte.map(({ campo }) => [campo, String(frmConcepto.clasificacion_reportes[campo] || '').trim().toUpperCase()])) } : {}),
        parent_id: frmConcepto.parent_id || null,

        nombre: String(frmConcepto.nombre || '')
            .trim()
            .toUpperCase(),

        clave: String(frmConcepto.clave || '')
            .trim()
            .toUpperCase(),

        descripcion: String(frmConcepto.descripcion || '').trim(),

        orden: Number(frmConcepto.orden || 1),

        activo: frmConcepto.activo !== false
    });

    // ============================================================
    // GUARDAR
    // ============================================================

    const handleGuardar = async () => {
        if (!handleValidar()) {
            return;
        }

        guardando.value = true;

        try {
            const payload = handlePayload();

            let res = null;

            // ----------------------------------------------------
            // EDITAR
            // ----------------------------------------------------

            if (frmConcepto._id) {
                res = await store.dispatch('api/apiPutToken', {
                    direccion: `/conciliacion_bancaria/conceptos/${frmConcepto._id}`,

                    datosJson: payload
                });
            }

            // ----------------------------------------------------
            // NUEVO
            // ----------------------------------------------------
            else {
                res = await store.dispatch('api/apiPostToken', {
                    direccion: '/conciliacion_bancaria/conceptos',

                    datosJson: payload
                });
            }

            if (res?.estatus !== 200) {
                handleToast(
                    res?.estatus === 409 ? 'warn' : 'error',

                    res?.mensaje || 'No fue posible guardar el concepto.'
                );

                return false;
            }

            handleToast('success', res?.mensaje || 'Concepto guardado correctamente.');

            visibleFormulario.value = false;

            await handleConsultar();

            return true;
        } catch (error) {
            console.error('ERROR GUARDANDO CONCEPTO:', error);

            handleToast('error', 'Ocurrió un error al guardar el concepto.');

            return false;
        } finally {
            guardando.value = false;
        }
    };

    // ============================================================
    // ELIMINAR / DESACTIVAR
    // ============================================================

    const handleEliminar = async (concepto) => {
        if (!concepto?._id) {
            return;
        }

        const confirmar = window.confirm(`¿Desea desactivar el concepto "${concepto.nombre}"?`);

        if (!confirmar) {
            return;
        }

        try {
            const res = await store.dispatch('api/apiDeleteToken', {
                direccion: `/conciliacion_bancaria/conceptos/${concepto._id}`
            });

            if (res?.estatus !== 200) {
                handleToast(
                    res?.estatus === 409 ? 'warn' : 'error',

                    res?.mensaje || 'No fue posible desactivar el concepto.'
                );

                return false;
            }

            handleToast('success', res?.mensaje || 'Concepto desactivado correctamente.');

            await handleConsultar();

            return true;
        } catch (error) {
            console.error('ERROR DESACTIVANDO:', error);

            handleToast('error', 'Ocurrió un error al desactivar el concepto.');

            return false;
        }
    };

    // ============================================================
    // FILTRAR ÁRBOL
    // ============================================================

    const filtrarNodos = (nodos, texto) => {
        const resultado = [];

        nodos.forEach((nodo) => {
            const data = nodo.data || {};

            const contenido = [data.nombre, data.clave, data.descripcion, ...Object.values(data.clasificacion_reportes || {})].join(' ').toLowerCase();

            const hijos = filtrarNodos(nodo.children || [], texto);

            if (contenido.includes(texto) || hijos.length > 0) {
                resultado.push({
                    ...nodo,
                    children: hijos.length > 0 ? hijos : nodo.children
                });
            }
        });

        return resultado;
    };

    const arbolFiltrado = computed(() => {
        const texto = String(buscar.value || '')
            .trim()
            .toLowerCase();

        if (vista.value !== 'agrupado') {
            const filas = [];
            const recorrer = (nodos, ruta = []) => nodos.forEach((nodo) => {
                const camino = [...ruta, nodo.data.nombre];
                const contenido = [camino.join(' / '), nodo.data.clave, nodo.data.descripcion, ...Object.values(nodo.data.clasificacion_reportes || {})].join(' ').toLowerCase();
                if (!nodo.data.agrupador && (!texto || contenido.includes(texto))) {
                    filas.push({ ...nodo, data: { ...nodo.data, ruta_texto: camino.join(' / ') }, children: [] });
                }
                recorrer(nodo.children || [], camino);
            });
            recorrer(arbol.value);
            return filas;
        }
        if (!texto) {
            return arbol.value;
        }

        return filtrarNodos(arbol.value, texto);
    });

    // ============================================================
    // EXPANDIR
    // ============================================================

    const obtenerKeys = (nodos, resultado = {}) => {
        nodos.forEach((nodo) => {
            resultado[nodo.key] = true;

            if (nodo.children?.length) {
                obtenerKeys(nodo.children, resultado);
            }
        });

        return resultado;
    };

    const handleExpandirTodo = () => {
        expandedKeys.value = obtenerKeys(arbol.value, {});
    };

    const handleContraerTodo = () => {
        expandedKeys.value = {};
    };

    // ============================================================
    // TOTAL
    // ============================================================

    const totalConceptos = computed(() => conceptos.value.length);

    // ============================================================
    // MOUNTED
    // ============================================================

    onMounted(handleConsultar);

    return {
        conceptos,
        arbol,

        buscar,
        vista,
        tipoBloqueado,
        tiposCatalogo,
        camposReporte,

        cargando,
        guardando,

        visibleFormulario,

        expandedKeys,

        frmConcepto,

        opcionesPadres,

        arbolFiltrado,

        totalConceptos,

        handleNuevo,
        handleNuevoHijo,
        handleEditar,
        handleGuardar,
        handleEliminar,

        handleExpandirTodo,
        handleContraerTodo
    };
};

export default useProceso;
