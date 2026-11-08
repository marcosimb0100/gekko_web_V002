import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { estadoSocket } from '@/helpers/socket';
import useAvisosNavegador from '../../../helpers/avisosNavegador';

export default function proceso() {
    const store = useStore(), router = useRouter(), toast = useToast();
    const mostrar = ref(false), cargando = ref(false), error = ref(''), leyendo = ref(''), archivando = ref('');
    const notificaciones = ref([]), sinLeer = ref(0), total = ref(0), offset = ref(0);
    let activo = true, temporizador = null, pendiente = false, avisoPendiente = false, reiniciarPendiente = false;
    let inicializado = false, ultimoAviso = '';
    const avisosNavegador = useAvisosNavegador({
        permitido: ref(true), handleAbrir: () => handleMostrar(), origen: 'mesa',
        titulo: 'Gekko \u00b7 Nueva solicitud',
        mensaje: 'Tienes nuevas solicitudes para revisar. Haz clic para abrir las notificaciones.',
        textoActivacion: 'Recibir\u00e1s avisos de solicitudes y cancelaciones cuando Gekko no est\u00e9 en primer plano.',
        validarId: id => typeof id === 'string' && id.length <= 300 && /^[0-9T:.+\-]+\|mesa:[A-Za-z0-9_:]+$/.test(id)
    });
    const handleActualizar = async ({ avisar = false, reiniciar = false } = {}) => {
        if (!activo) return;
        if (cargando.value) {
            pendiente = true;
            avisoPendiente = avisoPendiente || avisar;
            reiniciarPendiente = reiniciarPendiente || reiniciar;
            return;
        }
        if (reiniciar) offset.value = 0;
        cargando.value = true;
        error.value = '';
        try {
            const res = await store.dispatch('api/apiPostTokenSinCargando', {
                direccion: '/notificaciones/consultar', datosJson: { limite: 20, offset: offset.value }
            });
            if (!activo) return;
            if (res.estatus !== 200) throw new Error(res.mensaje || 'No fue posible consultar los avisos.');
            const anterior = sinLeer.value;
            notificaciones.value = res.datos?.notificaciones || [];
            sinLeer.value = Number(res.datos?.sin_leer || 0);
            total.value = Number(res.datos?.total || 0);
            const reciente = typeof res.datos?.ultimo_aviso === 'string' ? res.datos.ultimo_aviso : '';
            const nuevo = reciente > ultimoAviso;
            if (avisar && inicializado && nuevo) avisosNavegador.handleAvisar(reciente);
            ultimoAviso = reciente > ultimoAviso ? reciente : ultimoAviso;
            if (!sinLeer.value) avisosNavegador.handleCerrarAviso();
            if (avisar && inicializado && (nuevo || sinLeer.value > anterior)) {
                toast.add({ severity: 'info', summary: 'Nuevas notificaciones', detail: 'Tienes nuevas solicitudes para revisar. Consulta la campana.', life: 5000 });
            }
            inicializado = true;
        } catch (err) {
            if (activo) error.value = err.message || 'No fue posible consultar los avisos.';
        } finally {
            if (activo) {
                cargando.value = false;
                if (pendiente) {
                    const opciones = { avisar: avisoPendiente, reiniciar: reiniciarPendiente };
                    pendiente = avisoPendiente = reiniciarPendiente = false;
                    handleActualizar(opciones);
                }
            }
        }
    };
    const handleProgramar = (avisar = false) => {
        avisoPendiente = avisoPendiente || avisar;
        if (temporizador !== null) return;
        // Agrupar eventos de cargas masivas; no crear una consulta por solicitud.
        temporizador = setTimeout(() => {
            temporizador = null;
            const aviso = avisoPendiente;
            avisoPendiente = false;
            handleActualizar({ avisar: aviso, reiniciar: true });
        }, 500);
    };
    watch(() => estadoSocket.revisionNotificaciones, () => handleProgramar(true));
    watch(() => estadoSocket.revisionConexion, () => handleProgramar(true));
    const handleMostrar = () => { mostrar.value = true; handleActualizar({ reiniciar: true }); };
    const handleCerrar = () => { mostrar.value = false; };
    const handleFecha = (fecha) => fecha ? new Date(fecha).toLocaleString('es-MX') : '';
    const handlePagina = (direccion) => { offset.value = Math.max(0, offset.value + direccion * 20); handleActualizar(); };
    const handleLeer = async (item, navegar = false) => {
        if (leyendo.value || archivando.value) return;
        leyendo.value = item._id;
        try {
            const res = await store.dispatch('api/apiPostTokenSinCargando', {
                direccion: '/notificaciones/leer', datosJson: { id: item._id }
            });
            if (!activo) return;
            if (res.estatus !== 200) throw new Error(res.mensaje || 'No fue posible abrir la notificacion.');
            await handleActualizar();
            if (navegar && activo) {
                const ruta = item.ruta || '/operaciones/mesa_control';
                if (!['/operaciones/mesa_control', '/operaciones/cancelaciones'].includes(ruta)) throw new Error('Destino de notificacion no valido.');
                mostrar.value = false;
                router.push(ruta);
            }
        } catch (err) { if (activo) error.value = err.message; }
        finally { if (activo) leyendo.value = ''; }
    };
    const handleQuitar = async (item = null) => {
        if (archivando.value || leyendo.value) return;
        archivando.value = item?._id || 'leidas';
        error.value = '';
        try {
            const res = await store.dispatch('api/apiPostTokenSinCargando', {
                direccion: item ? '/notificaciones/archivar' : '/notificaciones/limpiar_leidas',
                datosJson: item ? { id: item._id } : {}
            });
            if (!activo) return;
            if (res.estatus !== 200) throw new Error(res.mensaje || 'No fue posible retirar las notificaciones.');
            await handleActualizar({ reiniciar: true });
        } catch (err) { if (activo) error.value = err.message; }
        finally { if (activo) archivando.value = ''; }
    };
    onMounted(() => handleActualizar());
    onBeforeUnmount(() => { activo = false; if (temporizador !== null) clearTimeout(temporizador); });
    return { ...avisosNavegador, mostrar, cargando, error, leyendo, archivando, notificaciones, sinLeer, total, offset,
        handleActualizar, handleMostrar, handleCerrar, handleFecha, handlePagina, handleLeer, handleQuitar };
}
