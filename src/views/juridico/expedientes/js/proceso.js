import { handleFechaJuridico } from '@/helpers/fechaJuridico';
import correspondencia from './correspondencia';
import { useToast } from 'primevue/usetoast';
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
const fechaLocal = (v) => (v instanceof Date && !Number.isNaN(v.getTime()) ? `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}` : null);
const inicial = () => ({
    id: null,
    revision: null,
    empresa_id: null,
    tipo_id: null,
    etapa_id: null,
    solicitud_id: null,
    titulo: '',
    descripcion: '',
    contraparte: '',
    naturaleza: 'Extrajudicial',
    referencia_externa: '',
    responsable_id: null,
    proxima_accion: '',
    fecha_compromiso: null,
    estado: 'Abierto',
    resolucion: ''
});
export default function proceso() {
    const route = useRoute(), router = useRouter();
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
    const opciones = ref({ empresas: [], tipos: [], etapas: [], responsables: [] }),
        mostrar = ref(false),
        guardando = ref(false),
        errorFormulario = ref(''),
        formulario = reactive(inicial());
    const estados = ['Abierto', 'En seguimiento', 'Cerrado'];
    const naturalezas = ['Judicial', 'Extrajudicial'];
    const empresa = ref(null),
        solicitudes = ref([]),
        busquedaSolicitud = ref(''),
        cargandoSolicitudes = ref(false);
    let consultaOrigen = 0;
    const mostrarAyuda = ref(false);
    const handleAyuda = () => { mostrarAyuda.value = true; };
    const guia = [
{"titulo": "Correspondencia del expediente", "icono": "pi pi-envelope", "pasos": ["Guarda primero el expediente. En Correspondencia pulsa Agregar correo y selecciona un EML o MSG de hasta 10 MB. Se admiten hasta 100 correos por expediente, incluidos los retirados.", "Gekko conserva el archivo original y muestra asunto, remitente, destinatarios, copias, fecha disponible, texto y adjuntos. No conecta tu buz\u00f3n ni env\u00eda mensajes.", "Ver correo permite leer el contenido en texto. Las im\u00e1genes y el formato HTML no se ejecutan. Descarga el original si necesitas abrirlo con su formato en tu aplicaci\u00f3n de correo.", "Puedes descargar los adjuntos. Incorporar a Documentos admite PDF, DOCX, JPG y PNG y aplica los l\u00edmites de Documentos; despu\u00e9s puedes usarlos en una actuaci\u00f3n.", "Si incorporaste un correo incorrecto, ret\u00edralo con un motivo. Ver retirados permite consultarlo; el original se conserva. Estas operaciones se registran al realizarlas y Cancelar no las deshace.", "Las fechas y remitentes son los declarados por el archivo. La carga no acredita lectura, entrega ni autenticidad. Solo se incorpora el contenido incluido en ese archivo."]},
{"titulo": "Guardar desde Outlook, Gmail o Hotmail", "icono": "pi pi-download", "pasos": ["Outlook cl\u00e1sico para Windows: abre el mensaje, entra en Archivo > Guardar como y elige Formato de mensaje de Outlook - Unicode (.msg). Guarda un mensaje individual, no una exportaci\u00f3n PST.", "Nuevo Outlook y Outlook en la web: abre el correo y busca Guardar como o Descargar en el men\u00fa de m\u00e1s opciones (...). Guarda el archivo EML o MSG que ofrezca tu versi\u00f3n.", "Hotmail: entra a tu correo en Outlook.com, abre el mensaje y usa el men\u00fa (...) > Guardar como o Descargar. Las cuentas Hotmail utilizan la misma interfaz web de Outlook.com.", "Gmail en computadora: abre el mensaje, pulsa M\u00e1s (...) junto a las opciones del mensaje y selecciona Descargar mensaje. Se guarda como EML.", "Vuelve a Gekko y carga el archivo desde Correspondencia. Para registrar un correo enviado, gu\u00e1rdalo desde Enviados. Cada respuesta nueva se agrega por separado, salvo el texto del hilo que ya venga incluido.", "Los nombres de las opciones pueden variar por versi\u00f3n y las restricciones de tu empresa pueden impedir la descarga. No cambies la extensi\u00f3n de un PDF a EML o MSG."]},
        { titulo: '1. Consultar los asuntos', icono: 'pi pi-search', pasos: [
            'Filtra por empresa y estado, o busca por folio, asunto, empresa o responsable. Limpiar restablece los filtros y Actualizar consulta los datos recientes.',
            'El listado muestra el folio, asunto, empresa, tipo, responsable, etapa, fecha compromiso y estado. Pulsa el l\u00e1piz para abrir las pesta\u00f1as del expediente.'
        ] },
        { titulo: '2. Crear un expediente', icono: 'pi pi-folder-open', pasos: [
            'Pulsa Nuevo expediente y elige la empresa. El expediente y sus documentos quedan vinculados a ella; la empresa no se cambia despu\u00e9s de guardar.',
            'Puedes darlo de alta directamente o elegir una solicitud de origen de la misma empresa. Solo se ofrecen solicitudes abiertas que a\u00fan no tienen expediente. Usa la b\u00fasqueda si no aparece entre las primeras 50.',
            'Al elegir una solicitud se recuperan sus datos para iniciar el asunto. La solicitud conserva sus propios documentos e historial: no se copian autom\u00e1ticamente al expediente.',
            'Completa tipo de asunto, etapa, t\u00edtulo, descripci\u00f3n, naturaleza y responsable. Contraparte y referencia externa ayudan a identificar a la otra parte y el n\u00famero de expediente judicial, si existen.',
            'Los tipos de asunto y etapas se registran en Jur\u00eddico / Configuraci\u00f3n. Solo aparecen responsables activos con acceso a Expedientes.',
            'Indica la pr\u00f3xima acci\u00f3n y su fecha compromiso. Pulsa Guardar para generar el folio. Los campos con asterisco rojo son obligatorios.'
        ] },
        { titulo: '3. Dar seguimiento', icono: 'pi pi-calendar', pasos: [
            'En Datos puedes actualizar etapa, responsable, estado y pr\u00f3xima acci\u00f3n. Guarda para confirmar los cambios; Cancelar vuelve al listado sin guardar los cambios del formulario.',
            'La pr\u00f3xima acci\u00f3n y su fecha aparecen en Agenda y tareas y en el calendario superior para quienes tienen acceso. Actualmente se maneja una pr\u00f3xima tarea activa por expediente.',
            'La fecha compromiso es interna: no se calculan plazos legales autom\u00e1ticamente.',
            'Para dar por terminada la tarea, entra en Agenda y tareas, registra qu\u00e9 se hizo y marca su cumplimiento. Puedes programar la siguiente acci\u00f3n o dejar el expediente sin tarea pendiente.'
        ] },
        { titulo: '4. Registrar actuaciones', icono: 'pi pi-file-edit', pasos: [
            'Guarda el expediente y vuelve a abrirlo. En Actuaciones pulsa Nueva actuaci\u00f3n.',
            'Selecciona tipo, fecha y responsable; describe lo realizado. Puedes vincular documentos que ya est\u00e9n adjuntos al expediente.',
            'Si corresponde, activa Actualizar la pr\u00f3xima acci\u00f3n e indica la nueva actividad y fecha. Registrar una actuaci\u00f3n por s\u00ed sola no marca la tarea como cumplida: el cumplimiento se realiza desde Agenda y tareas.',
            'Registrar actuaci\u00f3n guarda ese movimiento en el momento y lo incorpora a la bit\u00e1cora. Las actuaciones registradas se conservan para consulta.'
        ] },
        { titulo: '5. Conservar documentos', icono: 'pi pi-paperclip', pasos: [
            'En Documentos pulsa Adjuntar documento. Se admiten PDF, DOCX, JPG o PNG: hasta 10 MB por archivo y 10 documentos vigentes.',
            'Descarga los archivos desde sus opciones. Si adjuntaste uno incorrecto, usa Retirar e indica el motivo. Ver retirados permite consultar los que se conservaron para auditor\u00eda.',
            'Adjuntar, retirar y registrar actuaciones son operaciones independientes que se guardan al realizarlas. Cancelar el formulario de Datos no las deshace.'
        ] },
        { titulo: '6. Cerrar y consultar el historial', icono: 'pi pi-history', pasos: [
            'Abierto identifica un asunto vigente; En seguimiento indica que contin\u00faa su atenci\u00f3n. Para finalizarlo selecciona Cerrado, escribe el resultado del expediente y pulsa Guardar.',
            'Los expedientes cerrados quedan disponibles para consulta con sus actuaciones, documentos e historial. Ya no se modifican ni se agregan actuaciones o documentos.',
            'Historial muestra fecha, responsable, movimiento y valores anteriores y nuevos cuando corresponde. En un alta nueva se genera al guardar por primera vez.'
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
    const actuaciones = ref([]),
        totalActuaciones = ref(0),
        primeroActuaciones = ref(0),
        limiteActuaciones = ref(10),
        cargandoActuaciones = ref(false),
        errorActuaciones = ref('');
    const mostrarActuacion = ref(false),
        guardandoActuacion = ref(false),
        cargandoOpcionesActuacion = ref(false),
        errorActuacion = ref('');
    const opcionesActuacion = ref({ tipos: [], responsables: [] });
    const actuacionFormulario = reactive({ revision: null, tipo_id: null, fecha: null, responsable_id: null, descripcion: '', archivo_ids: [], actualizar_seguimiento: false, proxima_accion: '', fecha_compromiso: null });
    const hoy = new Date();
    const mostrarDetalleActuacion = ref(false),
        actuacionSeleccionada = ref(null);
    let consultaActuaciones = 0,
        operacionActuacion = null,
        expedienteActuacion = null;
    const evidenciasDisponibles = computed(() => (seleccionado.value?.archivos || []).filter((a) => !a.retirado));
    const actuacionValida = computed(
        () =>
            !!actuacionFormulario.tipo_id &&
            !!actuacionFormulario.responsable_id &&
            !!fechaLocal(actuacionFormulario.fecha) &&
            fechaLocal(actuacionFormulario.fecha) <= fechaLocal(hoy) &&
            actuacionFormulario.descripcion.trim().length >= 3 &&
            (!actuacionFormulario.actualizar_seguimiento ||
                (!!actuacionFormulario.proxima_accion.trim() && !!fechaLocal(actuacionFormulario.fecha_compromiso) && fechaLocal(actuacionFormulario.fecha_compromiso) >= fechaLocal(actuacionFormulario.fecha)))
    );
    const handleCargarActuaciones = async () => {
        const id = seleccionado.value?.id,
            actual = ++consultaActuaciones;
        if (!id) return;
        cargandoActuaciones.value = true;
        errorActuaciones.value = '';
        try {
            const q = new URLSearchParams({ pagina: String(Math.floor(primeroActuaciones.value / limiteActuaciones.value) + 1), limite: String(limiteActuaciones.value) });
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: `/juridico/expedientes/${id}/actuaciones?${q}` });
            if (actual !== consultaActuaciones || !vistaActiva || seleccionado.value?.id !== id) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            actuaciones.value = r.datos.actuaciones || [];
            totalActuaciones.value = r.datos.total || 0;
        } catch (e) {
            if (actual === consultaActuaciones) errorActuaciones.value = e.message || 'No fue posible consultar las actuaciones.';
        } finally {
            if (actual === consultaActuaciones) cargandoActuaciones.value = false;
        }
    };
    const handlePaginaActuaciones = (e) => {
        primeroActuaciones.value = e.first;
        limiteActuaciones.value = e.rows;
        handleCargarActuaciones();
    };
    const handleNuevaActuacion = async () => {
        if (!seleccionado.value || seleccionado.value.estado === 'Cerrado' || guardandoActuacion.value) return;
        expedienteActuacion = seleccionado.value.id;
        operacionActuacion = crypto.randomUUID();
        Object.assign(actuacionFormulario, {
            revision: seleccionado.value.revision,
            tipo_id: null,
            fecha: new Date(),
            responsable_id: seleccionado.value.responsable_id,
            descripcion: '',
            archivo_ids: [],
            actualizar_seguimiento: false,
            proxima_accion: seleccionado.value.proxima_accion || '',
            fecha_compromiso: seleccionado.value.fecha_compromiso ? new Date(seleccionado.value.fecha_compromiso + 'T12:00:00') : null
        });
        opcionesActuacion.value = { tipos: [], responsables: [] };
        errorActuacion.value = '';
        mostrarActuacion.value = true;
        cargandoOpcionesActuacion.value = true;
        try {
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: `/juridico/expedientes/${expedienteActuacion}/actuaciones/opciones` });
            if (!vistaActiva) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            if (r.datos.estado === 'Cerrado') throw new Error('El expediente fue cerrado. Actualiza para consultarlo.');
            if (r.datos.revision !== actuacionFormulario.revision) throw new Error('El expediente cambio. Cierra este formulario y actualiza el detalle.');
            opcionesActuacion.value = r.datos;
            if (!r.datos.responsables.some((x) => x.id === actuacionFormulario.responsable_id)) actuacionFormulario.responsable_id = null;
        } catch (e) {
            errorActuacion.value = e.message || 'No fue posible cargar las opciones.';
        } finally {
            cargandoOpcionesActuacion.value = false;
        }
    };
    const handleGuardarActuacion = async () => {
        if (guardandoActuacion.value || cargandoOpcionesActuacion.value || !actuacionValida.value) return;
        guardandoActuacion.value = true;
        errorActuacion.value = '';
        const id = expedienteActuacion;
        try {
            const datosJson = {
                revision: actuacionFormulario.revision,
                operacion_id: operacionActuacion,
                tipo_id: actuacionFormulario.tipo_id,
                fecha: fechaLocal(actuacionFormulario.fecha),
                responsable_id: actuacionFormulario.responsable_id,
                descripcion: actuacionFormulario.descripcion,
                archivo_ids: [...actuacionFormulario.archivo_ids],
                actualizar_seguimiento: actuacionFormulario.actualizar_seguimiento,
                proxima_accion: actuacionFormulario.actualizar_seguimiento ? actuacionFormulario.proxima_accion : '',
                fecha_compromiso: actuacionFormulario.actualizar_seguimiento ? fechaLocal(actuacionFormulario.fecha_compromiso) : null
            };
            const r = await store.dispatch('api/apiPostToken', { direccion: `/juridico/expedientes/${id}/actuaciones`, datosJson });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            mostrarActuacion.value = false;
            primeroActuaciones.value = 0;
            toast.add({ severity: 'success', summary: 'Actuaciones', detail: r.mensaje, life: 4000 });
            await handleDetalle({ id });
            await handleCargar();
        } catch (e) {
            errorActuacion.value = e.message || 'No fue posible registrar la actuacion.';
        } finally {
            guardandoActuacion.value = false;
        }
    };
    const handleVerActuacion = (fila) => {
        actuacionSeleccionada.value = fila;
        mostrarDetalleActuacion.value = true;
    };
    watch(detalleTab, (valor) => {
        if (valor === 'actuaciones') {
            primeroActuaciones.value = 0;
            handleCargarActuaciones();
        }
    });
    const sinSeguimientoPrevio = ref(false);
    const cerrado = computed(() => ['Cerrado'].includes(formulario.estado));
    const detalleCerrado = computed(() => ['Cerrado'].includes(seleccionado.value?.estado));
    const formularioValido = computed(
        () =>
            !!formulario.empresa_id &&
            !!formulario.tipo_id &&
            !!formulario.etapa_id &&
            !!formulario.responsable_id &&
            !!formulario.titulo.trim() &&
            formulario.descripcion.trim().length >= 3 &&
            (cerrado.value
                ? formulario.resolucion.trim().length >= 3
                : (!!formulario.proxima_accion.trim() && !!fechaLocal(formulario.fecha_compromiso)) || (sinSeguimientoPrevio.value && !formulario.proxima_accion.trim() && !formulario.fecha_compromiso))
    );
    const etapaOpciones = computed(() => {
        const a = opciones.value.etapas || [];
        return formulario.etapa_id && !a.some((x) => x.id === formulario.etapa_id) ? [...a, { id: formulario.etapa_id, nombre: formulario.etapa_nombre || 'Etapa inactiva' }] : a;
    });
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
            const q = new URLSearchParams({ pagina: String(Math.floor(primero.value / limite.value) + 1), limite: String(limite.value), busqueda: busqueda.value, estado: estado.value || '', empresa_id: empresa.value || '' });
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/juridico/expedientes/?' + q });
            if (!vistaActiva || actual !== consulta) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            registros.value = r.datos.expedientes || [];
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
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/juridico/expedientes/opciones' });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            opciones.value = r.datos;
        } finally {
            cargandoOpciones.value = false;
        }
    };
    const handleNuevo = async () => {
        sinSeguimientoPrevio.value = false;
        Object.assign(formulario, inicial(), { empresa_id: empresa.value });
        solicitudes.value = [];
        busquedaSolicitud.value = '';
        operacion = crypto.randomUUID();
        errorFormulario.value = '';
        seleccionado.value = null;
        errorDetalle.value = '';
        detalleTab.value = 'datos';
        mostrarDetalle.value = true;
        mostrar.value = true;
        try {
            await handleOpciones();
            if (formulario.empresa_id) await handleBuscarSolicitudes();
        } catch (e) {
            errorFormulario.value = e.message || 'No fue posible cargar los catalogos.';
        }
    };
    const handleBuscarSolicitudes = async () => {
        const actual = ++consultaOrigen;
        solicitudes.value = [];
        if (!formulario.empresa_id || formulario.id || formulario.solicitud_id) return;
        cargandoSolicitudes.value = true;
        errorFormulario.value = '';
        try {
            const q = new URLSearchParams({ empresa_id: formulario.empresa_id, busqueda: busquedaSolicitud.value });
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/juridico/expedientes/solicitudes?' + q });
            if (actual !== consultaOrigen) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            solicitudes.value = (r.datos.solicitudes || []).map((x) => ({ ...x, etiqueta: x.folio + ' - ' + x.titulo }));
        } catch (e) {
            if (actual === consultaOrigen) errorFormulario.value = e.message;
        } finally {
            if (actual === consultaOrigen) cargandoSolicitudes.value = false;
        }
    };
    const handleEmpresa = () => {
        formulario.tipo_id = null;
        handleBuscarSolicitudes();
    };
    const handleOrigen = () => {
        const d = solicitudes.value.find((x) => x.id === formulario.solicitud_id);
        if (!d) return;
        Object.assign(formulario, {
            solicitud_id: d.id,
            solicitud_folio: d.folio,
            empresa_id: d.empresa_id,
            empresa_nombre: d.empresa_nombre,
            tipo_id: d.tipo_id,
            tipo_nombre: d.tipo_nombre,
            titulo: d.titulo,
            descripcion: d.descripcion,
            fecha_compromiso: d.fecha_compromiso ? new Date(d.fecha_compromiso + 'T12:00:00') : null
        });
        if (opciones.value.responsables.some((x) => x.id === d.responsable_id)) formulario.responsable_id = d.responsable_id;
    };
    const handleQuitarOrigen = () => {
        formulario.solicitud_id = null;
        formulario.solicitud_folio = null;
        handleBuscarSolicitudes();
    };
    const handleGuardar = async () => {
        if (guardando.value || !formularioValido.value || cargandoOpciones.value) return;
        guardando.value = true;
        errorFormulario.value = '';
        try {
            const campos = ['id', 'revision', 'empresa_id', 'tipo_id', 'etapa_id', 'solicitud_id', 'titulo', 'descripcion', 'contraparte', 'naturaleza', 'referencia_externa', 'responsable_id', 'proxima_accion', 'estado', 'resolucion'];
            const datosJson = Object.fromEntries(campos.map((k) => [k, formulario[k]]));
            datosJson.fecha_compromiso = fechaLocal(formulario.fecha_compromiso);
            datosJson.operacion_id = operacion;
            const r = await store.dispatch(formulario.id ? 'api/apiPutToken' : 'api/apiPostToken', { direccion: '/juridico/expedientes/', datosJson });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            mostrar.value = false;
            toast.add({ severity: 'success', summary: 'Expedientes juridicos', detail: r.mensaje, life: 4000 });
            await handleCargar();
            handleVolver();
        } catch (e) {
            errorFormulario.value = e.message || 'No fue posible guardar.';
        } finally {
            guardando.value = false;
        }
    };
    const handleVolver = () => {
        if (subiendo.value || retirando.value || guardandoActuacion.value) return;
        consultaDetalle++;
        mostrarDetalle.value = false;
        mostrar.value = false;
        cargandoDetalle.value = false;
        seleccionado.value = null;
        errorDetalle.value = '';
        if (route.query.expediente) {
            const query = { ...route.query };
            delete query.expediente;
            router.replace({ query });
        }
    };
    const handleDetalle = async (fila) => {
        if (!mostrarDetalle.value || seleccionado.value?.id !== fila.id) {
            detalleTab.value = 'datos';
            actuaciones.value = [];
            totalActuaciones.value = 0;
            primeroActuaciones.value = 0;
        }
        const actual = ++consultaDetalle;
        mostrarDetalle.value = true;
        cargandoDetalle.value = true;
        errorDetalle.value = '';
        seleccionado.value = null;
        try {
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/juridico/expedientes/' + fila.id });
            if (actual !== consultaDetalle || !vistaActiva) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            seleccionado.value = r.datos.expediente;
            const d = seleccionado.value;
            sinSeguimientoPrevio.value = !!d.tareas_cumplidas_total && !d.proxima_accion && !d.fecha_compromiso;
            Object.assign(formulario, inicial(), d, { fecha_compromiso: d.fecha_compromiso ? new Date(d.fecha_compromiso + 'T12:00:00') : null });
            operacion = crypto.randomUUID();
            errorFormulario.value = '';
            await handleOpciones();
            if (detalleTab.value === 'actuaciones') await handleCargarActuaciones();
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
            const r = await store.dispatch('api/apiPostTokenFormData', { direccion: `/juridico/expedientes/${id}/archivos`, formData });
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
            const r = await store.dispatch('api/apiGetblob', { direccion: `/juridico/expedientes/${seleccionado.value.id}/archivos/${archivo.id}` });
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
            const r = await store.dispatch('api/apiPostToken', { direccion: `/juridico/expedientes/${id}/archivos/${archivoRetiro.value.id}/retirar`, datosJson: { motivo: motivoRetiro.value } });
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
        empresa.value = null;
    };
    const handleFecha = valor => handleFechaJuridico(valor, true);
    const handleColor = (v) => (v === 'Cerrado' ? 'secondary' : v === 'En seguimiento' ? 'info' : 'success');
    watch([busqueda, estado, empresa], () => {
        primero.value = 0;
        clearTimeout(timer);
        timer = setTimeout(handleCargar, 350);
    });
    const handleExpedienteRuta = () => {
        const id = route.query.expediente;
        if (typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id)) handleDetalle({ id });
    };
    watch(() => route.query.expediente, handleExpedienteRuta);
    onMounted(async () => {
        await handleCargar();
        try {
            await handleOpciones();
            handleExpedienteRuta();
        } catch (e) {
            error.value = e.message;
        }
    });
    onBeforeUnmount(() => {
        vistaActiva = false;
        clearTimeout(timer);
    });
    const correo = correspondencia({ store, toast, seleccionado, detalleTab, detalleCerrado, handleDetalle });
    return {
        ...correo,
        mostrarAyuda,
        handleAyuda,
        guia,
        sinSeguimientoPrevio,
        actuaciones,
        totalActuaciones,
        primeroActuaciones,
        limiteActuaciones,
        cargandoActuaciones,
        errorActuaciones,
        mostrarActuacion,
        guardandoActuacion,
        cargandoOpcionesActuacion,
        errorActuacion,
        opcionesActuacion,
        actuacionFormulario,
        hoy,
        mostrarDetalleActuacion,
        actuacionSeleccionada,
        evidenciasDisponibles,
        actuacionValida,
        handleCargarActuaciones,
        handlePaginaActuaciones,
        handleNuevaActuacion,
        handleGuardarActuacion,
        handleVerActuacion,
        registros,
        total,
        primero,
        limite,
        busqueda,
        estado,
        estados,
        naturalezas,
        empresa,
        solicitudes,
        busquedaSolicitud,
        cargandoSolicitudes,
        etapaOpciones,
        handleBuscarSolicitudes,
        handleEmpresa,
        handleOrigen,
        handleQuitarOrigen,
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
