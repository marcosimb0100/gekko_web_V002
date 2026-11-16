import { handleFechaJuridico } from '@/helpers/fechaJuridico';
import { computed, onMounted, reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
const inicial = () => ({ id: null, revision: null, nombre: '', descripcion: '', activo: true });
export default function proceso() {
    const store = useStore(),
        toast = useToast();
    const registros = ref([]),
        busqueda = ref(''),
        estado = ref(null),
        cargando = ref(false),
        guardando = ref(false),
        mostrar = ref(false),
        error = ref(''),
        errorFormulario = ref('');
    const formulario = reactive(inicial()),
        estados = [
            { nombre: 'Activos', valor: true },
            { nombre: 'Inactivos', valor: false }
        ];
    const mostrarHistorial = ref(false),
        seleccionado = ref(null);
    const mostrarAyuda = ref(false);
    const handleAyuda = () => { mostrarAyuda.value = true; };
    const guia = [
        {
                "titulo": "1. D\u00f3nde se utiliza",
                "icono": "pi pi-info-circle",
                "pasos": [
                        "Este cat\u00e1logo identifica qu\u00e9 clase de actividad se realiz\u00f3. Por ejemplo: llamada, reuni\u00f3n, presentaci\u00f3n de escrito o revisi\u00f3n documental. Los ejemplos no se registran autom\u00e1ticamente.",
                        "Se utiliza al registrar una actuaci\u00f3n desde Expedientes y al marcar una tarea como cumplida en Agenda y tareas.",
                        "El tipo clasifica la actividad; la descripci\u00f3n del resultado, su responsable, fecha y evidencias se capturan al registrar la actuaci\u00f3n o el cumplimiento."
                ]
        },
        {
                "titulo": "2. Crear y editar",
                "icono": "pi pi-pencil",
                "pasos": [
                        "Pulsa Nuevo tipo y escribe un nombre claro. Puedes a\u00f1adir una descripci\u00f3n para explicar qu\u00e9 actividades incluye. D\u00e9jalo activo para ofrecerlo al registrar actuaciones.",
                        "El nombre es obligatorio, se guarda en may\u00fasculas y no puede repetirse en este cat\u00e1logo. Pulsa Guardar para confirmar o Cancelar para volver sin guardar los cambios.",
                        "El l\u00e1piz abre Datos e Historial. Crear un tipo no registra una actuaci\u00f3n ni da por cumplida una tarea."
                ]
        },
        {
                "titulo": "3. Consultar y filtrar",
                "icono": "pi pi-search",
                "pasos": [
                        "Busca por nombre o descripci\u00f3n y filtra por Activos o Inactivos. Limpiar restablece los filtros y Actualizar consulta los datos recientes.",
                        "Usa la paginaci\u00f3n de la tabla para recorrer los resultados."
                ]
        },
        {
                "titulo": "4. Desactivar e historial",
                "icono": "pi pi-history",
                "pasos": [
                        "Si una opci\u00f3n deja de usarse, abre Datos con el l\u00e1piz, desact\u00edvala y guarda. No se borra f\u00edsicamente ni se elimina la informaci\u00f3n de los registros que ya la utilizaron.",
                        "Las opciones inactivas no se ofrecen para nuevas selecciones. Un expediente o solicitud que ya utiliza una opci\u00f3n inactiva conserva su referencia.",
                        "Historial permite consultar la fecha, el responsable y los valores anteriores y nuevos de los cambios registrados. En un alta nueva se genera al guardar por primera vez."
                ]
        }
];
    const detalleTab = ref('datos');
    let operacion = null;
    const filas = computed(() => registros.value.filter((r) => (estado.value === null || r.activo === estado.value) && (r.nombre + ' ' + r.descripcion).toLocaleLowerCase().includes(busqueda.value.trim().toLocaleLowerCase())));
    const valido = computed(() => formulario.nombre.trim().length > 0 && formulario.nombre.length <= 100 && formulario.descripcion.length <= 500);
    const handleCargar = async () => {
        cargando.value = true;
        error.value = '';
        try {
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/juridico/tipos_actuacion/' });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            registros.value = r.datos.tipos || [];
        } catch (e) {
            error.value = e.message || 'No fue posible consultar.';
        } finally {
            cargando.value = false;
        }
    };
    const handleNuevo = () => {
        detalleTab.value = 'datos';
        seleccionado.value = null;
        Object.assign(formulario, inicial());
        operacion = crypto.randomUUID();
        errorFormulario.value = '';
        mostrar.value = true;
    };
    const handleEditar = (r) => {
        detalleTab.value = 'datos';
        seleccionado.value = r;
        Object.assign(formulario, inicial(), r);
        operacion = crypto.randomUUID();
        errorFormulario.value = '';
        mostrar.value = true;
    };
    const handleNombre = (v) => {
        formulario.nombre = String(v || '').toLocaleUpperCase('es-MX');
    };
    const handleGuardar = async () => {
        if (guardando.value || !valido.value) return;
        guardando.value = true;
        errorFormulario.value = '';
        try {
            const datosJson = { id: formulario.id, revision: formulario.revision, nombre: formulario.nombre, descripcion: formulario.descripcion, activo: formulario.activo, operacion_id: operacion };
            const r = await store.dispatch(formulario.id ? 'api/apiPutToken' : 'api/apiPostToken', { direccion: '/juridico/tipos_actuacion/', datosJson });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            mostrar.value = false;
            toast.add({ severity: 'success', summary: 'Tipos de actuacion', detail: r.mensaje, life: 4000 });
            await handleCargar();
        } catch (e) {
            errorFormulario.value = e.message || 'No fue posible guardar.';
        } finally {
            guardando.value = false;
        }
    };
    const handleHistorial = (r) => {
        seleccionado.value = r;
        mostrarHistorial.value = true;
    };
    const handleFecha = valor => handleFechaJuridico(valor, true);
    const handleLimpiar = () => {
        busqueda.value = '';
        estado.value = null;
    };
    onMounted(handleCargar);
    return {
        mostrarAyuda,
        handleAyuda,
        guia,
        detalleTab,
        filas,
        busqueda,
        estado,
        estados,
        cargando,
        guardando,
        mostrar,
        error,
        errorFormulario,
        formulario,
        valido,
        mostrarHistorial,
        seleccionado,
        handleCargar,
        handleNuevo,
        handleEditar,
        handleNombre,
        handleGuardar,
        handleHistorial,
        handleFecha,
        handleLimpiar
    };
}
