import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, nextTick, reactive, ref } from 'vue';
import { useStore } from 'vuex';

const frmPerfilInit = () => ({
    _id: '',
    nombre_perfil: '',
    activo: true
});

const useProceso = () => {
    const store = useStore();
    const toast = useToast();

    const filtros = ref({
        global: {
            value: null,
            matchMode: FilterMatchMode.CONTAINS
        }
    });

    const tablaPerfiles = ref([]);
    const menus = ref([]);
    const arbolMenus = ref([]);
    const menusSeleccionados = ref({});

    const mostrarTablaFormulario = ref(false);
    const movimiento = ref('');

    const frmPerfil = reactive(frmPerfilInit());

    // -------------------------------------------------------------------------
    // PERFILES
    // -------------------------------------------------------------------------

    const handleCargarPerfiles = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/perfiles/perfiles`
        });

        if (res.estatus === 200) {
            tablaPerfiles.value = res.datos?.perfiles ?? [];
        } else {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }
    };

    // -------------------------------------------------------------------------
    // MENUS
    // -------------------------------------------------------------------------

    const handleConstruirArbolMenus = () => {
        const obtenerOrden = (item) => {
            if (item.tipo_menu === 'N1') return Number(item.orden_N1 ?? 0);
            if (item.tipo_menu === 'N2') return Number(item.orden_N2 ?? 0);
            if (item.tipo_menu === 'N3') return Number(item.orden_N3 ?? 0);

            return 0;
        };

        const construirHijos = (idPadre) => {
            return menus.value
                .filter((item) => String(item.id_menu_padre) === String(idPadre))
                .sort((a, b) => obtenerOrden(a) - obtenerOrden(b))
                .map((item) => {
                    const children = construirHijos(item.id_menu);

                    const nodo = {
                        key: String(item.id_menu),
                        tipo: item.tipo_menu,
                        label: item.etiqueta,
                        icon: item.icono,
                        path: item.path,
                        url: item.url
                    };

                    if (children.length > 0) {
                        nodo.children = children;
                    }

                    return nodo;
                });
        };

        arbolMenus.value = menus.value
            .filter((item) => item.id_menu_padre === null || item.id_menu_padre === '')
            .sort((a, b) => Number(a.orden_N1 ?? 0) - Number(b.orden_N1 ?? 0))
            .map((item) => {
                const children = construirHijos(item.id_menu);

                const nodo = {
                    key: String(item.id_menu),
                    tipo: item.tipo_menu,
                    label: item.etiqueta,
                    icon: item.icono,
                    path: item.path,
                    url: item.url
                };

                if (children.length > 0) {
                    nodo.children = children;
                }

                return nodo;
            });
    };

    const handleCargarMenus = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/perfiles/menus`
        });

        if (res.estatus !== 200) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });

            return;
        }

        menus.value = res.datos?.menus ?? [];

        handleConstruirArbolMenus();
    };

    // -------------------------------------------------------------------------
    // FILTRO
    // -------------------------------------------------------------------------

    const handleLimpiarFiltro = () => {
        filtros.value.global.value = null;
    };

    // -------------------------------------------------------------------------
    // LIMPIAR FORMULARIO
    // -------------------------------------------------------------------------

    const handleLimpiarFormulario = async () => {
        Object.assign(frmPerfil, frmPerfilInit());

        menusSeleccionados.value = {};

        await nextTick();
    };

    // -------------------------------------------------------------------------
    // MOSTRAR FORMULARIO
    // -------------------------------------------------------------------------

    const handleMostrarFormulario = async (tipo, data) => {
        if (tipo === 'N') {
            await handleLimpiarFormulario();

            movimiento.value = 'N';
            frmPerfil.activo = true;

            mostrarTablaFormulario.value = true;
        } else if (tipo === 'E') {
            await handleLimpiarFormulario();

            movimiento.value = 'E';

            const res = await store.dispatch('api/apiGetToken', {
                direccion: `/perfiles/perfiles_id/${data._id}`
            });

            if (res.estatus !== 200) {
                toast.add({
                    severity: 'error',
                    summary: 'Notificación',
                    detail: res.mensaje,
                    life: 3000
                });

                return;
            }

            const perfil = res.datos?.perfil;

            Object.assign(frmPerfil, {
                _id: perfil?._id ?? '',
                nombre_perfil: perfil?.nombre_perfil ?? '',
                activo: perfil?.activo ?? false
            });

            menusSeleccionados.value = perfil?.menus_seleccionados ?? {};

            mostrarTablaFormulario.value = true;
        } else if (tipo === 'C') {
            mostrarTablaFormulario.value = false;
            movimiento.value = '';

            await handleLimpiarFormulario();
            await handleCargarPerfiles();
        }
    };

    // -------------------------------------------------------------------------
    // GENERAR MENU DEL PERFIL
    // -------------------------------------------------------------------------

    const handleGenerarMenuPerfil = () => {
        const seleccionados = Object.keys(menusSeleccionados.value);

        const listaUrl = [];

        const procesarNodos = (nodos) => {
            const resultado = [];

            nodos.forEach((nodo) => {
                const seleccionado = seleccionados.includes(String(nodo.key));

                const children = procesarNodos(nodo.children ?? []);

                if (!seleccionado && children.length === 0) {
                    return;
                }

                const item = {
                    label: nodo.label,
                    icon: nodo.icon
                };

                // -------------------------------------------------
                // N1
                // -------------------------------------------------

                if (nodo.tipo === 'N1') {
                    if (nodo.path) {
                        item.path = nodo.path;
                    }

                    if (children.length > 0) {
                        item.items = children;
                    }
                }

                // -------------------------------------------------
                // N2
                // -------------------------------------------------
                else if (nodo.tipo === 'N2') {
                    item.class = 'icon-cyan';

                    // N2 CON N3
                    if (children.length > 0) {
                        if (nodo.path) {
                            item.path = nodo.path;
                        }

                        item.items = children;
                    }

                    // N2 NORMAL
                    else {
                        if (nodo.url) {
                            item.to = nodo.url;

                            listaUrl.push(nodo.url);
                        }
                    }
                }

                // -------------------------------------------------
                // N3
                // -------------------------------------------------
                else if (nodo.tipo === 'N3') {
                    item.class = 'icon-cyan';

                    if (nodo.path) {
                        item.path = nodo.path;
                    }

                    if (nodo.url) {
                        item.to = nodo.url;

                        listaUrl.push(nodo.url);
                    }

                    if (children.length > 0) {
                        item.items = children;
                    }
                }

                resultado.push(item);
            });

            return resultado;
        };

        const menuWeb = procesarNodos(arbolMenus.value);

        return {
            menuWeb,
            listaUrl: [...new Set(listaUrl)]
        };
    };

    // -------------------------------------------------------------------------
    // VALIDACIONES
    // -------------------------------------------------------------------------

    const nombrePerfilValido = computed(() => {
        if (!frmPerfil.nombre_perfil) {
            return true;
        }

        return frmPerfil.nombre_perfil.trim().length >= 3;
    });

    const botonGuardarDeshabilitado = computed(() => {
        if (!frmPerfil.nombre_perfil.trim()) {
            return true;
        }

        if (!nombrePerfilValido.value) {
            return true;
        }

        if (Object.keys(menusSeleccionados.value).length === 0) {
            return true;
        }

        return false;
    });

    // -------------------------------------------------------------------------
    // GUARDAR
    // -------------------------------------------------------------------------

    const handleGuardar = async () => {
        if (!frmPerfil.nombre_perfil.trim()) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Ingrese el nombre del perfil.',
                life: 3000
            });

            return;
        }

        if (!nombrePerfilValido.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'El nombre del perfil no es válido.',
                life: 3000
            });

            return;
        }

        if (Object.keys(menusSeleccionados.value).length === 0) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Seleccione al menos un permiso.',
                life: 3000
            });

            return;
        }

        const { menuWeb, listaUrl } = handleGenerarMenuPerfil();

        const datosPerfil = {
            ...frmPerfil,
            nombre_perfil: frmPerfil.nombre_perfil.trim().toUpperCase(),
            menus_seleccionados: menusSeleccionados.value,
            menu_web: menuWeb,
            lista_url: listaUrl
        };

        let res;

        if (movimiento.value === 'N') {
            res = await store.dispatch('api/apiPostToken', {
                direccion: `/perfiles/`,
                datosJson: datosPerfil
            });
        } else if (movimiento.value === 'E') {
            res = await store.dispatch('api/apiPutToken', {
                direccion: `/perfiles/`,
                datosJson: datosPerfil
            });
        }

        if (!res || res.estatus !== 200) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res?.mensaje ?? 'No fue posible guardar el perfil.',
                life: 3000
            });

            return;
        }

        toast.add({
            severity: 'success',
            summary: 'Notificación',
            detail: res.mensaje,
            life: 3000
        });

        mostrarTablaFormulario.value = false;
        movimiento.value = '';

        await handleLimpiarFormulario();
        await handleCargarPerfiles();
    };

    // -------------------------------------------------------------------------
    // INICIAL
    // -------------------------------------------------------------------------

    const handleInit = async () => {
        await handleCargarPerfiles();
        await handleCargarMenus();
    };

    // IMPORTANTE:
    // Se ejecuta después de declarar todas las funciones.
    handleInit();

    return {
        tablaPerfiles,
        filtros,

        arbolMenus,
        menusSeleccionados,

        mostrarTablaFormulario,
        frmPerfil,
        movimiento,

        nombrePerfilValido,
        botonGuardarDeshabilitado,

        handleMostrarFormulario,
        handleGuardar,
        handleLimpiarFiltro
    };
};

export default useProceso;
