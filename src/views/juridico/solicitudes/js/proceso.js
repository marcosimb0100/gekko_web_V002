import { handleFechaJuridico } from '@/helpers/fechaJuridico';
import { useToast } from 'primevue/usetoast';
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useStore } from 'vuex';
const fechaLocal = (v) => (v instanceof Date && !Number.isNaN(v.getTime()) ? `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}` : null);
const inicial = () => ({ id: null, revision: null, empresa_id: null, tipo_id: null, area: '', titulo: '', descripcion: '', prioridad: 'Normal', responsable_id: null, fecha_compromiso: null, estado: 'Por asignar', resolucion: '' });
export default function proceso() {
    const store = useStore(),
        toast = useToast();
    const registros = ref([]),
        total = ref(0),
        primero = ref(0),
        limite = ref(10),
        busqueda = ref(''),
        estado = ref(null),
        cargando = ref(false),
        cargandoOpciones = ref(false),
        error = ref('');
    const opciones = ref({ empresas: [], tipos: [], responsables: [] }),
        mostrar = ref(false),
        guardando = ref(false),
        errorFormulario = ref(''),
        formulario = reactive(inicial());
    const estados = ['Por asignar', 'En atencion', 'Resuelta', 'Cancelada'],
        prioridades = ['Baja', 'Normal', 'Alta', 'Urgente'];
    const mostrarAyuda = ref(false);
    const handleAyuda = () => { mostrarAyuda.value = true; };
    const guia = [
        { titulo: '1. Consultar solicitudes', icono: 'pi pi-search', pasos: [
            'Busca por folio, asunto, empresa o responsable. Puedes combinar la b\u00fasqueda con el filtro de estado.',
            'Limpiar restablece los filtros. Actualizar consulta los datos recientes. Usa las p\u00e1ginas inferiores para recorrer los resultados.',
            'El l\u00e1piz abre la solicitud en pesta\u00f1as. El listado muestra su empresa, responsable, fecha compromiso, prioridad y estado.'
        ] },
        { titulo: '2. Crear y asignar', icono: 'pi pi-file-edit', pasos: [
            'Pulsa Nueva solicitud. Selecciona Empresa y Tipo de asunto; escribe el \u00e1rea solicitante, la prioridad, el t\u00edtulo y una descripci\u00f3n clara de lo que necesitas.',
            'Los campos con asterisco rojo son obligatorios. Los tipos de asunto se administran en Jur\u00eddico / Configuraci\u00f3n.',
            'Puedes dejarla Por asignar. Si eliges responsable, indica tambi\u00e9n la fecha compromiso: la solicitud quedar\u00e1 En atenci\u00f3n. Solo aparecen usuarios activos con acceso a este m\u00f3dulo.',
            'Pulsa Guardar para registrar la solicitud y generar su folio. Cancelar vuelve al listado sin guardar los cambios del formulario.',
            'La fecha compromiso es una fecha interna de trabajo. El sistema no calcula plazos legales autom\u00e1ticamente.'
        ] },
        { titulo: '3. Adjuntar documentos', icono: 'pi pi-paperclip', pasos: [
            'Guarda primero la solicitud y vuelve a abrirla con el l\u00e1piz. En Documentos pulsa Adjuntar documento.',
            'Se admiten PDF, DOCX, JPG o PNG: hasta 10 MB por archivo y 10 documentos vigentes por solicitud.',
            'El bot\u00f3n de descarga permite recuperar el archivo. Si adjuntaste uno incorrecto, usa Retirar y escribe el motivo; Ver retirados permite consultar los documentos conservados para auditor\u00eda.',
            'Adjuntar y retirar se registran al realizar la acci\u00f3n. Cancelar el formulario no deshace esas operaciones.'
        ] },
        { titulo: '4. Dar seguimiento y cerrar', icono: 'pi pi-check-circle', pasos: [
            'Abre la solicitud con el l\u00e1piz y actualiza Datos: responsable, fecha compromiso, prioridad o estado. Confirma con Guardar.',
            'Por asignar: a\u00fan no tiene responsable. En atenci\u00f3n: tiene responsable y fecha compromiso.',
            'Resuelta: el trabajo solicitado termin\u00f3. Cancelada: la solicitud ya no procede. En ambos casos debes escribir una respuesta o motivo de cierre.',
            'Una vez cerrada, permanece disponible para consulta con sus documentos e historial; sus datos ya no se editan.',
            'Si el asunto requiere un expediente, cr\u00e9alo en Expedientes y asuntos, selecciona la misma empresa y elige esta solicitud como origen. Guardar una solicitud no crea un expediente autom\u00e1ticamente.'
        ] },
        { titulo: '5. Revisar el historial', icono: 'pi pi-history', pasos: [
            'La pesta\u00f1a Historial muestra la fecha, el responsable, el movimiento y los datos modificados, con valor anterior y nuevo cuando corresponde.',
            'En una solicitud nueva estar\u00e1 vac\u00edo hasta guardar. Los cambios del formulario se registran al guardarlos; los movimientos de documentos se registran al adjuntar o retirar.'
        ] }
    ];
    const detalleTab = ref('datos');
    const mostrarDetalle = ref(false),
        seleccionado = ref(null),
        cargandoDetalle = ref(false),
        errorDetalle = ref(''),
        subiendo = ref(false),
        intentoArchivo = ref(0),
        verRetirados = ref(false);
    const mostrarRetiro = ref(false),
        archivoRetiro = ref(null),
        motivoRetiro = ref(''),
        retirando = ref(false),
        errorRetiro = ref('');
    let operacion = null,
        timer = null,
        vistaActiva = true,
        consulta = 0,
        consultaDetalle = 0;
    const cerrado = computed(() => ['Resuelta', 'Cancelada'].includes(formulario.estado));
    const detalleCerrado = computed(() => ['Resuelta', 'Cancelada'].includes(seleccionado.value?.estado));
    const formularioValido = computed(
        () =>
            !!formulario.empresa_id &&
            !!formulario.tipo_id &&
            !!formulario.area.trim() &&
            !!formulario.titulo.trim() &&
            formulario.descripcion.trim().length >= 3 &&
            (formulario.estado !== 'En atencion' || (formulario.responsable_id && fechaLocal(formulario.fecha_compromiso))) &&
            (!cerrado.value || formulario.resolucion.trim().length >= 3)
    );
    const archivos = computed(() => (seleccionado.value?.archivos || []).filter((a) => verRetirados.value || !a.retirado));
    const tipoOpciones = computed(() => {
        const a = opciones.value.tipos || [];
        return formulario.tipo_id && !a.some((x) => x.id === formulario.tipo_id) ? [...a, { id: formulario.tipo_id, nombre: formulario.tipo_nombre || 'Tipo inactivo' }] : a;
    });
    const empresaOpciones = computed(() => {
        const a = opciones.value.empresas || [];
        return formulario.empresa_id && !a.some((x) => x.id === formulario.empresa_id) ? [...a, { id: formulario.empresa_id, nombre: formulario.empresa_nombre || 'Empresa inactiva' }] : a;
    });
    const handleCargar = async () => {
        const actual = ++consulta;
        cargando.value = true;
        error.value = '';
        try {
            const q = new URLSearchParams({ pagina: String(Math.floor(primero.value / limite.value) + 1), limite: String(limite.value), busqueda: busqueda.value, estado: estado.value || '' });
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/juridico/solicitudes/?' + q });
            if (!vistaActiva || actual !== consulta) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            registros.value = r.datos.solicitudes || [];
            total.value = r.datos.total || 0;
        } catch (e) {
            if (actual === consulta) error.value = e.message || 'No fue posible consultar.';
        } finally {
            if (actual === consulta) cargando.value = false;
        }
    };
    const handleOpciones = async () => {
        cargandoOpciones.value = true;
        try {
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/juridico/solicitudes/opciones' });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            opciones.value = r.datos;
        } finally {
            cargandoOpciones.value = false;
        }
    };
    const handleNuevo = async () => {
        Object.assign(formulario, inicial());
        operacion = crypto.randomUUID();
        errorFormulario.value = '';
        seleccionado.value = null;
        errorDetalle.value = '';
        detalleTab.value = 'datos';
        mostrarDetalle.value = true;
        mostrar.value = true;
        try {
            await handleOpciones();
        } catch (e) {
            errorFormulario.value = e.message || 'No fue posible cargar los catalogos.';
        }
    };
    const handleResponsable = () => {
        if (!['Resuelta', 'Cancelada'].includes(formulario.estado)) formulario.estado = formulario.responsable_id ? 'En atencion' : 'Por asignar';
    };
    const handleGuardar = async () => {
        if (guardando.value || !formularioValido.value || cargandoOpciones.value) return;
        guardando.value = true;
        errorFormulario.value = '';
        try {
            const campos = ['id', 'revision', 'empresa_id', 'tipo_id', 'area', 'titulo', 'descripcion', 'prioridad', 'responsable_id', 'estado', 'resolucion'];
            const datosJson = Object.fromEntries(campos.map((k) => [k, formulario[k]]));
            datosJson.fecha_compromiso = fechaLocal(formulario.fecha_compromiso);
            datosJson.operacion_id = operacion;
            const r = await store.dispatch(formulario.id ? 'api/apiPutToken' : 'api/apiPostToken', { direccion: '/juridico/solicitudes/', datosJson });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            mostrar.value = false;
            toast.add({ severity: 'success', summary: 'Solicitudes juridicas', detail: r.mensaje, life: 4000 });
            await handleCargar();
            handleVolver();
        } catch (e) {
            errorFormulario.value = e.message || 'No fue posible guardar.';
        } finally {
            guardando.value = false;
        }
    };
    const handleVolver = () => {
        if (subiendo.value || retirando.value) return;
        consultaDetalle++;
        mostrarDetalle.value = false;
        mostrar.value = false;
        cargandoDetalle.value = false;
        seleccionado.value = null;
        errorDetalle.value = '';
    };
    const handleDetalle = async (fila) => {
        if (!mostrarDetalle.value || seleccionado.value?.id !== fila.id) detalleTab.value = 'datos';
        const actual = ++consultaDetalle;
        mostrarDetalle.value = true;
        cargandoDetalle.value = true;
        errorDetalle.value = '';
        seleccionado.value = null;
        try {
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/juridico/solicitudes/' + fila.id });
            if (actual !== consultaDetalle || !vistaActiva) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            seleccionado.value = r.datos.solicitud;
            const d = seleccionado.value;
            Object.assign(formulario, inicial(), d, { fecha_compromiso: d.fecha_compromiso ? new Date(d.fecha_compromiso + 'T12:00:00') : null });
            operacion = crypto.randomUUID();
            errorFormulario.value = '';
            await handleOpciones();
        } catch (e) {
            if (actual === consultaDetalle) errorDetalle.value = e.message || 'No fue posible consultar.';
        } finally {
            if (actual === consultaDetalle) cargandoDetalle.value = false;
        }
    };
    const handleSubir = async (e) => {
        if (subiendo.value || retirando.value || !seleccionado.value || detalleCerrado.value) return;
        const archivo = e.files?.[0];
        if (!archivo) return;
        subiendo.value = true;
        errorDetalle.value = '';
        const id = seleccionado.value.id;
        try {
            const formData = new FormData();
            formData.append('archivo', archivo);
            const r = await store.dispatch('api/apiPostTokenFormData', { direccion: `/juridico/solicitudes/${id}/archivos`, formData });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            await handleDetalle({ id });
            toast.add({ severity: 'success', summary: 'Documentos', detail: r.mensaje, life: 4000 });
        } catch (e) {
            errorDetalle.value = e.message || 'No fue posible adjuntar.';
        } finally {
            subiendo.value = false;
            intentoArchivo.value++;
        }
    };
    const handleDescargar = async (archivo) => {
        try {
            const r = await store.dispatch('api/apiGetblob', { direccion: `/juridico/solicitudes/${seleccionado.value.id}/archivos/${archivo.id}` });
            if (r.estatus !== 200 || !r.data) throw new Error(r.mensaje || 'Documento no disponible.');
            const url = URL.createObjectURL(r.data),
                a = document.createElement('a');
            a.href = url;
            a.download = archivo.nombre;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
            errorDetalle.value = e.message || 'No fue posible descargar.';
        }
    };
    const handleRetirar = (archivo) => {
        archivoRetiro.value = archivo;
        motivoRetiro.value = '';
        errorRetiro.value = '';
        mostrarRetiro.value = true;
    };
    const handleConfirmarRetiro = async () => {
        if (retirando.value || motivoRetiro.value.trim().length < 3) return;
        retirando.value = true;
        errorRetiro.value = '';
        const id = seleccionado.value.id;
        try {
            const r = await store.dispatch('api/apiPostToken', { direccion: `/juridico/solicitudes/${id}/archivos/${archivoRetiro.value.id}/retirar`, datosJson: { motivo: motivoRetiro.value } });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            mostrarRetiro.value = false;
            await handleDetalle({ id });
        } catch (e) {
            errorRetiro.value = e.message || 'No fue posible retirar.';
        } finally {
            retirando.value = false;
        }
    };
    const handlePagina = (e) => {
        primero.value = e.first;
        limite.value = e.rows;
        handleCargar();
    };
    const handleLimpiar = () => {
        busqueda.value = '';
        estado.value = null;
    };
    const handleFecha = valor => handleFechaJuridico(valor, true);
    const handleColor = (v) => (v === 'Resuelta' ? 'success' : v === 'Cancelada' ? 'secondary' : v === 'En atencion' ? 'info' : 'warn');
    watch([busqueda, estado], () => {
        primero.value = 0;
        clearTimeout(timer);
        timer = setTimeout(handleCargar, 350);
    });
    onMounted(handleCargar);
    onBeforeUnmount(() => {
        vistaActiva = false;
        clearTimeout(timer);
    });
    return {
        mostrarAyuda,
        handleAyuda,
        guia,
        registros,
        total,
        primero,
        limite,
        busqueda,
        estado,
        estados,
        prioridades,
        cargando,
        cargandoOpciones,
        error,
        opciones,
        mostrar,
        guardando,
        errorFormulario,
        formulario,
        formularioValido,
        cerrado,
        tipoOpciones,
        empresaOpciones,
        detalleTab,
        mostrarDetalle,
        seleccionado,
        cargandoDetalle,
        errorDetalle,
        subiendo,
        intentoArchivo,
        verRetirados,
        archivos,
        detalleCerrado,
        mostrarRetiro,
        archivoRetiro,
        motivoRetiro,
        retirando,
        errorRetiro,
        handleCargar,
        handleNuevo,
        handleResponsable,
        handleGuardar,
        handleDetalle,
        handleVolver,
        handleSubir,
        handleDescargar,
        handleRetirar,
        handleConfirmarRetiro,
        handlePagina,
        handleLimpiar,
        handleFecha,
        handleColor
    };
}
