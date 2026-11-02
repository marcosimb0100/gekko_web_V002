import { useToast } from 'primevue/usetoast';
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

const useProceso = () => {
    const informacionVisible = ref(false);
    const mostrarColumnasSyncLocal = ref(false);
    const handleMostrarInformacion = () => { informacionVisible.value = true; };
    const handleCerrarInformacion = () => { informacionVisible.value = false; };
    const store = useStore();
    const toast = useToast();
    const tipo = ref('usuarios');
    const tipos = [
        { label: 'Por perfil', value: 'perfiles' },
        { label: 'Por usuario', value: 'usuarios' }
    ];
    const sujetos = ref([]);
    const sujetoId = ref(null);
    const buscar = ref('');
    const filas = ref([]);
    const expandedKeys = ref({});
    const cargando = ref(false);
    const error = ref('');
    const offset = ref(0);
    const offsetSujetos = ref(0);
    const hayMasSujetos = ref(false);
    const limite = 50;
    const columnas = [
        { accion: 'listar', nombre: 'Lectura', descripcion: 'Ver carpetas, nombres y metadatos.' },
        { accion: 'escribir', nombre: 'Escritura', descripcion: 'Renombrar carpetas y archivos.' },
        { accion: 'leer', nombre: 'Descarga', descripcion: 'Descargar el contenido desde el kiosco.' },
        { accion: 'cargar', nombre: 'Carga', descripcion: 'Subir archivos y versiones.' },
        { accion: 'crear_carpeta', nombre: 'Directorios', descripcion: 'Crear carpetas dentro del repositorio.' },
        { accion: 'historial', nombre: 'Versiones', descripcion: 'Consultar el historial de versiones.' },
        { accion: 'eliminar', nombre: 'Eliminar', descripcion: 'Enviar archivos a papelera, sin borrado físico.' },
        { accion: 'restaurar', nombre: 'Restaurar', descripcion: 'Recuperar archivos y versiones anteriores.' },
        { accion: 'sync_local', nombre: 'Sync local', descripcion: 'Recibir contenido en equipos aprobados, independiente de Descarga manual.' },
        { accion: 'editar_local', nombre: 'Editar local', descripcion: 'Publicar cambios desde Windows. Requiere Sync local; no equivale a Carga web.' }
    ];
    const columnasVisibles = computed(() => columnas.filter(col => mostrarColumnasSyncLocal.value || !['sync_local', 'editar_local'].includes(col.accion)));
    const handleRespuesta = (res) => {
        if (res.estatus < 200 || res.estatus >= 300) throw new Error(res.mensaje || 'No fue posible completar la operación.');
        return res.datos;
    };
    const handleEjecutar = async (tarea) => {
        if (cargando.value) return;
        cargando.value = true;
        error.value = '';
        try {
            await tarea();
        } catch (e) {
            error.value = e.message;
            toast.add({ severity: 'error', summary: 'Permisos Sync', detail: error.value, life: 6000 });
        } finally {
            cargando.value = false;
        }
    };
    const handleCargarSujetos = async (agregar = false) => {
        const params = new URLSearchParams({ tipo: tipo.value, buscar: buscar.value, limite, offset: agregar ? offsetSujetos.value : 0, excluir_administradores: '1' });
        const datos = handleRespuesta(await store.dispatch('api/apiGetToken', { direccion: `/sync/administracion/sujetos?${params}` }));
        mostrarColumnasSyncLocal.value = datos.mostrar_columnas_sync_local === true;
        if (tipo.value !== datos.modelo_permisos) {
            tipo.value = datos.modelo_permisos;
            return handleCargarSujetos(false);
        }
        sujetos.value = agregar ? [...sujetos.value, ...datos.sujetos] : datos.sujetos;
        offsetSujetos.value = sujetos.value.length;
        hayMasSujetos.value = datos.sujetos.length === limite;
    };
    const handleBuscarSujetos = () =>
        handleEjecutar(async () => {
            sujetoId.value = null;
            filas.value = [];
            offset.value = 0;
            await handleCargarSujetos();
        });
    const handleMasSujetos = () => handleEjecutar(() => handleCargarSujetos(true));
    const handleCambiarTipo = () => {
        buscar.value = '';
        return handleBuscarSujetos();
    };
    const handleCargarMatriz = async () => {
        filas.value = [];
        if (!sujetoId.value) return;
        const params = new URLSearchParams({ tipo: tipo.value, sujeto: sujetoId.value, limite, offset: offset.value });
        const datos = handleRespuesta(await store.dispatch('api/apiGetToken', { direccion: `/sync/administracion/permisos?${params}` }));
        filas.value = datos.repositorios.map(handleCrearNodo);
        expandedKeys.value = {};
    };
    const handleSeleccionarSujeto = () =>
        handleEjecutar(async () => {
            offset.value = 0;
            await handleCargarMatriz();
        });
    const handleActualizar = () => handleEjecutar(handleCargarMatriz);
    const handlePaginar = (direccion) =>
        handleEjecutar(async () => {
            offset.value = Math.max(0, offset.value + direccion * limite);
            await handleCargarMatriz();
        });
    const handleOrigenHerencia = fila => {
        if (fila.tipo_recurso !== 'carpeta') return 'Usar permisos del perfil';
        if (fila.origen_herencia === 'perfil') return 'Usar permisos del perfil en esta carpeta';
        return `Usar permisos del padre: ${fila.nombre_padre || 'Directorio padre'}`;
    };
    const handleHeredar = (fila) => {
        if (fila.heredar) fila.acciones = [...fila.acciones_perfil];
    };
    const handleCambiarPermiso = (fila, accion) => {
        if (accion === 'editar_local' && fila.acciones.includes('editar_local') && !fila.acciones.includes('sync_local')) fila.acciones.push('sync_local');
        if (accion === 'sync_local' && !fila.acciones.includes('sync_local')) fila.acciones = fila.acciones.filter(item => item !== 'editar_local');
        if (accion === 'listar' && !fila.acciones.includes('listar')) fila.acciones = [];
        else if (fila.acciones.length && !fila.acciones.includes('listar')) fila.acciones.push('listar');
    };
    const handleGuardar = (fila) =>
        handleEjecutar(async () => {
            const datos = handleRespuesta(
                await store.dispatch('api/apiPutToken', {
                    direccion: fila.tipo_recurso === 'carpeta' ? `/sync/carpetas/${fila._id}/permisos` : `/sync/espacios/${fila._id}/permisos`,
                    datosJson: { tipo: tipo.value, sujeto: sujetoId.value, acciones: fila.heredar ? null : fila.acciones, revision_permisos: fila.revision_permisos }
                })
            );
            fila.revision_permisos = datos.revision_permisos;
            const nodo = handleEncontrarNodo(filas.value, fila._id);
            if (nodo) {
                nodo.children = undefined;
                nodo.cargado = false;
                delete expandedKeys.value[nodo.key];
            }
            toast.add({ severity: 'success', summary: 'Permisos Sync', detail: `Permisos guardados para ${fila.nombre}.`, life: 3500 });
        });
    const handleCrearNodo = fila => ({
        key: `${fila.tipo_recurso}:${fila._id}`, data: fila,
        leaf: !fila.tiene_hijos, cargado: false
    });
    const handleEncontrarNodo = (nodos, id) => {
        for (const nodo of nodos) {
            if (nodo.data._id === id) return nodo;
            const encontrado = handleEncontrarNodo(nodo.children || [], id);
            if (encontrado) return encontrado;
        }
        return null;
    };
    const handleCargarHijos = async (nodo, inicio = 0) => {
        const params = new URLSearchParams({ tipo: tipo.value, sujeto: sujetoId.value,
            espacio: nodo.data.espacio, limite, offset: inicio });
        if (nodo.data.tipo_recurso === 'carpeta') params.set('padre', nodo.data._id);
        const datos = handleRespuesta(await store.dispatch('api/apiGetToken', {
            direccion: `/sync/administracion/permisos?${params}`
        }));
        const nuevos = datos.repositorios.map(handleCrearNodo);
        nodo.children = inicio ? [...(nodo.children || []).filter(hijo => !hijo.data.esMas), ...nuevos] : nuevos;
        if (nuevos.length === limite) nodo.children.push({ key: `mas:${nodo.key}`, leaf: true,
            data: { _id: `mas:${nodo.key}`, esMas: true, padreNodo: nodo, siguiente: inicio + limite } });
        nodo.cargado = true;
        nodo.leaf = nodo.children.length === 0;
    };
    const handleExpandirNodo = nodo => {
        if (!nodo.cargado) return handleEjecutar(() => handleCargarHijos(nodo));
    };
    const handleMasCarpetas = nodo => handleEjecutar(() => handleCargarHijos(nodo.data.padreNodo, nodo.data.siguiente));
    // Catalog data is loaded only when the administrator opens this component.
    handleBuscarSujetos();
    return {
        expandedKeys, handleExpandirNodo, handleMasCarpetas, handleOrigenHerencia,
        informacionVisible, handleMostrarInformacion, handleCerrarInformacion, mostrarColumnasSyncLocal,
        tipo,
        tipos,
        sujetos,
        sujetoId,
        buscar,
        filas,
        cargando,
        error,
        offset,
        limite,
        hayMasSujetos,
        columnas, columnasVisibles,
        handleBuscarSujetos,
        handleMasSujetos,
        handleCambiarTipo,
        handleSeleccionarSujeto,
        handleActualizar,
        handlePaginar,
        handleHeredar,
        handleCambiarPermiso,
        handleGuardar
    };
};

export default useProceso;
