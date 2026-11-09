import { computed, reactive, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import { fas } from '@fortawesome/free-solid-svg-icons';

const frmMenuInit = () => ({ _id: '', id_menu: '', id_menu_web: null, tipo_menu: 'N2', id_menu_padre: null,
    etiqueta: '', icono: 'fa-solid fa-list', orden: 1, url: '', path: '', activo: true });

export default function proceso() {
    const store = useStore(), toast = useToast();
    const mostrarPerfiles = ref(false), cargandoPerfiles = ref(false), actualizandoPerfiles = ref(false), errorPerfiles = ref('');
    const vistaPerfiles = ref({ perfiles: [], version: '', total: 0, por_actualizar: 0 });
    const versionCatalogo = ref(''), versionOrden = ref(''), mostrarOrden = ref(false), guardandoOrden = ref(false), arbolOrden = ref([]), abiertosOrden = ref({});
    const baseOrden = ref([]), errorOrden = ref('');
    const menus = ref([]), busqueda = ref(''), cargando = ref(false), guardando = ref(false), mostrarFormulario = ref(false);
    const frmMenu = reactive(frmMenuInit());
    const niveles = [{ label: 'Nivel 1 - Sección principal', value: 'N1' }, { label: 'Nivel 2 - Opción o agrupador', value: 'N2' }, { label: 'Nivel 3 - Pantalla', value: 'N3' }];
    const nombresIconos = { list: 'Lista', sitemap: 'Menus', gear: 'Configuracion', users: 'Usuarios', building: 'Empresa', truck: 'Proveedor',
        'file-lines': 'Documento', gauge: 'Panel', cloud: 'Nube', 'building-columns': 'Banco', 'calendar-days': 'Calendario',
        'chart-column': 'Reporte', 'folder-open': 'Carpeta', 'user-shield': 'Permisos', house: 'Inicio', envelope: 'Correo',
        'magnifying-glass': 'Buscar', 'address-book': 'Agenda', comments: 'Mensajes', bell: 'Notificaciones', 'file-invoice-dollar': 'Factura',
        'cloud-arrow-down': 'Descargar nube', 'cloud-arrow-up': 'Subir nube', 'money-bill-transfer': 'Transferencia', 'people-group': 'Equipo' };
    const iconos = [...new Map(Object.values(fas).map(icono => {
        const nombre = icono.iconName;
        const etiqueta = nombresIconos[nombre] || nombre.split('-').map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1)).join(' ');
        const aliases = (icono.icon?.[2] || []).filter(alias => typeof alias === 'string');
        return [nombre, { label: etiqueta, value: 'fa-solid fa-' + nombre, codigo: nombre, busqueda: [etiqueta, nombre, ...aliases].join(' ') }];
    })).values()].sort((a, b) => a.label.localeCompare(b.label, 'es'));
    const opcionesIcono = computed(() => iconos.some(item => item.value === frmMenu.icono) ? iconos : [...iconos,
        { label: frmMenu.icono, value: frmMenu.icono, codigo: frmMenu.icono, busqueda: frmMenu.icono }]);
    const padres = computed(() => menus.value.filter(item => item.tipo_menu === (frmMenu.tipo_menu === 'N3' ? 'N2' : 'N1') && !item.url && (item.activo || item.id_menu === frmMenu.id_menu_padre)).map(item => ({ ...item, texto: item.etiqueta + ' (' + item.id_menu + ')' })));
    const menuTieneHijos = computed(() => !!frmMenu.id_menu && menus.value.some(item => item.id_menu_padre === frmMenu.id_menu));
    const padreElegido = computed(() => menus.value.find(item => item.id_menu === frmMenu.id_menu_padre));
    const resumen = computed(() => ({ total: menus.value.length, activos: menus.value.filter(item => item.activo).length, pantallas: menus.value.filter(item => item.url).length }));
    const nodosAbiertos = ref({});
    let arbolIniciado = false, expansionAnterior = null;
    const arbolMenus = computed(() => {
        const visitados = new Set();
        const construir = padre => menus.value.filter(item => (item.id_menu_padre || null) === padre)
            .sort((a, b) => (a['orden_' + a.tipo_menu] || 0) - (b['orden_' + b.tipo_menu] || 0) || a.etiqueta.localeCompare(b.etiqueta))
            .flatMap(item => {
                if (visitados.has(item.id_menu)) return [];
                visitados.add(item.id_menu);
                const children = construir(item.id_menu);
                return [{ key: item.id_menu, label: item.etiqueta, data: item, children, leaf: children.length === 0 }];
            });
        const arbol = construir(null);
        const texto = busqueda.value.trim().toLocaleLowerCase('es');
        if (!texto) return arbol;
        const filtrar = nodos => nodos.flatMap(nodo => {
            const coincide = [nodo.label, nodo.key, nodo.data.url, nodo.data.path].some(valor => String(valor || '').toLocaleLowerCase('es').includes(texto));
            if (coincide) return [nodo];
            const children = filtrar(nodo.children);
            return children.length ? [{ ...nodo, children, leaf: false }] : [];
        });
        return filtrar(arbol);
    });
    const handleClavesAbiertas = nodos => {
        const claves = {};
        const recorrer = items => items.forEach(nodo => { if (nodo.children.length) { claves[nodo.key] = true; recorrer(nodo.children); } });
        recorrer(nodos); return claves;
    };
    const handleExpandirTodo = () => { nodosAbiertos.value = handleClavesAbiertas(arbolMenus.value); };
    const handleContraerTodo = () => { nodosAbiertos.value = {}; };
    watch(busqueda, (texto, anterior) => {
        if (texto.trim()) {
            if (!anterior.trim()) expansionAnterior = { ...nodosAbiertos.value };
            handleExpandirTodo();
        } else if (expansionAnterior) { nodosAbiertos.value = expansionAnterior; expansionAnterior = null; }
    });
    const botonGuardarDeshabilitado = computed(() => guardando.value || !frmMenu.etiqueta.trim() || !Number.isInteger(frmMenu.orden) || frmMenu.orden < 1 || (frmMenu.tipo_menu !== 'N1' && !frmMenu.id_menu_padre) || (frmMenu.tipo_menu === 'N3' && !frmMenu.url.trim()));
    const handleCargarMenus = async () => {
        cargando.value = true;
        try {
            const res = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/catalogo_menus/' });
            if (res.estatus !== 200) throw new Error(res.mensaje || 'No se pudieron consultar los menus.');
            menus.value = res.datos?.menus || [];
            versionCatalogo.value = res.datos?.version || '';
            if (!arbolIniciado) {
                nodosAbiertos.value = {};
                arbolIniciado = true;
            }
            if (busqueda.value.trim()) handleExpandirTodo();
            return true;
        } catch (error) { toast.add({ severity: 'error', summary: 'Menús', detail: error.message, life: 5000 }); return false; }
        finally { cargando.value = false; }
    };
    const handleSugerirOrden = () => {
        if (frmMenu._id) return;
        frmMenu.orden = Math.max(0, ...menus.value.filter(item => item.tipo_menu === frmMenu.tipo_menu && (item.id_menu_padre || null) === (frmMenu.id_menu_padre || null)).map(item => item['orden_' + item.tipo_menu] || 0)) + 1;
    };
    watch(() => frmMenu.tipo_menu, () => {
        if (frmMenu._id) return;
        frmMenu.id_menu_padre = null;
        if (frmMenu.tipo_menu === 'N1') { frmMenu.url = ''; frmMenu.path = ''; }
        handleSugerirOrden();
    });
    watch(() => frmMenu.id_menu_padre, () => {
        handleSugerirOrden();
        if (!frmMenu._id && frmMenu.tipo_menu === 'N3') frmMenu.path = padreElegido.value?.path || '';
    });
    const handleNuevo = () => { Object.assign(frmMenu, frmMenuInit()); handleSugerirOrden(); mostrarFormulario.value = true; };
    const handleEditar = item => { Object.assign(frmMenu, frmMenuInit(), item, { orden: item['orden_' + item.tipo_menu] || 1, url: item.url || '', path: item.path || '' }); mostrarFormulario.value = true; };
    const handleCancelar = () => { if (!guardando.value) mostrarFormulario.value = false; };
    const handleGuardar = async () => {
        if (botonGuardarDeshabilitado.value) return;
        guardando.value = true;
        try {
            const res = await store.dispatch(frmMenu._id ? 'api/apiPutToken' : 'api/apiPostToken', { direccion: '/catalogo_menus/', datosJson: { ...frmMenu } });
            if (res.estatus !== 200) throw new Error(res.mensaje || 'No fue posible guardar el menu.');
            mostrarFormulario.value = false;
            toast.add({ severity: 'success', summary: 'Menús', detail: res.mensaje, life: 6000 });
            await handleCargarMenus();
        } catch (error) { toast.add({ severity: 'error', summary: 'Menús', detail: error.message, life: 5000 }); }
        finally { guardando.value = false; }
    };
    const handleConstruirOrden = filas => {
        const visitados = new Set();
        const construir = padre => filas.filter(item => (item.id_menu_padre || null) === padre)
            .sort((a, b) => (a['orden_' + a.tipo_menu] || 0) - (b['orden_' + b.tipo_menu] || 0) || a.etiqueta.localeCompare(b.etiqueta))
            .flatMap(item => {
                if (visitados.has(item.id_menu)) return [];
                visitados.add(item.id_menu);
                const children = construir(item.id_menu);
                return [{ key: item.id_menu, label: item.etiqueta, data: { ...item }, children, leaf: !children.length }];
            });
        const arbol = construir(null);
        if (visitados.size !== filas.length) throw new Error('Hay opciones sin padre valido o con ciclos. Revisa el catalogo.');
        return arbol;
    };
    const handleNormalizarOrden = (nodos, padre = null, nivel = 1) => nodos.map((nodo, indice) => {
        if (nivel > 3) throw new Error('Solo se permiten tres niveles.');
        if ((nivel === 1 || nodo.children?.length) && nodo.data.url) throw new Error('Una pantalla con URL no puede ser seccion o agrupador.');
        if (nivel === 3 && !nodo.data.url) throw new Error('El tercer nivel debe contener pantallas con URL.');
        if (padre && nodo.data.activo && !padre.data.activo) throw new Error('El padre debe estar activo para recibir opciones activas.');
        const data = { ...nodo.data, tipo_menu: 'N' + nivel, id_menu_padre: padre?.key || null,
            orden_N1: nivel === 1 ? indice + 1 : 0, orden_N2: nivel === 2 ? indice + 1 : 0, orden_N3: nivel === 3 ? indice + 1 : 0,
            path: nivel === 3 ? padre.data.path || null : nodo.data.path };
        const nuevo = { ...nodo, data };
        nuevo.children = handleNormalizarOrden(nodo.children || [], nuevo, nivel + 1);
        nuevo.leaf = !nuevo.children.length;
        return nuevo;
    });
    const handleListaOrden = nodos => nodos.flatMap(nodo => [{ id_menu: nodo.key, id_menu_padre: nodo.data.id_menu_padre,
        orden: nodo.data['orden_' + nodo.data.tipo_menu], tipo_menu: nodo.data.tipo_menu, path: nodo.data.path || null }, ...handleListaOrden(nodo.children || [])]);
    const cambiosOrden = computed(() => {
        const anteriores = new Map(baseOrden.value.map(item => [item.id_menu, item]));
        return handleListaOrden(arbolOrden.value).filter(item => JSON.stringify(item) !== JSON.stringify(anteriores.get(item.id_menu))).length;
    });
    const handleNuevoOrden = async () => {
        if (cargando.value || guardandoOrden.value) return;
        if (!await handleCargarMenus()) return;
        try {
            const original = handleConstruirOrden(menus.value);
            handleNormalizarOrden(original);
            baseOrden.value = handleListaOrden(original);
            arbolOrden.value = original;
            abiertosOrden.value = {};
            versionOrden.value = versionCatalogo.value; errorOrden.value = ''; mostrarOrden.value = true;
        } catch (error) { toast.add({ severity: 'warn', summary: 'Nuevo orden', detail: error.message, life: 5000 }); }
    };
    const handleMoverMenu = evento => {
        if (guardandoOrden.value || !evento.dragNode?.key) return;
        // validateDrop impide que Tree modifique las listas antes de validar.
        // No llamamos accept(): construimos el movimiento sobre una copia propia.
        try {
            const copia = JSON.parse(JSON.stringify(arbolOrden.value));
            const buscar = (nodos, clave) => {
                for (let indice = 0; indice < nodos.length; indice++) {
                    const nodo = nodos[indice];
                    if (nodo.key === clave) return { nodo, hermanos: nodos, indice };
                    const encontrado = buscar(nodo.children || [], clave);
                    if (encontrado) return encontrado;
                }
                return null;
            };
            const origen = buscar(copia, evento.dragNode.key);
            if (!origen) throw new Error('No se encontro la opcion que deseas mover.');
            const destinoClave = evento.dropNode?.key;
            if (destinoClave === origen.nodo.key) return;
            if (destinoClave && buscar(origen.nodo.children || [], destinoClave)) throw new Error('No puedes mover un menu dentro de sus propios hijos.');
            const [movido] = origen.hermanos.splice(origen.indice, 1);
            if (!destinoClave) copia.push(movido);
            else {
                const destino = buscar(copia, destinoClave);
                if (!destino) throw new Error('No se encontro el destino.');
                if (evento.dropPosition === 0) {
                    destino.nodo.children = [...(destino.nodo.children || []), movido];
                } else {
                    destino.hermanos.splice(destino.indice + (evento.dropPosition === 1 ? 1 : 0), 0, movido);
                }
            }
            const propuesta = handleNormalizarOrden(copia);
            const lista = handleListaOrden(propuesta);
            const claves = new Set(baseOrden.value.map(item => item.id_menu));
            if (lista.length !== claves.size || new Set(lista.map(item => item.id_menu)).size !== claves.size || lista.some(item => !claves.has(item.id_menu))) throw new Error('El movimiento no puede perder ni duplicar opciones.');
            arbolOrden.value = propuesta; errorOrden.value = '';
            if (destinoClave && evento.dropPosition === 0) abiertosOrden.value = { ...abiertosOrden.value, [destinoClave]: true };
        } catch (error) { errorOrden.value = error.message; }
    };
    const handleRestablecerOrden = () => {
        if (guardandoOrden.value) return;
        arbolOrden.value = handleConstruirOrden(menus.value); errorOrden.value = '';
        abiertosOrden.value = {};
    };
    const handleCancelarOrden = () => { if (!guardandoOrden.value) mostrarOrden.value = false; };
    const handleGuardarOrden = async () => {
        if (guardandoOrden.value || !cambiosOrden.value) return;
        guardandoOrden.value = true; errorOrden.value = '';
        try {
            const res = await store.dispatch('api/apiPutToken', { direccion: '/catalogo_menus/orden', datosJson: { version: versionOrden.value, estructura: handleListaOrden(arbolOrden.value) } });
            if (res.estatus !== 200) throw new Error(res.mensaje || 'No fue posible guardar el orden.');
            mostrarOrden.value = false;
            toast.add({ severity: 'success', summary: 'Nuevo orden', detail: res.mensaje, life: 6000 });
            await handleCargarMenus();
        } catch (error) { errorOrden.value = error.message; }
        finally { guardandoOrden.value = false; }
    };
    const handleVistaPerfiles = async () => {
        if (cargandoPerfiles.value || actualizandoPerfiles.value) return;
        mostrarPerfiles.value = true; cargandoPerfiles.value = true; errorPerfiles.value = '';
        vistaPerfiles.value = { perfiles: [], version: '', total: 0, por_actualizar: 0 };
        try {
            const res = await store.dispatch('api/apiPostTokenSinCargando', { direccion: '/catalogo_menus/perfiles/vista_previa', datosJson: {} });
            if (res.estatus !== 200) throw new Error(res.mensaje || 'No se pudo consultar la vista previa.');
            vistaPerfiles.value = res.datos;
        } catch (error) { errorPerfiles.value = error.message; }
        finally { cargandoPerfiles.value = false; }
    };
    const handleCerrarPerfiles = () => { if (!actualizandoPerfiles.value) mostrarPerfiles.value = false; };
    const handleActualizarPerfiles = async () => {
        if (actualizandoPerfiles.value || cargandoPerfiles.value || !vistaPerfiles.value.version || !vistaPerfiles.value.por_actualizar) return;
        actualizandoPerfiles.value = true; errorPerfiles.value = '';
        try {
            const res = await store.dispatch('api/apiPostTokenSinCargando', { direccion: '/catalogo_menus/perfiles/actualizar', datosJson: { version: vistaPerfiles.value.version } });
            if (res.estatus !== 200) throw new Error(res.mensaje || 'No se pudieron actualizar los perfiles.');
            const conflictos = res.datos?.conflictos || 0;
            toast.add({ severity: conflictos ? 'warn' : 'success', summary: 'Perfiles asignados', detail: `${res.datos?.actualizados || 0} perfiles actualizados.` + (conflictos ? ` ${conflictos} requieren revisar la vista previa.` : ''), life: 6000 });
            if (conflictos) { errorPerfiles.value = res.mensaje; vistaPerfiles.value.version = ''; }
            else mostrarPerfiles.value = false;
        } catch (error) { errorPerfiles.value = error.message; vistaPerfiles.value.version = ''; }
        finally { actualizandoPerfiles.value = false; }
    };
    const handleLimpiarFiltro = () => { busqueda.value = ''; };
    handleCargarMenus();
    return { mostrarPerfiles, cargandoPerfiles, actualizandoPerfiles, errorPerfiles, vistaPerfiles, handleVistaPerfiles, handleCerrarPerfiles, handleActualizarPerfiles, mostrarOrden, guardandoOrden, arbolOrden, abiertosOrden, cambiosOrden, errorOrden, handleNuevoOrden, handleMoverMenu, handleRestablecerOrden, handleCancelarOrden, handleGuardarOrden, menus, arbolMenus, nodosAbiertos, handleExpandirTodo, handleContraerTodo, busqueda, cargando, guardando, mostrarFormulario, frmMenu, niveles, opcionesIcono, padres, padreElegido, menuTieneHijos, resumen, botonGuardarDeshabilitado,
        handleCargarMenus, handleNuevo, handleEditar, handleCancelar, handleGuardar, handleLimpiarFiltro };
}
