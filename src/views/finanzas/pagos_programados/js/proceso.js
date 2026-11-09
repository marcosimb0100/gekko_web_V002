import { computed, onMounted, reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
const inicial = () => ({ id: null, revision: null, proveedor: null, empresa: null, concepto: '', periodicidad: 'Mensual', inicio: new Date(), fecha_acordada: null, dia: 10, intervalo: 30, aviso: 3, medio: 'Transferencia', plazo: 'Contado', variable: true, importe: 0, notas: '', activo: true });
const fechaLocal = (fecha) => fecha instanceof Date && !isNaN(fecha) ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}` : null;
export default () => {
    const store = useStore();
    const toast = useToast();
    const mostrar = ref(false);
    const cargando = ref(false);
    const guardando = ref(false);
    const error = ref('');
    const errorFormulario = ref('');
    const busqueda = ref('');
    const periodicidad = ref(null);
    const formulario = reactive(inicial());
    const proveedores = ref([]);
    const empresas = ref([]);
    const periodicidades = ['Sin recurrencia', 'Semanal', 'Cada 14 dias', 'Quincenal', 'Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual', 'Personalizada'];
    const medios = ['Transferencia', 'Efectivo', 'Cheque', 'Tarjeta de debito', 'Tarjeta de credito', 'Otro'];
    const plazos = ['Contado', '15 dias', '30 dias', '60 dias', 'Fecha acordada'];
    const registros = ref([]);
    const filas = computed(() => registros.value.filter(item => (!periodicidad.value || item.periodicidad === periodicidad.value) && (item.proveedor_nombre + ' ' + item.empresa_nombre + ' ' + item.concepto).toLocaleLowerCase().includes(busqueda.value.trim().toLocaleLowerCase())));
    const resumen = computed(() => [
        { etiqueta: 'Acuerdos registrados', valor: registros.value.length, icono: 'pi pi-calendar' },
        { etiqueta: 'Programaciones activas', valor: registros.value.filter(i => i.activo).length, icono: 'pi pi-check-circle' },
        { etiqueta: 'Importe variable', valor: registros.value.filter(i => i.variable).length, icono: 'pi pi-receipt' }
    ]);
    const handleCargar = async () => {
        if (cargando.value) return;
        cargando.value = true; error.value = '';
        try {
            const res = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/pagos_programados/' });
            if (res.estatus !== 200) { error.value = res.mensaje || 'No fue posible consultar las programaciones.'; return; }
            registros.value = res.datos.programaciones || [];
            proveedores.value = (res.datos.proveedores || []).map(item => ({ ...item, deshabilitado: !item.activo }));
            empresas.value = (res.datos.empresas || []).map(item => ({ ...item, deshabilitado: !item.activo }));
        } catch { error.value = 'No fue posible conectar con el servidor.'; }
        finally { cargando.value = false; }
    };
    const handleNuevo = () => { Object.assign(formulario, inicial()); errorFormulario.value = ''; mostrar.value = true; };
    const handleEditar = (item) => { Object.assign(formulario, inicial(), item, { inicio: new Date(item.inicio + 'T12:00:00'), fecha_acordada: item.fecha_acordada ? new Date(item.fecha_acordada + 'T12:00:00') : null, importe: Number(item.importe || 0) }); errorFormulario.value = ''; mostrar.value = true; };
    const handleLimpiar = () => { busqueda.value = ''; periodicidad.value = null; };
    const handleMoneda = (valor) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor || 0);
    const handleFecha = (valor) => valor ? new Date(valor + 'T12:00:00').toLocaleDateString('es-MX') : '\u2014';
    const handleRegla = (item) => item.periodicidad === 'Mensual' ? `Dia ${item.dia} de cada mes` : item.periodicidad === 'Quincenal' ? 'Dia 15 y ultimo del mes' : item.periodicidad === 'Personalizada' ? `Cada ${item.intervalo} dias` : `Desde ${handleFecha(item.inicio)}`;
    const handleGuardar = async () => {
        if (guardando.value || !formulario.proveedor || !formulario.empresa || !formulario.concepto.trim() || !formulario.inicio) return;
        guardando.value = true; errorFormulario.value = '';
        try {
            const datosJson = { ...formulario, inicio: fechaLocal(formulario.inicio), fecha_acordada: fechaLocal(formulario.fecha_acordada), importe: formulario.variable ? null : String(formulario.importe), moneda: 'MXN' };
            const res = await store.dispatch(formulario.id ? 'api/apiPutToken' : 'api/apiPostToken', { direccion: '/pagos_programados/', datosJson });
            if (res.estatus !== 200) { errorFormulario.value = res.mensaje || 'No fue posible guardar la programacion.'; return; }
            mostrar.value = false;
            toast.add({ severity: 'success', summary: 'Pagos programados', detail: res.mensaje, life: 4000 });
            await handleCargar();
        } catch { errorFormulario.value = 'No fue posible guardar. Verifica la conexion e intenta nuevamente.'; }
        finally { guardando.value = false; }
    };
    onMounted(handleCargar);
    return { mostrar, cargando, guardando, error, errorFormulario, busqueda, periodicidad, formulario, proveedores, empresas, periodicidades, medios, plazos, filas, resumen, handleCargar, handleNuevo, handleEditar, handleLimpiar, handleGuardar, handleMoneda, handleFecha, handleRegla };
};
