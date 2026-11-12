import { computed, onMounted, reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
const fechaLocal = fecha => fecha instanceof Date && !Number.isNaN(fecha.getTime()) ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}` : null;
const nuevaFecha = () => {
    const partes = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const valor = tipo => partes.find(p => p.type === tipo).value;
    return new Date(`${valor('year')}-${valor('month')}-${valor('day')}T12:00:00`);
};
const inicial = () => ({ id: null, operaciones_iniciadas: false, nombre: '', notas: '', activo: true, importe: 0, fecha: nuevaFecha() });
export default function useProceso() {
    const store = useStore();
    const toast = useToast();
    const cajas = ref([]), version = ref('');
    const mostrar = ref(false), cargando = ref(false), guardando = ref(false), conflicto = ref(false), puedeModificar = ref(false);
    const error = ref(''), errorFormulario = ref(''), busqueda = ref(''), estado = ref(null);
    const formulario = reactive(inicial());
    let operacion = null;
    const estados = [{ label: 'Activas', value: true }, { label: 'Inactivas', value: false }];
    const filas = computed(() => cajas.value.filter(c => (estado.value === null || c.activo === estado.value) && c.nombre.toLocaleLowerCase().includes(busqueda.value.trim().toLocaleLowerCase())));
    const saldoBloqueado = computed(() => !!formulario.id && (formulario.operaciones_iniciadas || !puedeModificar.value));
    const formularioValido = computed(() => formulario.nombre.trim().length > 0 && formulario.nombre.length <= 100 && Number.isFinite(formulario.importe) && formulario.importe >= 0 && formulario.importe <= 999999999999.99 && !!fechaLocal(formulario.fecha));
    const handleMoneda = valor => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(valor || 0));
    const handleFecha = valor => valor ? new Date(valor + 'T12:00:00').toLocaleDateString('es-MX') : '\u2014';
    const handleCargar = async () => {
        if (cargando.value || guardando.value) return;
        cargando.value = true; error.value = '';
        try {
            const res = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/efectivo/cajas/' });
            if (res.estatus !== 200) { error.value = res.mensaje || 'No fue posible consultar las cajas.'; return; }
            cajas.value = res.datos.cajas || [];
            version.value = res.datos.version_estado; puedeModificar.value = res.datos.puede_modificar_saldos === true; conflicto.value = res.datos.conflicto === true;
        } catch { error.value = 'No fue posible conectar con el servidor.'; }
        finally { cargando.value = false; }
    };
    const handleNuevo = () => { Object.assign(formulario, inicial()); operacion = crypto.randomUUID(); errorFormulario.value = ''; mostrar.value = true; };
    const handleEditar = caja => { Object.assign(formulario, inicial(), caja, { importe: Number(caja.saldo), fecha: new Date(caja.fecha_saldo + 'T12:00:00') }); operacion = crypto.randomUUID(); errorFormulario.value = ''; mostrar.value = true; };
    const handleLimpiar = () => { busqueda.value = ''; estado.value = null; };
    const handleGuardar = async () => {
        if (guardando.value || !formularioValido.value) return;
        guardando.value = true; errorFormulario.value = '';
        let guardado = false;
        try {
            const datosJson = { id: formulario.id, nombre: formulario.nombre, notas: formulario.notas, activo: formulario.activo, saldo: String(formulario.importe), fecha_saldo: fechaLocal(formulario.fecha), version_estado: version.value, operacion_id: operacion };
            const res = await store.dispatch(formulario.id ? 'api/apiPutToken' : 'api/apiPostToken', { direccion: '/efectivo/cajas/', datosJson });
            if (res.estatus !== 200) { errorFormulario.value = res.mensaje || 'No fue posible guardar la caja.'; return; }
            mostrar.value = false; guardado = true;
            toast.add({ severity: 'success', summary: 'Cajas', detail: res.mensaje, life: 4000 });
        } catch { errorFormulario.value = 'No fue posible guardar. Intenta nuevamente.'; }
        finally { guardando.value = false; }
        if (guardado) await handleCargar();
    };
    onMounted(handleCargar);
    return { cajas, mostrar, cargando, guardando, error, errorFormulario, conflicto, busqueda, estado, estados, filas, formulario, formularioValido, saldoBloqueado, handleNuevo, handleEditar, handleCargar, handleGuardar, handleLimpiar, handleMoneda, handleFecha };
}
