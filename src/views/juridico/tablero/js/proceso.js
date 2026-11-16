import { handleFechaJuridico } from '@/helpers/fechaJuridico';
import seguimiento from './seguimiento';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default function proceso() {
    const store = useStore(), router = useRouter(), toast = useToast();
    const empresa = ref(null), empresas = ref([]), datos = ref(null), cargando = ref(false), error = ref('');
    const busqueda = ref('');
    let consulta = 0, activo = true, timer = null;
    const indicadores = computed(() => [
        { nombre: 'Solicitudes por atender', icono: 'pi pi-inbox', valor: datos.value?.resumen.solicitudes },
        { nombre: 'Expedientes abiertos', icono: 'pi pi-folder-open', valor: datos.value?.resumen.expedientes },
        { nombre: 'Compromisos en 7 días', icono: 'pi pi-calendar', valor: datos.value?.resumen.proximas },
        { nombre: 'Tareas vencidas', icono: 'pi pi-exclamation-circle', valor: datos.value?.resumen.vencidas }
    ]);
    const mostrarAyuda = ref(false);
    const handleAyuda = () => { mostrarAyuda.value = true; };
    const guia = [
        {
                "titulo": "1. Para qu\u00e9 sirve",
                "icono": "pi pi-chart-bar",
                "pasos": [
                        "Este tablero resume la situaci\u00f3n actual de las solicitudes, expedientes y compromisos del equipo jur\u00eddico. Sirve para identificar lo que requiere atenci\u00f3n.",
                        "Es una pantalla de consulta. Para capturar o modificar informaci\u00f3n utiliza Solicitudes, Expedientes o Agenda y tareas, seg\u00fan corresponda."
                ]
        },
        {
                "titulo": "2. Elegir empresa y actualizar",
                "icono": "pi pi-filter",
                "pasos": [
                        "Selecciona una empresa para consultar sus indicadores y compromisos. Todas las empresas muestra el resumen conjunto; la X del selector quita la selecci\u00f3n.",
                        "Al cambiar la empresa se consultan los datos. Pulsa Actualizar para recuperar los cambios recientes del equipo.",
                        "Los indicadores no se limitan al mes mostrado en la agenda: representan la situaci\u00f3n actual de la empresa seleccionada."
                ]
        },
        {
                "titulo": "3. Entender los indicadores",
                "icono": "pi pi-info-circle",
                "pasos": [
                        "Solicitudes por atender: solicitudes en estado Por asignar o En atenci\u00f3n. Las resueltas y canceladas quedan fuera de este conteo.",
                        "Expedientes abiertos: asuntos en estado Abierto o En seguimiento. No incluye expedientes cerrados.",
                        "Compromisos en 7 d\u00edas: pr\u00f3ximas acciones pendientes con fecha desde hoy hasta la fecha de hoy m\u00e1s siete d\u00edas, ambas incluidas.",
                        "Tareas vencidas: pr\u00f3ximas acciones pendientes cuya fecha compromiso es anterior a hoy. Una tarea con fecha de hoy todav\u00eda no se considera vencida.",
                        "Los compromisos y vencimientos se calculan con la fecha de Ciudad de M\u00e9xico. Son fechas internas de trabajo, no plazos legales calculados autom\u00e1ticamente."
                ]
        },
        {
                "titulo": "4. Leer los compromisos por atender",
                "icono": "pi pi-calendar",
                "pasos": [
                        "La tabla muestra hasta 10 compromisos pendientes, ordenados de la fecha m\u00e1s antigua a la m\u00e1s pr\u00f3xima. Incluye los vencidos.",
                        "Cada fila identifica fecha compromiso, folio del expediente, empresa, pr\u00f3xima acci\u00f3n, responsable y estado.",
                        "Esta lista puede incluir fechas posteriores a los pr\u00f3ximos siete d\u00edas. Por eso puede haber filas aunque el indicador Compromisos en 7 d\u00edas muestre cero.",
                        "Para consultar todas las tareas, filtrar por responsable o registrar un cumplimiento, entra en Agenda y tareas."
                ]
        },
        {
                "titulo": "5. C\u00f3mo se actualiza el seguimiento",
                "icono": "pi pi-check-circle",
                "pasos": [
                        "Las solicitudes se registran y atienden en Solicitudes. Los expedientes y su pr\u00f3xima acci\u00f3n se administran en Expedientes.",
                        "El cumplimiento de una tarea se registra en Agenda y tareas. Al cumplirla deja de aparecer como pendiente; si programas una siguiente acci\u00f3n, esta se incorpora al seguimiento.",
                        "Pulsa Actualizar despu\u00e9s de esos cambios para ver el resumen reciente. Cumplir una tarea no cierra autom\u00e1ticamente su expediente.",
                        "Si no hay compromisos, revisa la empresa seleccionada y que los expedientes vigentes tengan pr\u00f3xima acci\u00f3n y fecha. Un expediente puede permanecer abierto sin tareas pendientes despu\u00e9s de cumplir su \u00faltima tarea."
                ]
        }
];
    guia[1].pasos.push('La b\u00fasqueda encuentra compromisos por folio, asunto, empresa, actividad o responsable. Se aplica antes de seleccionar los primeros 10 resultados. Los indicadores conservan el resumen de la empresa seleccionada.');
    guia[3].pasos.push('Ver seguimiento abre la l\u00ednea de tiempo, los documentos y los correos del expediente de esa fila. La informaci\u00f3n se carga al abrirlo, con 10 registros por p\u00e1gina. Desde all\u00ed puedes consultar y descargar; Abrir expediente aparece si tu perfil permite acceder a Expedientes.');
    const tareas = computed(() => datos.value?.tareas || []);
    async function handleCargar() {
        const actual = ++consulta;
        cargando.value = true; error.value = '';
        try {
            const q = new URLSearchParams();
            if (empresa.value) q.set('empresa_id', empresa.value);
            q.set('busqueda', busqueda.value.trim());
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/juridico/tablero/?' + q });
            if (!activo || actual !== consulta) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            datos.value = r.datos; empresas.value = r.datos.empresas || [];
        } catch (e) {
            if (activo && actual === consulta) { datos.value = null; error.value = e.message || 'No fue posible consultar el tablero.'; }
        } finally { if (activo && actual === consulta) cargando.value = false; }
    }
    const handleFecha = valor => handleFechaJuridico(valor, false);
    const handleLimpiar = () => { busqueda.value = ''; empresa.value = null; };
    watch([empresa, busqueda], () => { clearTimeout(timer); timer = setTimeout(handleCargar, 350); });
    onMounted(handleCargar);
    onBeforeUnmount(() => { activo = false; consulta++; clearTimeout(timer); });
    const detalle = seguimiento({ store, router, toast });
    return { ...detalle, busqueda, handleLimpiar, mostrarAyuda, handleAyuda, guia, empresa, empresas, indicadores, tareas, cargando, error, handleCargar, handleFecha };
}
