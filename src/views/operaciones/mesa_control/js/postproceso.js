import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import { estadoSocket } from '../../../../helpers/socket';

export default function usePostproceso({ obtenerFiltros }) {
    const store = useStore(), toast = useToast();
    const mostrarPostproceso = ref(false), iniciandoPostproceso = ref(false), consultandoPostproceso = ref(false);
    const errorPostproceso = ref(''), estadoPostproceso = ref({ estado: 'sin_iniciar', pendientes: 0 });
    const filtrosPostproceso = ref(null);
    const postprocesoActivo = computed(() => estadoPostproceso.value.estado === 'procesando');
    let timer = null, activo = true;
    const handleConsultarPostproceso = async () => {
        if (!activo || consultandoPostproceso.value) return;
        const filtros = filtrosPostproceso.value || obtenerFiltros();
        const claveConsulta = JSON.stringify(filtros);
        let repetirConsulta = false;
        consultandoPostproceso.value = true;
        try {
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/postproceso_cfdi/estado?' + new URLSearchParams(filtros) });
            if (!activo) return;
            if (JSON.stringify(filtrosPostproceso.value || obtenerFiltros()) !== claveConsulta) { repetirConsulta = true; return; }
            if (r.estatus !== 200) throw new Error(r.mensaje || 'No fue posible consultar el avance.');
            estadoPostproceso.value = r.datos;
            errorPostproceso.value = '';
        } catch (e) { if (activo) errorPostproceso.value = e.message || 'No fue posible consultar el avance.'; }
        finally {
            consultandoPostproceso.value = false;
            clearTimeout(timer);
            if (activo && mostrarPostproceso.value && (repetirConsulta || postprocesoActivo.value)) timer = setTimeout(handleConsultarPostproceso, repetirConsulta ? 0 : 5000);
        }
    };
    const handleAbrirPostproceso = () => { filtrosPostproceso.value = { ...obtenerFiltros() }; estadoPostproceso.value = { estado: 'sin_iniciar', pendientes: 0 }; mostrarPostproceso.value = true; return handleConsultarPostproceso(); };
    const handleIniciarPostproceso = async () => {
        if (iniciandoPostproceso.value || postprocesoActivo.value) return;
        iniciandoPostproceso.value = true; errorPostproceso.value = '';
        try {
            const r = await store.dispatch('api/apiPostToken', { direccion: '/postproceso_cfdi/iniciar', datosJson: { ...filtrosPostproceso.value } });
            if (r.estatus !== 202) throw new Error(r.mensaje || 'No fue posible iniciar el proceso.');
            toast.add({ severity: 'info', summary: 'Procesamiento CFDI', detail: r.mensaje, life: 5000 });
            estadoPostproceso.value = { ...estadoPostproceso.value, estado: 'procesando', porcentaje: 0, total: 0, revisados: 0, completados: 0, errores: 0 };
        } catch (e) { errorPostproceso.value = e.message || 'No fue posible iniciar el proceso.'; }
        finally { iniciandoPostproceso.value = false; await handleConsultarPostproceso(); }
    };
    watch(() => estadoSocket.revisionPostproceso, () => {
        if (!mostrarPostproceso.value) return;
        clearTimeout(timer); timer = setTimeout(handleConsultarPostproceso, 700);
    });
    watch(() => estadoSocket.revisionConexion, () => { if (mostrarPostproceso.value) handleConsultarPostproceso(); });
    watch(mostrarPostproceso, visible => { if (!visible) clearTimeout(timer); });
    onBeforeUnmount(() => { activo = false; clearTimeout(timer); });
    return { filtrosPostproceso, mostrarPostproceso, iniciandoPostproceso, consultandoPostproceso, errorPostproceso, estadoPostproceso, postprocesoActivo,
        handleAbrirPostproceso, handleConsultarPostproceso, handleIniciarPostproceso };
}
