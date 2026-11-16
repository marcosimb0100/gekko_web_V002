import { handleFechaJuridico } from '@/helpers/fechaJuridico';
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

const fechaLocal = (v) => (v instanceof Date && !Number.isNaN(v.getTime()) ? `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}` : '');
const fechaDia = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? new Date(v + 'T12:00:00') : null);
export default function proceso() {
    const store = useStore(),
        router = useRouter(),
        route = useRoute(),
        toast = useToast();
    const hoy = new Date(),
        fechaBase = ref(new Date()),
        periodo = ref('Mes'),
        vista = ref('Lista');
    const desde = ref(null),
        hasta = ref(null),
        empresa = ref(null),
        responsable = ref(null),
        estado = ref('Pendientes'),
        busqueda = ref('');
    const periodos = ['Dia', 'Semana', 'Mes'],
        vistas = ['Lista', 'Calendario'];
    const estados = [
        { nombre: 'Pendientes y vencidas', valor: 'Pendientes' },
        { nombre: 'Proximas', valor: 'Pendiente' },
        { nombre: 'Vencidas', valor: 'Vencida' },
        { nombre: 'Cumplidas', valor: 'Cumplida' },
        { nombre: 'Todas', valor: 'Todas' }
    ];
    const opciones = ref({ empresas: [], responsables: [], ver_expedientes: false });
    const mostrarAyuda = ref(false);
    const handleAyuda = () => { mostrarAyuda.value = true; };
    const guia = [
        { titulo: '1. De d\u00f3nde salen las tareas', icono: 'pi pi-folder-open', pasos: [
            'Esta agenda re\u00fane la pr\u00f3xima acci\u00f3n y la fecha compromiso de los expedientes abiertos o en seguimiento. No necesitas capturar la misma tarea de nuevo aqu\u00ed.',
            'Para crear o cambiar un compromiso, entra en Expedientes y asuntos y actualiza su pr\u00f3xima acci\u00f3n y fecha. Actualmente cada expediente tiene una pr\u00f3xima tarea activa.',
            'Las fechas son compromisos internos de trabajo. El sistema no calcula plazos legales autom\u00e1ticamente.'
        ] },
        { titulo: '2. Buscar y elegir el periodo', icono: 'pi pi-search', pasos: [
            'Elige D\u00eda, Semana o Mes y una fecha de referencia. Tambi\u00e9n puedes ajustar Compromisos desde y Hasta para consultar un intervalo.',
            'Filtra por empresa, responsable y estado; usa la b\u00fasqueda para encontrar un expediente, empresa o actividad. Las cantidades mostradas corresponden a los filtros aplicados.',
            'Pendientes y vencidas muestra tareas sin cumplir. Pr\u00f3ximas muestra las pendientes cuya fecha a\u00fan no ha pasado; Vencidas muestra las pendientes anteriores al d\u00eda de hoy. Cumplidas consulta lo ya realizado y Todas combina los estados.',
            'Limpiar restablece los filtros y vuelve al mes actual con pendientes y vencidas. Actualizar consulta los cambios recientes. Usa la paginaci\u00f3n para recorrer la lista.'
        ] },
        { titulo: '3. Usar el calendario', icono: 'pi pi-calendar', pasos: [
            'Cambia de Lista a Calendario. Los n\u00fameros de los d\u00edas indican cu\u00e1ntas tareas coinciden con los filtros.',
            'Selecciona un d\u00eda para revisar sus tareas en la tabla y cambia de mes para explorar otras fechas.',
            'Los compromisos tambi\u00e9n se consultan desde el calendario superior del sistema, seg\u00fan los accesos de tu perfil. Desde all\u00ed puedes entrar a la agenda del d\u00eda elegido.'
        ] },
        { titulo: '4. Marcar una tarea como cumplida', icono: 'pi pi-check-circle', pasos: [
            'En la tarea pendiente o vencida pulsa Cumplida. Verifica el expediente, la empresa, la actividad y la fecha compromiso mostrados.',
            'Selecciona el tipo de actuaci\u00f3n, la fecha en que realmente se realiz\u00f3 y el responsable. Describe qu\u00e9 se hizo y su resultado. Los campos con asterisco rojo son obligatorios.',
            'La fecha de realizaci\u00f3n puede ser hoy o un d\u00eda anterior. Es distinta de la fecha compromiso original.',
            'En Evidencias del expediente puedes vincular documentos ya adjuntos. Si falta un archivo, agr\u00e9galo antes en la pesta\u00f1a Documentos del expediente.',
            'Pulsa Guardar para confirmar el cumplimiento y registrar la actuaci\u00f3n en el expediente. Cancelar regresa a la agenda sin guardar ese cumplimiento.'
        ] },
        { titulo: '5. Programar la siguiente acci\u00f3n', icono: 'pi pi-arrow-right', pasos: [
            'Al registrar el cumplimiento puedes activar Programar la siguiente acci\u00f3n. Escribe la actividad y su fecha compromiso, que no debe ser anterior a la fecha de realizaci\u00f3n.',
            'Al guardar, la tarea anterior queda cumplida y la nueva pasa a ser el compromiso pendiente del expediente.',
            'Si no activas esta opci\u00f3n, el expediente permanece sin una tarea pendiente. Cumplir una tarea no cierra el expediente; su cierre se realiza desde Datos del expediente.'
        ] },
        { titulo: '6. Consultar lo realizado', icono: 'pi pi-history', pasos: [
            'Selecciona Cumplidas o Todas en el filtro de estado. Las tareas se consultan por su fecha compromiso original; la fecha en que se cumplieron aparece por separado.',
            'Pulsa Resultado para consultar lo realizado y las evidencias vinculadas. El bot\u00f3n Expediente abre el asunto cuando tu perfil permite acceder a Expedientes.',
            'El cumplimiento tambi\u00e9n queda registrado en Actuaciones e Historial del expediente. No se elimina al programar la siguiente tarea.'
        ] }
    ];
    const mostrarResultado = ref(false),
        resultado = ref(null);
    const handleResultado = (fila) => {
        resultado.value = fila;
        mostrarResultado.value = true;
    };
    const registros = ref([]),
        total = ref(0),
        resumen = ref({}),
        primero = ref(0),
        limite = ref(10),
        cargando = ref(false),
        error = ref('');
    const calendario = ref([]),
        cargandoCalendario = ref(false),
        errorCalendario = ref('');
    const mesCalendario = ref({ year: hoy.getFullYear(), month: hoy.getMonth() });
    const mostrarCumplir = ref(false),
        cumpliendo = ref(false),
        cargandoCumplir = ref(false),
        errorCumplir = ref(''),
        tarea = ref(null);
    const opcionesCumplir = ref({ tipos: [], responsables: [], archivos: [] });
    const formulario = reactive({ revision: null, tipo_id: null, fecha: null, responsable_id: null, descripcion: '', archivo_ids: [], actualizar_seguimiento: false, proxima_accion: '', fecha_compromiso: null });
    let activo = true,
        timer = null,
        consulta = 0,
        consultaCal = 0,
        consultaCumplir = 0,
        operacion = null;
    const valido = computed(
        () =>
            Number.isInteger(formulario.revision) &&
            !!formulario.tipo_id &&
            !!formulario.responsable_id &&
            !!fechaLocal(formulario.fecha) &&
            fechaLocal(formulario.fecha) <= fechaLocal(hoy) &&
            formulario.descripcion.trim().length >= 3 &&
            (!formulario.actualizar_seguimiento || (!!formulario.proxima_accion.trim() && !!fechaLocal(formulario.fecha_compromiso) && fechaLocal(formulario.fecha_compromiso) >= fechaLocal(formulario.fecha)))
    );
    const handlePeriodo = () => {
        const base = fechaBase.value || new Date(),
            a = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12),
            b = new Date(a);
        if (periodo.value === 'Semana') {
            a.setDate(a.getDate() - ((a.getDay() + 6) % 7));
            b.setTime(a.getTime());
            b.setDate(b.getDate() + 6);
        }
        if (periodo.value === 'Mes') {
            a.setDate(1);
            b.setMonth(b.getMonth() + 1, 0);
        }
        desde.value = a;
        hasta.value = b;
    };
    handlePeriodo();
    const handleCargar = async () => {
        const actual = ++consulta;
        cargando.value = true;
        error.value = '';
        try {
            const q = new URLSearchParams({
                desde: fechaLocal(desde.value),
                hasta: fechaLocal(hasta.value),
                empresa_id: empresa.value || '',
                responsable_id: responsable.value || '',
                estado: estado.value,
                busqueda: busqueda.value,
                pagina: String(Math.floor(primero.value / limite.value) + 1),
                limite: String(limite.value)
            });
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/juridico/agenda/?' + q });
            if (!activo || actual !== consulta) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            registros.value = r.datos.tareas || [];
            total.value = r.datos.total || 0;
            resumen.value = r.datos.resumen || {};
        } catch (e) {
            if (actual === consulta) {
                error.value = e.message || 'No fue posible consultar la agenda.';
                registros.value = [];
                total.value = 0;
                resumen.value = {};
            }
        } finally {
            if (actual === consulta) cargando.value = false;
        }
    };
    const handleCargarCalendario = async () => {
        const actual = ++consultaCal;
        cargandoCalendario.value = true;
        errorCalendario.value = '';
        try {
            const { year, month } = mesCalendario.value;
            const q = new URLSearchParams({
                desde: fechaLocal(new Date(year, month, 1, 12)),
                hasta: fechaLocal(new Date(year, month + 1, 0, 12)),
                empresa_id: empresa.value || '',
                responsable_id: responsable.value || '',
                estado: estado.value,
                busqueda: busqueda.value
            });
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/juridico/agenda/calendario?' + q });
            if (!activo || actual !== consultaCal) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            calendario.value = r.datos.dias || [];
        } catch (e) {
            if (actual === consultaCal) errorCalendario.value = e.message || 'No fue posible consultar el calendario.';
        } finally {
            if (actual === consultaCal) cargandoCalendario.value = false;
        }
    };
    const handleMesCalendario = (e) => {
        mesCalendario.value = { year: e.year, month: e.month - 1 };
        handleCargarCalendario();
    };
    const handleDiaCalendario = () => {
        periodo.value = 'Dia';
        handlePeriodo();
    };
    const handleCantidadDia = (d) => {
        const key = `${d.year}-${String(d.month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
        return calendario.value.filter((x) => x.fecha === key).reduce((n, x) => n + x.cantidad, 0);
    };
    const handleActualizar = () => {
        handleCargar();
        if (vista.value === 'Calendario') handleCargarCalendario();
    };
    const handlePagina = (e) => {
        primero.value = e.first;
        limite.value = e.rows;
        handleCargar();
    };
    const handleLimpiar = () => {
        empresa.value = null;
        responsable.value = null;
        estado.value = 'Pendientes';
        busqueda.value = '';
        fechaBase.value = new Date();
        periodo.value = 'Mes';
        handlePeriodo();
    };
    const handleExpediente = (fila) => {
        if (opciones.value.ver_expedientes) router.push({ path: '/juridico/expedientes', query: { expediente: fila.expediente_id } });
    };
    const handleCumplir = async (fila) => {
        if (fila.estado === 'Cumplida') return;
        const actual = ++consultaCumplir;
        tarea.value = fila;
        mostrarCumplir.value = true;
        cargandoCumplir.value = true;
        errorCumplir.value = '';
        operacion = crypto.randomUUID();
        opcionesCumplir.value = { tipos: [], responsables: [], archivos: [] };
        Object.assign(formulario, { revision: null, tipo_id: null, fecha: new Date(), responsable_id: fila.responsable_id, descripcion: '', archivo_ids: [], actualizar_seguimiento: false, proxima_accion: '', fecha_compromiso: null });
        try {
            const q = new URLSearchParams({ tarea_id: fila.id });
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: `/juridico/agenda/${fila.expediente_id}/opciones?${q}` });
            if (!activo || actual !== consultaCumplir) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            tarea.value = r.datos.tarea;
            opcionesCumplir.value = r.datos;
            formulario.revision = r.datos.revision;
            formulario.responsable_id = r.datos.responsables.some((x) => x.id === fila.responsable_id) ? fila.responsable_id : null;
        } catch (e) {
            if (actual === consultaCumplir) errorCumplir.value = e.message || 'No fue posible consultar la tarea.';
        } finally {
            if (actual === consultaCumplir) cargandoCumplir.value = false;
        }
    };
    const handleConfirmarCumplimiento = async () => {
        if (cumpliendo.value || cargandoCumplir.value || !valido.value) return;
        cumpliendo.value = true;
        errorCumplir.value = '';
        try {
            const datosJson = {
                revision: formulario.revision,
                operacion_id: operacion,
                tarea_id: tarea.value.id,
                tipo_id: formulario.tipo_id,
                fecha: fechaLocal(formulario.fecha),
                responsable_id: formulario.responsable_id,
                descripcion: formulario.descripcion,
                archivo_ids: [...formulario.archivo_ids],
                actualizar_seguimiento: formulario.actualizar_seguimiento,
                proxima_accion: formulario.actualizar_seguimiento ? formulario.proxima_accion : '',
                fecha_compromiso: formulario.actualizar_seguimiento ? fechaLocal(formulario.fecha_compromiso) : null
            };
            const r = await store.dispatch('api/apiPostToken', { direccion: `/juridico/agenda/${tarea.value.expediente_id}/cumplir`, datosJson });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            mostrarCumplir.value = false;
            toast.add({ severity: 'success', summary: 'Agenda juridica', detail: r.mensaje, life: 4000 });
            await handleCargar();
            if (vista.value === 'Calendario') await handleCargarCalendario();
            window.dispatchEvent(new Event('juridico-agenda-actualizada'));
        } catch (e) {
            errorCumplir.value = e.message || 'No fue posible marcar la tarea como cumplida.';
        } finally {
            cumpliendo.value = false;
        }
    };
    const handleFecha = valor => handleFechaJuridico(valor, false);
    const handleColor = (v) => (v === 'Cumplida' ? 'success' : v === 'Vencida' ? 'danger' : 'info');
    const handleQuery = () => {
        const d = fechaDia(route.query.fecha);
        if (d && !Number.isNaN(d.getTime()) && fechaLocal(d) === route.query.fecha) {
            fechaBase.value = d;
            periodo.value = 'Dia';
            handlePeriodo();
        }
    };
    watch([desde, hasta, empresa, responsable, estado, busqueda], () => {
        primero.value = 0;
        clearTimeout(timer);
        timer = setTimeout(handleActualizar, 350);
    });
    watch(vista, (v) => {
        if (v === 'Calendario') handleCargarCalendario();
    });
    watch(() => route.query.fecha, handleQuery);
    onMounted(async () => {
        handleQuery();
        try {
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/juridico/agenda/opciones' });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            opciones.value = r.datos;
            await handleCargar();
        } catch (e) {
            error.value = e.message;
        }
    });
    onBeforeUnmount(() => {
        activo = false;
        clearTimeout(timer);
    });
    return {
        mostrarAyuda,
        handleAyuda,
        guia,
        mostrarResultado,
        resultado,
        handleResultado,
        hoy,
        fechaBase,
        periodo,
        vista,
        desde,
        hasta,
        empresa,
        responsable,
        estado,
        busqueda,
        periodos,
        vistas,
        estados,
        opciones,
        registros,
        total,
        resumen,
        primero,
        limite,
        cargando,
        error,
        calendario,
        cargandoCalendario,
        errorCalendario,
        mostrarCumplir,
        cumpliendo,
        cargandoCumplir,
        errorCumplir,
        tarea,
        opcionesCumplir,
        formulario,
        valido,
        handlePeriodo,
        handleCargar,
        handleActualizar,
        handleCargarCalendario,
        handleMesCalendario,
        handleDiaCalendario,
        handleCantidadDia,
        handlePagina,
        handleLimpiar,
        handleExpediente,
        handleCumplir,
        handleConfirmarCumplimiento,
        handleFecha,
        handleColor
    };
}
