import { computed, nextTick, reactive, ref, watch, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { estadoSocket } from '../../../helpers/socket';

export default function useProceso() {
    const store = useStore();
    const puedeUsarChat = ref(false);
    const presenciaUsuarios = ref({});
    const handleAplicarPresencia = (usuarios) => {
        const mapa = { ...presenciaUsuarios.value };
        usuarios.forEach(usuario => { mapa[usuario.id] = usuario.conectado === true; });
        presenciaUsuarios.value = mapa;
    };
    const handleEstaConectado = (usuario) => estadoSocket.autorizado && usuario?.activo !== false && usuario?.chat_habilitado !== false && presenciaUsuarios.value[usuario?.id] === true;
    const handleEstadoConexion = (usuario) => !estadoSocket.autorizado ? 'Sin datos de conexi\u00f3n' : handleEstaConectado(usuario) ? 'Conectado' : 'Desconectado';
    watch(() => estadoSocket.revisionPresenciaChat, () => {
        presenciaUsuarios.value = { ...presenciaUsuarios.value, ...estadoSocket.presenciaChat };
    });
    const mostrar = ref(false), busqueda = ref(''), borrador = ref('');
    const contenedorMensajes = ref(null), calendario = ref(null);
    const fotosUsuarios = reactive({});
    const fotosPendientes = new Set();
    const conversaciones = ref([]), usuariosEncontrados = ref([]), conversacion = ref(null);
    const mensajesDelDia = ref([]), sinLeer = ref(0), hayMasConversaciones = ref(false), hayMasMensajes = ref(false);
    const cargandoConversaciones = ref(false), cargandoMensajes = ref(false), buscando = ref(false), enviando = ref(false);
    const error = ref('');
    const verArchivadas = ref(false), mostrarAgenda = ref(false), contactosAgenda = ref([]);
    const busquedaAgenda = ref(''), letraAgenda = ref(''), cargandoAgenda = ref(false), hayMasAgenda = ref(false);
    const letrasAgenda = ['','A','B','C','D','E','F','G','H','I','J','K','L','M','N','\u00d1','O','P','Q','R','S','T','U','V','W','X','Y','Z','#'];
    const menuContacto = ref(null), contactoMenu = ref(null), confirmarEliminar = ref(false), procesandoAccion = ref(false);
    let offsetAgenda = 0, versionAgenda = 0, timerAgenda;
    const opcionesContacto = computed(() => [
        { label: contactoMenu.value?.archivada ? 'Mover a conversaciones' : 'Archivar conversaci\u00f3n', icon: 'pi pi-inbox', disabled: !contactoMenu.value?.ultimo?.id || procesandoAccion.value, command: () => handleAplicarAccion(contactoMenu.value?.archivada ? 'recuperar' : 'archivar') },
        { label: 'Eliminar conversaci\u00f3n', icon: 'pi pi-trash', disabled: !contactoMenu.value?.ultimo?.id || procesandoAccion.value, command: () => { confirmarEliminar.value = true; } }
    ]);

    let activa = true, offset = 0, antes = null, versionHistorial = 0, versionBusqueda = 0;
    let timerBuscar, timerActualizar, timerLeer, actualizando = false, pendiente = false, leyendo = false, envioPendiente = null;
    const handleDia = (valor) => new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
    const hoy = ref(handleDia(new Date())), fechaSeleccionada = ref(new Date(hoy.value));
    const handleClaveFecha = (fecha) => [fecha.getFullYear(), String(fecha.getMonth() + 1).padStart(2, '0'), String(fecha.getDate()).padStart(2, '0')].join('-');
    const handleActualizarHoy = () => { hoy.value = handleDia(new Date()); };
    const viendoHoy = computed(() => handleClaveFecha(fechaSeleccionada.value) === handleClaveFecha(hoy.value));
    const etiquetaFecha = computed(() => viendoHoy.value ? 'Hoy' : fechaSeleccionada.value.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }));
    const conversacionesFiltradas = computed(() => busqueda.value.trim().length >= 2 ? usuariosEncontrados.value : conversaciones.value);
    const handleHora = (fecha) => fecha ? new Date(fecha).toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' }) : '';
    const handleHoraLista = (fecha) => {
        if (!fecha) return '';
        const dia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(fecha));
        return dia === handleClaveFecha(hoy.value) ? handleHora(fecha) : new Date(fecha).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: 'short' });
    };
    const handleIniciales = (nombre) => String(nombre || 'Usuario').split(/\s+/).filter(Boolean).slice(0, 2).map(parte => parte[0]).join('').toUpperCase();
    const handleRetirarAcceso = () => {
        puedeUsarChat.value = false; mostrar.value = false;
        conversaciones.value = []; usuariosEncontrados.value = []; mensajesDelDia.value = [];
        mostrarAgenda.value = false; contactosAgenda.value = []; confirmarEliminar.value = false; menuContacto.value?.hide(); ++versionAgenda; clearTimeout(timerAgenda);
        conversacion.value = null; presenciaUsuarios.value = {}; sinLeer.value = 0; borrador.value = ''; busqueda.value = '';
        error.value = ''; ++versionHistorial; ++versionBusqueda;
        clearTimeout(timerLeer); clearTimeout(timerBuscar);
    };
    const handleValidarAcceso = async () => {
        try {
            const datos = await handleConsulta('acceso');
            if (!activa) return false;
            puedeUsarChat.value = datos.chat_habilitado === true;
            if (!puedeUsarChat.value) handleRetirarAcceso();
            return puedeUsarChat.value;
        } catch (ex) { return false; }
    };
    const handleConsulta = async (ruta, datosJson = {}) => {
        const res = await store.dispatch('api/apiPostChat', { direccion: '/chat/' + ruta, datosJson });
        if (res.estatus === 403) handleRetirarAcceso();
        if (res.estatus !== 200) throw new Error(res.mensaje || 'No fue posible consultar el chat.');
        return res.datos;
    };
    const handleCargarConversaciones = async (mas = false) => {
        if (cargandoConversaciones.value || !activa || !puedeUsarChat.value) return;
        cargandoConversaciones.value = true;
        const archivadas = verArchivadas.value;
        try {
            const datos = await handleConsulta('conversaciones', { offset: mas ? offset : 0, archivadas });
            if (!activa || !puedeUsarChat.value || archivadas !== verArchivadas.value) return;
            const filas = datos.conversaciones || [];
            handleAplicarPresencia(filas);
            conversaciones.value = mas ? [...new Map([...conversaciones.value, ...filas].map(item => [item.id, item])).values()] : filas;
            offset = mas ? offset + filas.length : filas.length;
            hayMasConversaciones.value = datos.hay_mas;
            sinLeer.value = datos.sin_leer || 0;
            const actual = conversaciones.value.find(item => item.id === conversacion.value?.id);
            if (actual) Object.assign(conversacion.value, actual);
        } catch (ex) { if (activa && mostrar.value) error.value = ex.message; }
        finally {
            if (activa) {
                cargandoConversaciones.value = false;
                if (archivadas !== verArchivadas.value && puedeUsarChat.value) handleCargarConversaciones();
            }
        }
    };
    const handleCargarFoto = async (usuarioId) => {
        if (fotosUsuarios[usuarioId] || fotosPendientes.has(usuarioId)) return;
        fotosPendientes.add(usuarioId);
        try {
            const res = await store.dispatch('api/apiGetblobSinCargando', { direccion: '/usuarios/foto/' + usuarioId });
            if (!activa || res.estatus !== 200 || !(res.data instanceof Blob)) return;
            const claves = Object.keys(fotosUsuarios);
            if (claves.length >= 20) { URL.revokeObjectURL(fotosUsuarios[claves[0]]); delete fotosUsuarios[claves[0]]; }
            fotosUsuarios[usuarioId] = URL.createObjectURL(res.data);
        } catch (ex) { /* Las iniciales permanecen como alternativa a la fotografia. */ }
        finally { fotosPendientes.delete(usuarioId); }
    };
    const handleBuscar = async () => {
        const texto = busqueda.value.trim(), version = ++versionBusqueda;
        if (!puedeUsarChat.value || texto.length < 2) { usuariosEncontrados.value = []; buscando.value = false; return; }
        buscando.value = true;
        try {
            const datos = await handleConsulta('usuarios', { busqueda: texto });
            if (!activa || version !== versionBusqueda) return;
            handleAplicarPresencia(datos.usuarios || []);
            usuariosEncontrados.value = (datos.usuarios || []).map(item => ({ ...item, ...(conversaciones.value.find(c => c.id === item.id) || {}) }));
        } catch (ex) { if (activa && version === versionBusqueda) error.value = ex.message; }
        finally { if (activa && version === versionBusqueda) buscando.value = false; }
    };
    watch(busqueda, () => {
        ++versionBusqueda;
        clearTimeout(timerBuscar);
        if (busqueda.value.trim().length < 2) { usuariosEncontrados.value = []; buscando.value = false; return; }
        timerBuscar = setTimeout(handleBuscar, 400);
    });
    const handleMarcarVisibles = async () => {
        if (!activa || !puedeUsarChat.value || !mostrar.value || document.visibilityState !== 'visible' || leyendo || !conversacion.value) return;
        const elemento = contenedorMensajes.value;
        if (!elemento) return;
        const limites = elemento.getBoundingClientRect();
        const visibles = new Set([...elemento.querySelectorAll('[data-mensaje-id]')].filter(nodo => {
            const rect = nodo.getBoundingClientRect();
            return Math.min(rect.bottom, limites.bottom) - Math.max(rect.top, limites.top) >= Math.min(20, rect.height);
        }).map(nodo => nodo.dataset.mensajeId));
        const ids = mensajesDelDia.value.filter(m => !m.propio && !m.leido && visibles.has(m.id)).slice(0, 50).map(m => m.id);
        if (!ids.length) return;
        const usuarioId = conversacion.value.id;
        leyendo = true;
        try {
            await handleConsulta('leer', { usuario_id: usuarioId, ids });
            if (!activa || conversacion.value?.id !== usuarioId) return;
            mensajesDelDia.value.forEach(m => { if (ids.includes(m.id)) m.leido = true; });
            handleProgramarActualizacion();
        } catch (ex) { /* Se reintentara al volver a ver la conversacion. */ }
        finally { leyendo = false; }
    };
    const handleDesplazamiento = () => {
        clearTimeout(timerLeer);
        timerLeer = setTimeout(handleMarcarVisibles, 300);
    };
    const handleCargarMensajes = async (mas = false, actualizar = false) => {
        if (!activa || !puedeUsarChat.value || !conversacion.value) return;
        const version = ++versionHistorial, usuarioId = conversacion.value.id, dia = handleClaveFecha(fechaSeleccionada.value);
        cargandoMensajes.value = true;
        const elemento = contenedorMensajes.value;
        const alto = elemento?.scrollHeight || 0, posicion = elemento?.scrollTop || 0;
        const alFinal = !elemento || alto - posicion - elemento.clientHeight < 80;
        try {
            const datos = await handleConsulta('historial', { usuario_id: usuarioId, dia, ...(mas && antes ? { antes } : {}) });
            if (!activa || version !== versionHistorial || usuarioId !== conversacion.value?.id || dia !== handleClaveFecha(fechaSeleccionada.value)) return;
            const filas = datos.mensajes || [];
            if (mas || actualizar) {
                const unicos = new Map(mensajesDelDia.value.map(m => [m.id, m]));
                filas.forEach(m => unicos.set(m.id, m));
                mensajesDelDia.value = [...unicos.values()].sort((a, b) => a.id.localeCompare(b.id));
            } else mensajesDelDia.value = filas;
            if (datos.eliminado_hasta) mensajesDelDia.value = mensajesDelDia.value.filter(m => m.id > datos.eliminado_hasta);
            if (!actualizar || !antes) { antes = datos.antes; hayMasMensajes.value = datos.hay_mas; }
            await nextTick();
            if (!activa || version !== versionHistorial) return;
            const nodo = contenedorMensajes.value;
            if (nodo) {
                if (mas) nodo.scrollTop = posicion + nodo.scrollHeight - alto;
                else if (!actualizar || alFinal) nodo.scrollTop = nodo.scrollHeight;
            }
            handleDesplazamiento();
        } catch (ex) { if (activa && version === versionHistorial) error.value = ex.message; }
        finally { if (activa && version === versionHistorial) cargandoMensajes.value = false; }
    };
    const handleActualizar = async () => {
        timerActualizar = null;
        if (!activa) return;
        if (actualizando) { pendiente = true; return; }
        actualizando = true;
        pendiente = false;
        try {
            if (!await handleValidarAcceso()) return;
            await handleCargarConversaciones();
            if (mostrar.value && busqueda.value.trim().length >= 2) await handleBuscar();
            if (mostrar.value && mostrarAgenda.value) await handleCargarAgenda();
            if (mostrar.value && !mostrarAgenda.value && conversacion.value && !cargandoMensajes.value) await handleCargarMensajes(false, true);
        } finally {
            actualizando = false;
            if (activa && pendiente) handleProgramarActualizacion();
        }
    };
    const handleProgramarActualizacion = () => {
        if (!activa) return;
        pendiente = true;
        if (!timerActualizar && !actualizando) timerActualizar = setTimeout(handleActualizar, 800);
    };
    watch(() => estadoSocket.revisionChat, handleProgramarActualizacion);
    watch(() => estadoSocket.revisionConexion, handleProgramarActualizacion);
    const handleMenuContacto = (event, usuario) => {
        contactoMenu.value = { ...usuario, ultimo: usuario.ultimo ? { ...usuario.ultimo } : null };
        menuContacto.value?.show(event);
    };
    const handleAplicarAccion = async (accion) => {
        const usuario = contactoMenu.value;
        if (!usuario || procesandoAccion.value) return;
        procesandoAccion.value = true; error.value = '';
        try {
            await handleConsulta('conversacion/accion', { usuario_id: usuario.id, accion, hasta_id: usuario.ultimo?.id });
            if (!activa) return;
            confirmarEliminar.value = false;
            if (conversacion.value?.id === usuario.id) handleVolver();
            await handleCargarConversaciones();
            if (busqueda.value.trim().length >= 2) await handleBuscar();
        } catch (ex) { if (activa) error.value = ex.message; }
        finally { if (activa) procesandoAccion.value = false; }
    };
    const handleVerArchivadas = async () => {
        verArchivadas.value = !verArchivadas.value;
        busqueda.value = ''; conversaciones.value = []; offset = 0;
        await handleCargarConversaciones();
    };
    const handleCargarAgenda = async (mas = false) => {
        if (!activa || !puedeUsarChat.value || !mostrarAgenda.value || (mas && cargandoAgenda.value)) return;
        const version = ++versionAgenda;
        cargandoAgenda.value = true;
        try {
            const datos = await handleConsulta('agenda', { letra: letraAgenda.value, busqueda: busquedaAgenda.value, offset: mas ? offsetAgenda : 0 });
            if (!activa || version !== versionAgenda || !mostrarAgenda.value) return;
            const filas = datos.usuarios || [];
            handleAplicarPresencia(filas);
            contactosAgenda.value = mas ? [...new Map([...contactosAgenda.value, ...filas].map(item => [item.id, item])).values()] : filas;
            offsetAgenda = mas ? offsetAgenda + filas.length : filas.length;
            hayMasAgenda.value = datos.hay_mas;
        } catch (ex) { if (activa && version === versionAgenda) error.value = ex.message; }
        finally { if (activa && version === versionAgenda) cargandoAgenda.value = false; }
    };
    const handleAbrirAgenda = () => { mostrarAgenda.value = true; error.value = ''; handleCargarAgenda(); };
    const handleCerrarAgenda = () => { mostrarAgenda.value = false; ++versionAgenda; cargandoAgenda.value = false; };
    const handleLetraAgenda = (letra) => { letraAgenda.value = letra; };
    watch([letraAgenda, busquedaAgenda], () => {
        ++versionAgenda; clearTimeout(timerAgenda);
        contactosAgenda.value = []; hayMasAgenda.value = false;
        if (mostrarAgenda.value) timerAgenda = setTimeout(() => handleCargarAgenda(), 350);
    });
    const handleElegirContacto = async (usuario) => {
        conversacion.value = { ...(conversaciones.value.find(item => item.id === usuario.id) || {}), ...usuario };
        handleCerrarAgenda();
        await handleSeleccionar();
    };
    const handleMostrarCalendario = (event) => { handleActualizarHoy(); calendario.value?.toggle(event); };
    const handleCambiarFecha = async (valor) => {
        handleActualizarHoy();
        if (!(valor instanceof Date) || Number.isNaN(valor.getTime()) || handleDia(valor) > hoy.value) return;
        fechaSeleccionada.value = handleDia(valor);
        calendario.value?.hide();
        mensajesDelDia.value = []; antes = null; hayMasMensajes.value = false; error.value = '';
        await handleCargarMensajes();
    };
    const handleIrHoy = () => { handleActualizarHoy(); return handleCambiarFecha(hoy.value); };
    const handleMostrar = async () => {
        if (!await handleValidarAcceso()) return;
        mostrar.value = true; error.value = ''; handleActualizarHoy();
        await handleCargarConversaciones();
        if (conversacion.value) await handleIrHoy();
    };
    const handleSeleccionar = async () => {
        mostrarAgenda.value = false;
        borrador.value = ''; error.value = ''; mensajesDelDia.value = []; antes = null; hayMasMensajes.value = false;
        ++versionHistorial;
        cargandoMensajes.value = false;
        if (conversacion.value) { handleCargarFoto(conversacion.value.id); await handleIrHoy(); }
    };
    const handleVolver = () => { ++versionHistorial; conversacion.value = null; borrador.value = ''; mensajesDelDia.value = []; cargandoMensajes.value = false; };
    const handleEnviar = async () => {
        if (!puedeUsarChat.value || !conversacion.value || !borrador.value.trim() || enviando.value || conversacion.value.activo === false || conversacion.value.chat_habilitado === false) return;
        const usuarioId = conversacion.value.id, texto = borrador.value.trim();
        if (!envioPendiente || envioPendiente.usuario_id !== usuarioId || envioPendiente.texto !== texto) {
            envioPendiente = { usuario_id: usuarioId, texto, operacion_id: crypto.randomUUID() };
        }
        const payload = { ...envioPendiente };
        enviando.value = true; error.value = '';
        try {
            await handleConsulta('enviar', payload);
            if (!activa) return;
            envioPendiente = null;
            if (conversacion.value?.id === usuarioId) {
                if (borrador.value.trim() === texto) borrador.value = '';
                await handleIrHoy();
            }
            if (verArchivadas.value) { verArchivadas.value = false; conversaciones.value = []; offset = 0; }
            await handleCargarConversaciones();
        } catch (ex) { if (activa) error.value = ex.message; }
        finally { if (activa) enviando.value = false; }
    };
    const handleVisibilidad = () => { if (mostrar.value && document.visibilityState === 'visible') handleProgramarActualizacion(); };
    document.addEventListener('visibilitychange', handleVisibilidad);
    onBeforeUnmount(() => {
        activa = false; ++versionHistorial; ++versionBusqueda;
        clearTimeout(timerBuscar); clearTimeout(timerActualizar); clearTimeout(timerLeer); clearTimeout(timerAgenda); ++versionAgenda;
        document.removeEventListener('visibilitychange', handleVisibilidad);
        Object.values(fotosUsuarios).forEach(url => URL.revokeObjectURL(url));
    });
    handleActualizar();
    return { verArchivadas, mostrarAgenda, contactosAgenda, busquedaAgenda, letraAgenda, letrasAgenda, cargandoAgenda, hayMasAgenda,
        menuContacto, contactoMenu, opcionesContacto, confirmarEliminar, procesandoAccion, handleMenuContacto, handleAplicarAccion, handleVerArchivadas,
        handleCargarAgenda, handleAbrirAgenda, handleCerrarAgenda, handleLetraAgenda, handleElegirContacto, handleEstaConectado, handleEstadoConexion, puedeUsarChat, fotosUsuarios, mostrar, busqueda, borrador, contenedorMensajes, calendario, conversacion, conversaciones,
        conversacionesFiltradas, mensajesDelDia, sinLeer, hayMasConversaciones, hayMasMensajes,
        cargandoConversaciones, cargandoMensajes, buscando, enviando, error, hoy, fechaSeleccionada, viendoHoy, etiquetaFecha,
        handleHora, handleHoraLista, handleIniciales, handleCargarConversaciones, handleCargarMensajes, handleDesplazamiento,
        handleMostrarCalendario, handleCambiarFecha, handleIrHoy, handleMostrar, handleSeleccionar, handleVolver, handleEnviar };
}
