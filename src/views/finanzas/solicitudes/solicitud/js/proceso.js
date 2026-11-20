import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
const ruta = '/finanzas/solicitudes/';
const fechaLocal = (v) => (v instanceof Date && !Number.isNaN(v.getTime()) ? `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}` : null);
const inicial = () => ({ id: null, revision: null, empresa_id: null, descripcion: '', importe: null, fecha_pago: null });
export default function proceso() {
    const store = useStore(),
        toast = useToast();
    const registros = ref([]),
        total = ref(0),
        primero = ref(0),
        limite = ref(10),
        busqueda = ref(''),
        estado = ref(null);
    const cargando = ref(false),
        guardando = ref(false),
        subiendo = ref(false),
        retirando = ref(false),
        error = ref('');
    const mostrar = ref(false),
        tab = ref('datos'),
        seleccionado = ref(null),
        empresas = ref([]),
        fechaSolicitud = ref('');
    const formulario = reactive(inicial());
    const pendientes = ref([]);
    const mostrarAyuda = ref(false),
        mostrarRetiro = ref(false),
        archivoRetiro = ref(null),
        motivoRetiro = ref(''),
        verRetirados = ref(false),
        intentoArchivo = ref(0);
    const estados = ['Pendiente', 'Autorizada', 'Rechazada', 'Pagada', 'Cancelada'];
    let operacion = null,
        timer = null,
        activa = true,
        consulta = 0;
    const ocupado = computed(() => cargando.value || guardando.value || subiendo.value || retirando.value);
    const editable = computed(() => !seleccionado.value || seleccionado.value.estado === 'Pendiente');
    const valido = computed(() => !!formulario.empresa_id && formulario.descripcion.trim().length >= 3 && Number.isFinite(formulario.importe) && formulario.importe > 0 && !!fechaLocal(formulario.fecha_pago));
    const archivos = computed(() => (seleccionado.value?.archivos || []).filter((a) => verRetirados.value || !a.retirado));
    const empresaOpciones = computed(() =>
        formulario.empresa_id && !empresas.value.some((e) => e.id === formulario.empresa_id) ? [...empresas.value, { id: formulario.empresa_id, nombre: seleccionado.value?.empresa_nombre || 'Empresa inactiva' }] : empresas.value
    );
    const handleMoneda = (v) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v || 0));
    const handleFecha = (v) => (v ? String(v).slice(0, 10) : '—');
    const handleAviso = (mensaje, severity = 'success') => toast.add({ severity, summary: 'Solicitudes de pago', detail: mensaje, life: 4500 });
    const handleCargar = async () => {
        const actual = ++consulta;
        cargando.value = true;
        error.value = '';
        try {
            const q = new URLSearchParams({ pagina: String(Math.floor(primero.value / limite.value) + 1), limite: String(limite.value), busqueda: busqueda.value, estado: estado.value || '' });
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: ruta + '?' + q });
            if (!activa || actual !== consulta) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            registros.value = r.datos.solicitudes || [];
            total.value = r.datos.total || 0;
        } catch (e) {
            if (activa && actual === consulta) error.value = e.message || 'No fue posible consultar.';
        } finally {
            if (activa && actual === consulta) cargando.value = false;
        }
    };
    const handleOpciones = async () => {
        const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: ruta + 'opciones' });
        if (r.estatus !== 200) throw new Error(r.mensaje);
        empresas.value = r.datos.empresas || [];
        fechaSolicitud.value = r.datos.fecha_solicitud;
    };
    const handleNuevo = async () => {
        if (ocupado.value) return;
        cargando.value = true;
        error.value = '';
        try {
            await handleOpciones();
            Object.assign(formulario, inicial());
            seleccionado.value = null;
            pendientes.value = [];
            operacion = crypto.randomUUID();
            tab.value = 'datos';
            mostrar.value = true;
        } catch (e) {
            handleAviso(e.message || 'No fue posible cargar las empresas.', 'error');
        } finally {
            cargando.value = false;
        }
    };
    const handleLeer = async (id) => {
        const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: ruta + id });
        if (r.estatus !== 200) throw new Error(r.mensaje);
        const d = r.datos.solicitud;
        seleccionado.value = d;
        Object.assign(formulario, { id: d.id, revision: d.revision, empresa_id: d.empresa_id, descripcion: d.descripcion, importe: Number(d.importe), fecha_pago: new Date(d.fecha_pago + 'T12:00:00') });
        operacion = crypto.randomUUID();
    };
    const handleEditar = async (d) => {
        if (ocupado.value) return;
        cargando.value = true;
        error.value = '';
        try {
            await handleOpciones();
            await handleLeer(d.id);
            pendientes.value = [];
            verRetirados.value = false;
            tab.value = 'datos';
            mostrar.value = true;
        } catch (e) {
            handleAviso(e.message || 'No fue posible abrir.', 'error');
        } finally {
            cargando.value = false;
        }
    };
    const handleGuardar = async () => {
        if (ocupado.value || !valido.value || !editable.value) return;
        guardando.value = true;
        error.value = '';
        try {
            const datos = { empresa_id: formulario.empresa_id, descripcion: formulario.descripcion.trim(), importe: formulario.importe.toFixed(2), fecha_pago: fechaLocal(formulario.fecha_pago), operacion_id: operacion };
            if (formulario.id) Object.assign(datos, { id: formulario.id, revision: formulario.revision });
            const r = await store.dispatch(formulario.id ? 'api/apiPutToken' : 'api/apiPostToken', { direccion: ruta, datosJson: datos });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            const id = r.datos.id;
            for (const pendiente of [...pendientes.value]) {
                try {
                    const formData = new FormData();
                    formData.append('archivo', pendiente.archivo);
                    const adjunto = await store.dispatch('api/apiPostTokenFormData', { direccion: ruta + id + '/archivos', formData });
                    if (adjunto.estatus !== 200) throw new Error(adjunto.mensaje);
                    pendientes.value = pendientes.value.filter((a) => a !== pendiente);
                } catch (ex) {
                    pendiente.error = ex.message || 'No fue posible cargar este comprobante.';
                }
            }
            await handleLeer(r.datos.id);
            if (pendientes.value.length) {
                tab.value = 'archivos';
                error.value = 'La solicitud quedó guardada, pero hay comprobantes sin cargar. Pulsa Guardar para reintentarlos o quítalos de la selección.';
                handleAviso('Solicitud guardada con comprobantes pendientes de carga.', 'warn');
            } else {
                handleAviso('Solicitud y comprobantes guardados.');
            }
        } catch (e) {
            error.value = e.message || 'No fue posible guardar.';
        } finally {
            guardando.value = false;
        }
    };
    const handleVolver = () => {
        if (ocupado.value) return;
        mostrar.value = false;
        seleccionado.value = null;
        pendientes.value = [];
        error.value = '';
        handleCargar();
    };
    const handlePagina = (e) => {
        primero.value = e.first;
        limite.value = e.rows;
        handleCargar();
    };
    const handleLimpiar = () => {
        busqueda.value = '';
        estado.value = null;
        primero.value = 0;
        handleCargar();
    };
    const handleAdjuntar = (e) => {
        if (ocupado.value || !editable.value) return;
        const vigentes = (seleccionado.value?.archivos || []).filter((a) => !a.retirado).length;
        for (const archivo of e.files || []) {
            if (!/\.(pdf|jpe?g|png)$/i.test(archivo.name) || !archivo.size || archivo.size > 10485760) {
                handleAviso('Selecciona PDF, JPG o PNG de hasta 10 MB y que no estén vacíos.', 'error');
                continue;
            }
            if (pendientes.value.some((a) => a.archivo.name === archivo.name && a.archivo.size === archivo.size && a.archivo.lastModified === archivo.lastModified)) continue;
            if (vigentes + pendientes.value.length >= 10) {
                handleAviso('Se permiten hasta 10 comprobantes vigentes por solicitud.', 'warn');
                break;
            }
            pendientes.value.push({ id: crypto.randomUUID(), archivo, error: '' });
        }
        intentoArchivo.value++;
    };
    const handleQuitarPendiente = (id) => {
        if (!ocupado.value) pendientes.value = pendientes.value.filter((a) => a.id !== id);
    };
    const handleDescargar = async (a) => {
        if (ocupado.value) return;
        cargando.value = true;
        try {
            const r = await store.dispatch('api/apiGetblob', { direccion: ruta + formulario.id + '/archivos/' + a.id });
            if (r.estatus !== 200) throw new Error(r.mensaje || 'No fue posible descargar.');
            const url = URL.createObjectURL(r.data),
                enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = a.nombre;
            enlace.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
            handleAviso(e.message, 'error');
        } finally {
            cargando.value = false;
        }
    };
    const handleRetiro = (a) => {
        archivoRetiro.value = a;
        motivoRetiro.value = '';
        mostrarRetiro.value = true;
    };
    const handleRetirar = async () => {
        if (ocupado.value || motivoRetiro.value.trim().length < 3) return;
        retirando.value = true;
        try {
            const r = await store.dispatch('api/apiPostToken', { direccion: ruta + formulario.id + '/archivos/' + archivoRetiro.value.id + '/retirar', datosJson: { motivo: motivoRetiro.value.trim() } });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            await handleLeer(formulario.id);
            mostrarRetiro.value = false;
            handleAviso(r.mensaje);
        } catch (e) {
            handleAviso(e.message || 'No fue posible retirar.', 'error');
        } finally {
            retirando.value = false;
        }
    };
    watch([busqueda, estado], () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            primero.value = 0;
            handleCargar();
        }, 350);
    });
    onMounted(handleCargar);
    onBeforeUnmount(() => {
        activa = false;
        consulta++;
        clearTimeout(timer);
    });
    return {
        registros,
        total,
        primero,
        limite,
        busqueda,
        estado,
        estados,
        cargando,
        guardando,
        subiendo,
        retirando,
        ocupado,
        error,
        mostrar,
        tab,
        seleccionado,
        formulario,
        empresaOpciones,
        fechaSolicitud,
        editable,
        valido,
        archivos,
        pendientes,
        verRetirados,
        intentoArchivo,
        mostrarAyuda,
        mostrarRetiro,
        archivoRetiro,
        motivoRetiro,
        handleCargar,
        handleNuevo,
        handleEditar,
        handleGuardar,
        handleVolver,
        handlePagina,
        handleLimpiar,
        handleAdjuntar,
        handleQuitarPendiente,
        handleDescargar,
        handleRetiro,
        handleRetirar,
        handleFecha,
        handleMoneda
    };
}
