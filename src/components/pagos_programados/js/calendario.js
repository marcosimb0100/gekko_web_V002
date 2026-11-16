import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { pagosDelMes } from '@/helpers/calendarioPagos';

const hoyMexico = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export default function proceso() {
    const store = useStore(),
        router = useRouter();
    const visible = ref(false),
        hoy = ref(hoyMexico()),
        anio = ref(Number(hoy.value.slice(0, 4))),
        mes = ref(Number(hoy.value.slice(5, 7)) - 1),
        seleccionado = ref(hoy.value);
    const registros = ref([]),
        diasJuridicos = ref([]),
        tareas = ref([]),
        totalTareas = ref(0),
        primeroTareas = ref(0);
    const cargandoPagos = ref(false),
        cargandoJuridico = ref(false),
        cargandoDia = ref(false),
        errorPagos = ref(''),
        errorJuridico = ref(''),
        errorDia = ref('');
    const puedePagos = ref(true),
        puedeJuridico = ref(true),
        fuente = ref('Todos');
    const fuentes = [
        { nombre: 'Todos', valor: 'Todos' },
        { nombre: 'Pagos', valor: 'Pagos' },
        { nombre: 'Jurídico', valor: 'Juridico' }
    ];
    let activo = true,
        consultaPagos = 0,
        consultaMes = 0,
        consultaDia = 0;
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const cargando = computed(() => cargandoPagos.value || cargandoJuridico.value);
    const tituloMes = computed(() => new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(anio.value, mes.value, 1))));
    const agendaPagos = computed(() => pagosDelMes(registros.value, anio.value, mes.value));
    const cantidadPagos = computed(() => Object.values(agendaPagos.value).reduce((n, filas) => n + filas.length, 0));
    const cantidadJuridico = computed(() => diasJuridicos.value.reduce((n, x) => n + x.cantidad, 0));
    const pagosSeleccionados = computed(() => (fuente.value === 'Juridico' ? [] : agendaPagos.value[seleccionado.value] || []));
    const fechaSeleccionada = computed(() => new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(seleccionado.value + 'T00:00:00Z')));
    const celdas = computed(() => {
        const inicio = new Date(Date.UTC(anio.value, mes.value, 1)),
            vacios = (inicio.getUTCDay() + 6) % 7,
            ultimo = new Date(Date.UTC(anio.value, mes.value + 1, 0)).getUTCDate();
        return [
            ...Array(vacios).fill(null),
            ...Array.from({ length: ultimo }, (_, i) => {
                const dia = i + 1,
                    fecha = `${anio.value}-${String(mes.value + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                const pagos = fuente.value === 'Juridico' ? 0 : (agendaPagos.value[fecha] || []).length;
                const juridico = fuente.value === 'Pagos' ? 0 : diasJuridicos.value.filter((x) => x.fecha === fecha).reduce((n, x) => n + x.cantidad, 0);
                return { dia, fecha, pagos, juridico, cantidad: pagos + juridico };
            })
        ];
    });
    const handleCargarPagos = async () => {
        const actual = ++consultaPagos;
        cargandoPagos.value = true;
        errorPagos.value = '';
        registros.value = [];
        try {
            const r = await store.dispatch('api/apiGetCalendario', { direccion: '/pagos_programados/' });
            if (!activo || actual !== consultaPagos || !visible.value) return;
            puedePagos.value = r.estatus !== 403;
            if (r.estatus === 403) return;
            if (r.estatus !== 200) throw new Error(r.mensaje || 'No fue posible consultar los pagos.');
            registros.value = Array.isArray(r.datos?.programaciones) ? r.datos.programaciones : [];
        } catch (e) {
            if (actual === consultaPagos) errorPagos.value = e.message;
        } finally {
            if (actual === consultaPagos) cargandoPagos.value = false;
        }
    };
    const handleCargarDia = async () => {
        const actual = ++consultaDia,
            fecha = seleccionado.value;
        tareas.value = [];
        totalTareas.value = 0;
        errorDia.value = '';
        if (!puedeJuridico.value || fuente.value === 'Pagos' || !visible.value || !diasJuridicos.value.some((x) => x.fecha === fecha)) {
            cargandoDia.value = false;
            return;
        }
        cargandoDia.value = true;
        try {
            const q = new URLSearchParams({ desde: fecha, hasta: fecha, estado: 'Pendientes', pagina: String(Math.floor(primeroTareas.value / 10) + 1), limite: '10' });
            const r = await store.dispatch('api/apiGetCalendario', { direccion: '/juridico/agenda/?' + q });
            if (!activo || actual !== consultaDia || !visible.value || seleccionado.value !== fecha) return;
            if (r.estatus === 403) {
                puedeJuridico.value = false;
                diasJuridicos.value = [];
                return;
            }
            if (r.estatus !== 200) throw new Error(r.mensaje || 'No fue posible consultar las tareas.');
            tareas.value = r.datos.tareas || [];
            totalTareas.value = r.datos.total || 0;
        } catch (e) {
            if (actual === consultaDia) errorDia.value = e.message;
        } finally {
            if (actual === consultaDia) cargandoDia.value = false;
        }
    };
    const handleCargarJuridico = async () => {
        const actual = ++consultaMes;
        ++consultaDia;
        cargandoDia.value = false;
        cargandoJuridico.value = true;
        errorJuridico.value = '';
        diasJuridicos.value = [];
        tareas.value = [];
        totalTareas.value = 0;
        try {
            const desde = `${anio.value}-${String(mes.value + 1).padStart(2, '0')}-01`,
                hasta = new Date(Date.UTC(anio.value, mes.value + 1, 0)).toISOString().slice(0, 10);
            const q = new URLSearchParams({ desde, hasta, estado: 'Pendientes' });
            const r = await store.dispatch('api/apiGetCalendario', { direccion: '/juridico/agenda/calendario?' + q });
            if (!activo || actual !== consultaMes || !visible.value) return;
            puedeJuridico.value = r.estatus !== 403;
            if (r.estatus === 403) return;
            if (r.estatus !== 200) throw new Error(r.mensaje || 'No fue posible consultar Juridico.');
            diasJuridicos.value = r.datos.dias || [];
            primeroTareas.value = 0;
            await handleCargarDia();
        } catch (e) {
            if (actual === consultaMes) errorJuridico.value = e.message;
        } finally {
            if (actual === consultaMes) cargandoJuridico.value = false;
        }
    };
    const handleCargar = () => Promise.allSettled([handleCargarPagos(), handleCargarJuridico()]);
    const handleMostrar = () => {
        hoy.value = hoyMexico();
        anio.value = Number(hoy.value.slice(0, 4));
        mes.value = Number(hoy.value.slice(5, 7)) - 1;
        seleccionado.value = hoy.value;
        fuente.value = 'Todos';
        visible.value = true;
        handleCargar();
    };
    const handleCambiarMes = (salto) => {
        const fecha = new Date(Date.UTC(anio.value, mes.value + salto, 1));
        anio.value = fecha.getUTCFullYear();
        mes.value = fecha.getUTCMonth();
        seleccionado.value = fecha.toISOString().slice(0, 10);
        primeroTareas.value = 0;
        handleCargarJuridico();
    };
    const handleIrHoy = () => {
        hoy.value = hoyMexico();
        anio.value = Number(hoy.value.slice(0, 4));
        mes.value = Number(hoy.value.slice(5, 7)) - 1;
        seleccionado.value = hoy.value;
        handleCargarJuridico();
    };
    const handleSeleccionar = (fecha) => {
        seleccionado.value = fecha;
        primeroTareas.value = 0;
        handleCargarDia();
    };
    const handlePagina = (e) => {
        primeroTareas.value = e.first;
        handleCargarDia();
    };
    const handleAbrirAgenda = () => {
        visible.value = false;
        router.push({ path: '/juridico/agenda', query: { fecha: seleccionado.value } });
    };
    const handleMoneda = (importe) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(importe) || 0);
    const handleAgendaActualizada = () => {
        if (visible.value) handleCargarJuridico();
    };
    watch(fuente, () => {
        primeroTareas.value = 0;
        handleCargarDia();
    });
    window.addEventListener('juridico-agenda-actualizada', handleAgendaActualizada);
    onBeforeUnmount(() => {
        activo = false;
        window.removeEventListener('juridico-agenda-actualizada', handleAgendaActualizada);
    });
    return {
        visible,
        hoy,
        anio,
        mes,
        seleccionado,
        fuente,
        fuentes,
        diasSemana,
        cargando,
        cargandoDia,
        errorPagos,
        errorJuridico,
        errorDia,
        puedePagos,
        puedeJuridico,
        tituloMes,
        cantidadPagos,
        cantidadJuridico,
        pagosSeleccionados,
        fechaSeleccionada,
        celdas,
        tareas,
        totalTareas,
        primeroTareas,
        handleMostrar,
        handleCargar,
        handleCambiarMes,
        handleIrHoy,
        handleSeleccionar,
        handlePagina,
        handleAbrirAgenda,
        handleMoneda
    };
}
