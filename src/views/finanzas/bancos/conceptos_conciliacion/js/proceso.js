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

    const empresas = ref([]);

    const bancos = ref([]);

    const buscar = ref('');

    const cargando = ref(false);

    const guardando = ref(false);

    const visibleFormulario = ref(false);

    const expandedKeys = ref({});

    // ============================================================
    // FORM
    // ============================================================

    const frmConcepto = reactive({
        _id: null,

        parent_id: null,

        nombre: '',

        clave: '',

        descripcion: '',

        orden: 1,

        empresas: [],

        bancos: [],

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
        frmConcepto._id = null;

        frmConcepto.parent_id = null;

        frmConcepto.nombre = '';

        frmConcepto.clave = '';

        frmConcepto.descripcion = '';

        frmConcepto.orden = 1;

        frmConcepto.empresas = [];

        frmConcepto.bancos = [];

        frmConcepto.activo = true;
    };

    // ============================================================
    // CATÁLOGOS
    // ============================================================

    const handleCargarCatalogos = async () => {
        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: '/conciliacion_bancaria/conceptos/catalogos'
            });

            if (res?.estatus !== 200) {
                empresas.value = [];

                bancos.value = [];

                handleToast('error', res?.mensaje || 'No fue posible consultar los catálogos.');

                return false;
            }

            const datos = obtenerDatosRespuesta(res);

            empresas.value = Array.isArray(datos.empresas) ? datos.empresas : [];

            bancos.value = Array.isArray(datos.bancos)
                ? datos.bancos.map((item) => ({
                      ...item,

                      label: `${item.banco || 'BANCO'}` + ` · ${item.cuenta_banco || item.clabe_banco || ''}` + ` · ${item.empresa || ''}`
                  }))
                : [];

            return true;
        } catch (error) {
            console.error('ERROR CATÁLOGOS:', error);

            empresas.value = [];

            bancos.value = [];

            handleToast('error', 'Ocurrió un error al consultar los catálogos.');

            return false;
        }
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
    // NIVEL 1
    // ============================================================

    const esNivelUno = computed(() => !frmConcepto.parent_id);

    // ============================================================
    // BANCOS DISPONIBLES
    // ============================================================

    const bancosDisponibles = computed(() => {
        const empresasIds = frmConcepto.empresas.map((item) => String(item));

        if (empresasIds.length === 0) {
            return [];
        }

        return bancos.value.filter((item) => empresasIds.includes(String(item.company_id)));
    });

    // ============================================================
    // CAMBIAR EMPRESAS
    // ============================================================

    const handleCambiarEmpresas = () => {
        const permitidos = new Set(bancosDisponibles.value.map((item) => String(item._id)));

        frmConcepto.bancos = frmConcepto.bancos.filter((item) => permitidos.has(String(item)));
    };

    // ============================================================
    // CAMBIAR PADRE
    // ============================================================

    const handleCambiarPadre = () => {
        if (frmConcepto.parent_id) {
            frmConcepto.empresas = [];

            frmConcepto.bancos = [];
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

        frmConcepto.orden = Number(concepto.orden || 1);

        frmConcepto.empresas = Array.isArray(concepto.empresas) ? [...concepto.empresas] : [];

        frmConcepto.bancos = Array.isArray(concepto.bancos) ? [...concepto.bancos] : [];

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
        parent_id: frmConcepto.parent_id || null,

        nombre: String(frmConcepto.nombre || '')
            .trim()
            .toUpperCase(),

        clave: String(frmConcepto.clave || '')
            .trim()
            .toUpperCase(),

        descripcion: String(frmConcepto.descripcion || '').trim(),

        orden: Number(frmConcepto.orden || 1),

        empresas: esNivelUno.value ? [...frmConcepto.empresas] : [],

        bancos: esNivelUno.value ? [...frmConcepto.bancos] : [],

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

            const empresasTexto = (data.empresas_detalle || []).map((item) => item.nombre).join(' ');

            const bancosTexto = (data.bancos_detalle || []).map((item) => `${item.banco} ${item.cuenta_banco} ${item.clabe_banco}`).join(' ');

            const contenido = [data.nombre, data.clave, data.descripcion, empresasTexto, bancosTexto].join(' ').toLowerCase();

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
    // CUENTA CORTA
    // ============================================================

    const handleCuentaCorta = (cuenta) => {
        const valor = String(cuenta || '');

        if (valor.length <= 4) {
            return valor || '-';
        }

        return '••••' + valor.slice(-4);
    };

    // ============================================================
    // TOTAL
    // ============================================================

    const totalConceptos = computed(() => conceptos.value.length);

    // ============================================================
    // MOUNTED
    // ============================================================

    onMounted(async () => {
        await Promise.all([handleCargarCatalogos(), handleConsultar()]);
    });

    return {
        conceptos,
        arbol,
        empresas,
        bancos,

        buscar,

        cargando,
        guardando,

        visibleFormulario,

        expandedKeys,

        frmConcepto,

        esNivelUno,

        bancosDisponibles,

        opcionesPadres,

        arbolFiltrado,

        totalConceptos,

        handleNuevo,
        handleNuevoHijo,
        handleEditar,
        handleGuardar,
        handleEliminar,

        handleCambiarPadre,
        handleCambiarEmpresas,

        handleExpandirTodo,
        handleContraerTodo,

        handleCuentaCorta
    };
};

export default useProceso;
