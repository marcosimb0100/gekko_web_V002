import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useSyncInstaller } from '../../../../helpers/syncInstaller';

const useProceso = () => {
    const servicioHabilitado = ref(null);
    const store = useStore();
    const toast = useToast();
    const instaladorWindows = useSyncInstaller(store, toast);
    const equipos = ref([]);
    const administrador = ref(false);
    const cargando = ref(false);
    const error = ref('');
    const offset = ref(0);
    const limite = 100;
    const ayudaVisible = ref(false);
    const confirmacionVisible = ref(false);
    const seleccionado = ref(null);
    const accion = ref('');
    const filtros = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS }, estado: { value: null, matchMode: FilterMatchMode.EQUALS } });
    const estados = [
        { nombre: 'Pendiente', valor: 'pendiente' },
        { nombre: 'Autorizado', valor: 'autorizado' },
        { nombre: 'Revocado', valor: 'revocado' }
    ];
    const handleEstado = (estado) => estados.find((item) => item.valor === estado)?.nombre || estado;
    const handleSeveridad = (estado) => ({ pendiente: 'warn', autorizado: 'success', revocado: 'danger' })[estado] || 'secondary';
    const handleFecha = (fecha) => (fecha ? new Date(fecha).toLocaleString('es-MX') : 'Sin actividad');
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
            toast.add({ severity: 'error', summary: 'Equipos Windows', detail: error.value, life: 6000 });
        } finally {
            cargando.value = false;
        }
    };
    const handleCargarEquipos = async () => {
        const datos = handleRespuesta(await store.dispatch('api/apiGetToken', { direccion: `/sync/windows/dispositivos?offset=${offset.value}` }));
        equipos.value = datos.equipos;
        servicioHabilitado.value = datos.servicio_habilitado === true;
        administrador.value = datos.administrador === true;
    };
    const handleActualizar = () => handleEjecutar(handleCargarEquipos);
    const handlePaginar = (paso) =>
        handleEjecutar(async () => {
            offset.value = Math.max(0, offset.value + paso * limite);
            await handleCargarEquipos();
        });
    const handleMostrarAyuda = () => {
        ayudaVisible.value = true;
    };
    const handleCerrarAyuda = () => {
        ayudaVisible.value = false;
    };
    const handleMostrarConfirmacion = (equipo, tipo) => {
        seleccionado.value = equipo;
        accion.value = tipo;
        error.value = '';
        confirmacionVisible.value = true;
    };
    const handleCerrarConfirmacion = () => {
        confirmacionVisible.value = false;
    };
    const handleConfirmar = () =>
        handleEjecutar(async () => {
            handleRespuesta(await store.dispatch('api/apiPostToken', { direccion: `/sync/windows/dispositivos/${seleccionado.value._id}/${accion.value}`, datosJson: {} }));
            confirmacionVisible.value = false;
            toast.add({ severity: 'success', summary: 'Equipos Windows', detail: accion.value === 'autorizar' ? 'Equipo autorizado.' : 'Equipo revocado.', life: 3500 });
            await handleCargarEquipos();
        });
    onMounted(handleActualizar);
    return {
        ...instaladorWindows,
        servicioHabilitado,
        equipos,
        administrador,
        cargando,
        error,
        offset,
        limite,
        ayudaVisible,
        confirmacionVisible,
        seleccionado,
        accion,
        filtros,
        estados,
        handleEstado,
        handleSeveridad,
        handleFecha,
        handleActualizar,
        handlePaginar,
        handleMostrarAyuda,
        handleCerrarAyuda,
        handleMostrarConfirmacion,
        handleCerrarConfirmacion,
        handleConfirmar
    };
};
export default useProceso;
