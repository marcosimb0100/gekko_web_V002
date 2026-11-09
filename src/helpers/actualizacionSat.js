import { ref, computed } from 'vue';

export const avanceSat = ref({ porcentaje: 0, fase: 'preparando', completados: 0 });
export const trabajoSat = ref('');
export const actualizandoSat = computed(() => avanceSat.value.estado === 'procesando');
export const revisionFinSat = ref(0);
const claveTrabajo = 'gekko_sat_actualizacion';
let storeActual = null, temporizador = null, consultando = false, propietario = '', ultimaConsulta = 0;
const handleUsuario = () => localStorage.getItem('token') || '';
export const descripcionSat = computed(() => {
    const dato = avanceSat.value;
    const fases = { preparando: 'Preparando CFDI', descargando: 'Revisando y descargando XML', procesando: 'Procesando XML y proveedores', sincronizando: 'Actualizando estatus SAT' };
    return `${fases[dato.fase] || 'Actualizando CFDI'}: ${dato.completados || 0} de ${dato.total_fase || dato.total || 0}`;
});
export const handleDetenerSeguimientoSat = () => {
    clearTimeout(temporizador); temporizador = null;
    trabajoSat.value = ''; avanceSat.value = { porcentaje: 0 }; propietario = '';
};
export const handleConsultarSat = async () => {
    if (!trabajoSat.value || !storeActual || consultando) return;
    if (propietario !== handleUsuario()) { handleDetenerSeguimientoSat(); return; }
    if (Date.now() - ultimaConsulta < 1000) return;
    consultando = true; ultimaConsulta = Date.now();
    const trabajo = trabajoSat.value, usuario = propietario;
    try {
        const respuesta = await storeActual.dispatch('api/apiPostTokenSinCargando', { direccion: '/sat_portal/actualizacion_estado/' + trabajo, datosJson: {} });
        if (trabajoSat.value !== trabajo || usuario !== handleUsuario()) return;
        if ([401, 402, 403, 404].includes(respuesta.estatus)) {
            sessionStorage.removeItem(claveTrabajo);
            avanceSat.value = { estado: 'error', mensaje: respuesta.mensaje || 'No se pudo consultar la actualizacion.', porcentaje: 0 };
            revisionFinSat.value += 1; clearTimeout(temporizador); return;
        }
        if (respuesta.estatus !== 200) throw new Error('Estado no disponible');
        const anterior = avanceSat.value.estado;
        avanceSat.value = respuesta.datos;
        if (avanceSat.value.estado !== 'procesando') {
            sessionStorage.removeItem(claveTrabajo); clearTimeout(temporizador);
            if (anterior === 'procesando') revisionFinSat.value += 1;
        }
    } catch { /* El respaldo por API consultara de nuevo, sin reiniciar el trabajo. */ }
    finally { consultando = false; }
};
const handleProgramarConsulta = () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(async () => {
        await handleConsultarSat();
        if (actualizandoSat.value) handleProgramarConsulta();
    }, 15000);
};
export const handleSeguirSat = (store, trabajo) => {
    if (!/^[a-f0-9]{32}$/.test(trabajo || '')) return;
    storeActual = store;
    if (trabajoSat.value !== trabajo || propietario !== handleUsuario()) {
        propietario = handleUsuario(); trabajoSat.value = trabajo;
        avanceSat.value = { estado: 'procesando', fase: 'preparando', porcentaje: 0, completados: 0 };
        sessionStorage.setItem(claveTrabajo, trabajo); ultimaConsulta = 0;
    }
    handleConsultarSat(); handleProgramarConsulta();
};
export const handleRecuperarSat = store => {
    const trabajo = sessionStorage.getItem(claveTrabajo);
    if (trabajo) handleSeguirSat(store, trabajo);
};
