import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, reactive, ref } from 'vue';
import { useStore } from 'vuex';

export default function useProceso() {
    const store = useStore();
    const toast = useToast();
    const confirm = useConfirm();
    const pestana = ref('areas');
    const areas = ref([]);
    const tiposNomina = ref([]);
    const periodicidadesPago = ref([]);
    const configuracionNomina = reactive({ tipo_nomina: '', periodicidad_pago: '' });
    const guardandoNomina = ref(false);
    const cargarNomina = async () => {
        try {
            const [catalogos, configuracion] = await Promise.all([
                store.dispatch('api/apiGetToken', { direccion: '/catalogo_recursos_humanos/nomina/catalogos' }),
                store.dispatch('api/apiGetToken', { direccion: '/catalogo_recursos_humanos/nomina/configuracion' })
            ]);
            if (catalogos?.estatus === 200) {
                tiposNomina.value = catalogos.datos?.tipo_nomina || [];
                periodicidadesPago.value = catalogos.datos?.periodicidad_pago || [];
            } else avisar('error', catalogos?.mensaje || 'Error al consultar catálogos SAT');
            if (configuracion?.estatus === 200) {
                configuracionNomina.tipo_nomina = configuracion.datos?.tipo_nomina || '';
                configuracionNomina.periodicidad_pago = configuracion.datos?.periodicidad_pago || '';
            } else avisar('error', configuracion?.mensaje || 'Error al consultar predeterminados');
        } catch (error) {
            avisar('error', error?.message || 'Error de conexión');
        }
    };
    const seleccionarPredeterminado = async (tipo, clave) => {
        if (configuracionNomina[tipo] === clave) return;
        const anterior = configuracionNomina[tipo];
        configuracionNomina[tipo] = clave;
        // Ambos valores se guardan en el mismo documento; se requiere elegir ambos.
        if (!configuracionNomina.tipo_nomina || !configuracionNomina.periodicidad_pago) {
            avisar('warn', 'Selecciona también el predeterminado del otro catálogo para guardar.');
            return;
        }
        guardandoNomina.value = true;
        try {
            const r = await store.dispatch('api/apiPutToken', {
                direccion: '/catalogo_recursos_humanos/nomina/configuracion',
                datosJson: { tipo_nomina: configuracionNomina.tipo_nomina, periodicidad_pago: configuracionNomina.periodicidad_pago }
            });
            if (r?.estatus === 200) avisar('success', 'Predeterminados guardados');
            else {
                configuracionNomina[tipo] = anterior;
                avisar('error', r?.mensaje || 'No fue posible guardar');
            }
        } catch (error) {
            configuracionNomina[tipo] = anterior;
            avisar('error', error?.message || 'Error de conexión');
        } finally {
            guardandoNomina.value = false;
        }
    };

    const puestos = ref([]);
    const busqueda = reactive({ areas: '', puestos: '' });
    const visible = ref(false);
    const guardando = ref(false);
    const tipoEdicion = ref('areas');
    const form = reactive({ _id: '', nombre: '', area_id: '' });
    const avisar = (severity, detail) => toast.add({ severity, summary: severity === 'success' ? 'Correcto' : 'Aviso', detail, life: 3500 });
    const cargarTodo = async () => {
        try {
            const [a, p] = await Promise.all(['areas', 'puestos'].map((tipo) => store.dispatch('api/apiGetToken', { direccion: `/catalogo_recursos_humanos/${tipo}` })));
            if (a.estatus === 200) areas.value = Array.isArray(a.datos) ? a.datos : [];
            else avisar('error', a.mensaje || 'Error al consultar áreas');
            if (p.estatus === 200) puestos.value = Array.isArray(p.datos) ? p.datos : [];
            else avisar('error', p.mensaje || 'Error al consultar puestos');
        } catch (error) {
            avisar('error', error.message || 'No se pudo consultar el catálogo');
        }
    };
    const areasActivas = computed(() => areas.value.filter((x) => x.activo));
    const nombreArea = (id) => areas.value.find((x) => x._id === id)?.nombre || 'Área no disponible';
    const filtrados = (tipo) => {
        const q = busqueda[tipo].trim().toLowerCase();
        const lista = tipo === 'areas' ? areas.value : puestos.value;
        return lista.filter((x) => !q || `${x.nombre} ${tipo === 'puestos' ? nombreArea(x.area_id) : ''}`.toLowerCase().includes(q));
    };
    const abrirNuevo = (tipo) => {
        tipoEdicion.value = tipo;
        Object.assign(form, { _id: '', nombre: '', area_id: '' });
        visible.value = true;
    };
    const abrirEditar = (tipo, item) => {
        tipoEdicion.value = tipo;
        Object.assign(form, { _id: item._id, nombre: item.nombre, area_id: item.area_id || '' });
        visible.value = true;
    };
    const guardar = async () => {
        if (!form.nombre.trim()) return avisar('warn', 'Captura el nombre');
        if (tipoEdicion.value === 'puestos' && !form.area_id) return avisar('warn', 'Selecciona el área');
        guardando.value = true;
        try {
            const direccion = `/catalogo_recursos_humanos/${tipoEdicion.value}${form._id ? '/' + form._id : ''}`;
            const datosJson = { nombre: form.nombre.trim().toLocaleUpperCase('es-MX'), ...(tipoEdicion.value === 'puestos' ? { area_id: form.area_id } : {}) };
            const accion = form._id ? 'api/apiPutToken' : 'api/apiPostToken';
            const r = await store.dispatch(accion, { direccion, datosJson });
            if ([200, 201].includes(r.estatus)) {
                visible.value = false;
                avisar('success', r.mensaje || 'Guardado');
                await cargarTodo();
            } else avisar('error', r.mensaje || 'No fue posible guardar');
        } catch (error) {
            avisar('error', error.message || 'Error de conexión');
        } finally {
            guardando.value = false;
        }
    };
    const cambiarEstado = (tipo, item) =>
        confirm.require({
            group: 'catalogoRecursosHumanos',
            message: `¿Deseas ${item.activo ? 'desactivar' : 'activar'} ${item.nombre}?`,
            header: 'Confirmar cambio',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Confirmar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    const r = await store.dispatch('api/apiPutToken', { direccion: `/catalogo_recursos_humanos/${tipo}/${item._id}/estatus`, datosJson: { activo: !item.activo } });
                    if (r.estatus === 200) {
                        avisar('success', r.mensaje || 'Actualizado');
                        await cargarTodo();
                    } else avisar('error', r.mensaje || 'No se pudo cambiar el estatus');
                } catch (error) {
                    avisar('error', error.message || 'Error de conexión');
                }
            }
        });
    onMounted(() => {
        cargarTodo();
        cargarNomina();
    });
    return {
        tiposNomina,
        periodicidadesPago,
        configuracionNomina,
        guardandoNomina,
        cargarNomina,
        seleccionarPredeterminado,
        pestana,
        areas,
        puestos,
        busqueda,
        visible,
        guardando,
        tipoEdicion,
        form,
        areasActivas,
        nombreArea,
        filtrados,
        cargarTodo,
        abrirNuevo,
        abrirEditar,
        guardar,
        cambiarEstado
    };
}
