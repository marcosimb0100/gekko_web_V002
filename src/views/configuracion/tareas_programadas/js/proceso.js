import { computed, ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';

export default function proceso() {
    const store = useStore(), toast = useToast();
    const mostrarDetalle = ref(false), detalles = ref([]);
    const handleDetalle = item => { detalles.value = item.detalles || []; mostrarDetalle.value = true; };
    const puedeModificar = ref(false), mostrar = ref(false), guardando = ref(false), seleccionada = ref(null), valores = ref({}), errorEdicion = ref('');
    const campos = computed(() => seleccionada.value?.id === 'recordatorios_pagos' ? [
        { key: 'intervalo_minutos', label: 'Revisar pagos cada (minutos)', min: 1, max: 1440 }
    ] : seleccionada.value?.id === 'cancelaciones_sat' ? [
        { key: 'intervalo_minutos', label: 'Revisar cancelaciones cada (minutos)', min: 1, max: 1440 }
    ] : seleccionada.value?.id === 'recordatorios_juridico' ? [
        { key: 'intervalo_minutos', label: 'Revisar agenda cada (minutos)', min: 1, max: 1440 },
        { key: 'anticipacion_dias', label: 'Avisar dias antes del compromiso', min: 0, max: 30 }
    ] : seleccionada.value?.id === 'sat_portal' ? [
        { key: 'hora_1', label: 'Primera hora (24 horas)', min: 0, max: 23 },
        { key: 'minuto_1', label: 'Primer minuto', min: 0, max: 59 },
        { key: 'hora_2', label: 'Segunda hora (24 horas)', min: 0, max: 23 },
        { key: 'minuto_2', label: 'Segundo minuto', min: 0, max: 59 }
    ] : seleccionada.value?.id === 'sat_69b' ? [
        { key: 'hora', label: 'Hora del dia 1 (formato de 24 horas)', min: 0, max: 23 },
        { key: 'minuto', label: 'Minuto', min: 0, max: 59 }
    ] : seleccionada.value?.id === 'correos_factura' ? [
        { key: 'intervalo_segundos', label: 'Revisar correos cada (segundos)', min: 5, max: 300 }
    ] : [
        { key: 'espera_segundos', label: 'Espera sin trabajo (segundos)', min: 1, max: 60 },
        { key: 'reintento_segundos', label: 'Espera ante un fallo del servicio (segundos)', min: 5, max: 300 },
        { key: 'actividad_segundos', label: 'Reportar actividad cada (segundos)', min: 10, max: 120 }
    ]);
    const valido = computed(() => campos.value.every(c => Number.isInteger(valores.value[c.key]) && valores.value[c.key] >= c.min && valores.value[c.key] <= c.max) && (seleccionada.value?.id !== 'sat_portal' || valores.value.hora_1 !== valores.value.hora_2 || valores.value.minuto_1 !== valores.value.minuto_2));
    const handleEditar = item => { seleccionada.value = item; valores.value = { ...item.configuracion, habilitada: item.configuracion?.habilitada !== false }; errorEdicion.value = ''; mostrar.value = true; };
    const handleGuardar = async () => {
        if (guardando.value || !valido.value || !puedeModificar.value) return;
        guardando.value = true;
        errorEdicion.value = '';
        try {
            const res = await store.dispatch('api/apiPutToken', { direccion: '/tareas_programadas/' + seleccionada.value.id,
                datosJson: { configuracion: { ...valores.value }, revision: seleccionada.value.config_revision } });
            if (res.estatus !== 200) throw new Error(res.mensaje || 'No fue posible guardar los intervalos.');
            mostrar.value = false;
            toast.add({ severity: 'success', summary: 'Tareas programadas', detail: res.mensaje, life: 5000 });
            await handleCargar();
        } catch (err) { errorEdicion.value = err.message; }
        finally { guardando.value = false; }
    };
    const tareas = ref([]), cargando = ref(false), error = ref(''), busqueda = ref('');
    const filtradas = computed(() => tareas.value.filter(item => (item.nombre + ' ' + item.descripcion).toLocaleLowerCase('es').includes(busqueda.value.trim().toLocaleLowerCase('es'))));
    const handleCargar = async () => {
        if (cargando.value) return;
        cargando.value = true;
        error.value = '';
        try {
            const res = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/tareas_programadas/' });
            if (res.estatus !== 200) throw new Error(res.mensaje || 'No fue posible consultar las tareas.');
            tareas.value = res.datos?.tareas || [];
            puedeModificar.value = res.datos?.puede_modificar === true;
        } catch (err) { error.value = err.message || 'No fue posible consultar las tareas.'; }
        finally { cargando.value = false; }
    };
    const estados = {
        deshabilitada: { label: 'Deshabilitada', severity: 'secondary' },
        completado: { label: 'Finalizada', severity: 'success' },
        sin_ejecuciones: { label: 'Sin ejecuciones', severity: 'secondary' },
        activo: { label: 'Servicio activo', severity: 'success' },
        ejecutando: { label: 'En proceso', severity: 'info' },
        terminada: { label: 'Finalizada', severity: 'success' },
        con_observaciones: { label: 'Con observaciones', severity: 'warn' },
        error: { label: 'Error', severity: 'danger' },
        sin_actividad_reciente: { label: 'Sin actividad reciente', severity: 'warn' }
    };
    const handleEstado = estado => estados[estado] || estados.sin_ejecuciones;
    const handleFecha = valor => valor ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(valor)) : 'Sin registro';
    onMounted(handleCargar);
    return { mostrarDetalle, detalles, handleDetalle, puedeModificar, mostrar, guardando, seleccionada, valores, campos, valido, errorEdicion, handleEditar, handleGuardar, tareas, filtradas, cargando, error, busqueda, handleCargar, handleEstado, handleFecha };
}
