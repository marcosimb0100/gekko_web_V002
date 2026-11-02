import { computed, onMounted, reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';

const useProceso = () => {
    const store = useStore();
    const toast = useToast();
    const cargando = ref(false);
    const error = ref('');
    const usuarios = ref([]);
    const buscar = ref('');
    const hayMasUsuarios = ref(false);
    const confirmarVisible = ref(false);
    const modeloGuardado = ref('');
    const usoBytes = ref(0);
    const apiWindowsDisponible = ref(false);
    const cuotaGuardadaBytes = ref(0);
    const modelos = [{ nombre: 'Por usuario', valor: 'usuarios' }, { nombre: 'Por perfil', valor: 'perfiles' }];
    const formulario = reactive({ activo: true, mostrar_sync_local: false, sincronizacion_activa: false,
        modelo_permisos: 'usuarios', limiteArchivoMB: 100, limiteGlobalMB: 0, administradores: [], revision: 0 });
    const handleRespuesta = res => {
        if (res.estatus < 200 || res.estatus >= 300) throw new Error(res.mensaje || 'No fue posible completar la operación.');
        return res.datos;
    };
    const handleEjecutar = async tarea => {
        if (cargando.value) return;
        cargando.value = true; error.value = '';
        try { await tarea(); }
        catch (e) { error.value = e.message; toast.add({ severity: 'error', summary: 'Configuración de Nube', detail: error.value, life: 6000 }); }
        finally { cargando.value = false; }
    };
    const handleCargarConfiguracion = async () => {
        const datos = handleRespuesta(await store.dispatch('api/apiGetToken', { direccion: '/sync/configuracion' }));
        Object.assign(formulario, { activo: datos.activo, mostrar_sync_local: datos.mostrar_sync_local,
            sincronizacion_activa: datos.sincronizacion_activa, modelo_permisos: datos.modelo_permisos,
            limiteArchivoMB: datos.limite_archivo_bytes / 1048576, limiteGlobalMB: datos.limite_global_bytes / 1048576,
            administradores: datos.administradores, revision: datos.revision });
        modeloGuardado.value = datos.modelo_permisos;
        apiWindowsDisponible.value = datos.motor_windows_disponible === true;
        usoBytes.value = datos.uso_bytes;
        cuotaGuardadaBytes.value = datos.limite_global_bytes;
        usuarios.value = datos.usuarios_administradores;
    };
    const handleCargarUsuarios = async agregar => {
        const offset = agregar ? usuarios.value.filter(item => item.resultadoBusqueda).length : 0;
        const params = new URLSearchParams({ tipo: 'usuarios', buscar: buscar.value, limite: 50, offset });
        const datos = handleRespuesta(await store.dispatch('api/apiGetToken', { direccion: `/sync/administracion/sujetos?${params}` }));
        const base = agregar ? usuarios.value : usuarios.value.filter(item => formulario.administradores.includes(item._id));
        const mapa = new Map(base.map(item => [item._id, item]));
        for (const item of datos.sujetos) mapa.set(item._id, { ...item, resultadoBusqueda: true });
        usuarios.value = [...mapa.values()];
        hayMasUsuarios.value = datos.sujetos.length === 50;
    };
    const handleActualizar = () => handleEjecutar(async () => { await handleCargarConfiguracion(); await handleCargarUsuarios(false); });
    const handleBuscarUsuarios = () => handleEjecutar(() => handleCargarUsuarios(false));
    const handleMasUsuarios = () => handleEjecutar(() => handleCargarUsuarios(true));
    const handlePersistir = async confirmar => {
        const datosGuardados = handleRespuesta(await store.dispatch('api/apiPutToken', { direccion: '/sync/configuracion', datosJson: {
            activo: formulario.activo, mostrar_sync_local: formulario.mostrar_sync_local,
            sincronizacion_activa: formulario.sincronizacion_activa, modelo_permisos: formulario.modelo_permisos,
            limite_archivo_bytes: Math.round(formulario.limiteArchivoMB * 1048576),
            limite_global_bytes: Math.round(formulario.limiteGlobalMB * 1048576),
            administradores: formulario.administradores, revision: formulario.revision, confirmar_cambio_modelo: confirmar
        }}));
        usoBytes.value = datosGuardados.uso_bytes;
        cuotaGuardadaBytes.value = datosGuardados.limite_global_bytes;
        confirmarVisible.value = false;
        toast.add({ severity: 'success', summary: 'Configuración de Nube', detail: 'Configuración guardada. Se aplicará en las siguientes peticiones.', life: 5000 });
        // May have removed the current administrator; do not perform another privileged request.
        formulario.revision += 1;
        modeloGuardado.value = formulario.modelo_permisos;
    };
    const handleGuardar = () => {
        if (formulario.modelo_permisos !== modeloGuardado.value) { confirmarVisible.value = true; return; }
        return handleEjecutar(() => handlePersistir(false));
    };
    const handleConfirmarModelo = () => handleEjecutar(() => handlePersistir(true));
    const handleFormatoBytes = bytes => `${(bytes / 1048576).toLocaleString('es-MX', { maximumFractionDigits: 2 })} MB`;
    const disponibleBytes = computed(() => Math.max(0, cuotaGuardadaBytes.value - usoBytes.value));
    const porcentajeUso = computed(() => cuotaGuardadaBytes.value > 0 ? usoBytes.value * 100 / cuotaGuardadaBytes.value : 0);
    const porcentajeTexto = computed(() => porcentajeUso.value > 0 && porcentajeUso.value < 0.01
        ? '< 0.01 %' : `${porcentajeUso.value.toLocaleString('es-MX', { maximumFractionDigits: 2 })} %`);
    const graficaDatos = computed(() => ({
        labels: ['Ocupado', 'Disponible'], datasets: [{
            data: [usoBytes.value, disponibleBytes.value],
            backgroundColor: [porcentajeUso.value >= 90 ? '#f59e0b' : '#06b6d4', '#e2e8f0'],
            borderWidth: 0, hoverOffset: 4
        }]
    }));
    const graficaOpciones = {
        responsive: true, maintainAspectRatio: false, cutout: '78%',
        plugins: { legend: { display: false }, tooltip: { callbacks: {
            label: context => `${context.label}: ${handleFormatoCapacidad(context.raw)}`
        } } }
    };
    const handleFormatoCapacidad = valor => {
        const bytes = Math.max(0, Number(valor) || 0);
        const unidad = bytes ? Math.min(4, Math.floor(Math.log(bytes) / Math.log(1024))) : 0;
        return `${(bytes / (1024 ** unidad)).toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${['B', 'KB', 'MB', 'GB', 'TB'][unidad]}`;
    };
    onMounted(handleActualizar);
    return { apiWindowsDisponible, cuotaGuardadaBytes, disponibleBytes, porcentajeTexto, graficaDatos, graficaOpciones, handleFormatoCapacidad, formulario, modelos, usuarios, buscar, hayMasUsuarios, usoBytes, cargando, error, confirmarVisible,
        handleActualizar, handleGuardar, handleConfirmarModelo, handleBuscarUsuarios, handleMasUsuarios, handleFormatoBytes };
};

export default useProceso;
