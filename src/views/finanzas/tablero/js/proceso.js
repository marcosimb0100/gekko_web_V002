import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';

export default function useProceso() {
    const store = useStore();
    const toast = useToast();
    const empresas = ref([]), cuentas = ref([]), empresa = ref(null), cuenta = ref(null);
    const desde = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), hasta = ref(new Date());
    const cargando = ref(false), movimientos = ref([]), total = ref(0), primero = ref(0), limite = ref(25);
    const estado = ref('todos'), buscar = ref(''), resumen = ref({}), consultado = ref(false);
    const mostrarDetalle = ref(false), mostrarNota = ref(false), nota = ref(''), facturas = ref([]), cargandoDetalle = ref(false), errorDetalle = ref('');
    const estados = [
        { label: 'Todos los movimientos', value: 'todos' }, { label: 'Con concepto', value: 'concepto' },
        { label: 'Con facturas', value: 'facturas' }, { label: 'Con concepto y facturas', value: 'ambos' },
        { label: 'Por revisar', value: 'revisar' }, { label: 'Sin aplicaci\u00f3n', value: 'sin_aplicacion' },
        { label: 'Aplicaci\u00f3n parcial', value: 'parcial' }, { label: 'Aplicaci\u00f3n completa', value: 'completo' }
    ];
    const fichas = computed(() => [
        { clave: 'todos', nombre: 'Total de movimientos', cantidad: resumen.value.total || 0, icono: 'pi pi-list' },
        { clave: 'concepto', nombre: 'Con concepto', cantidad: resumen.value.concepto || 0, icono: 'pi pi-tags' },
        { clave: 'facturas', nombre: 'Con facturas', cantidad: resumen.value.facturas || 0, icono: 'pi pi-copy' },
        { clave: 'ambos', nombre: 'Con concepto y facturas', cantidad: resumen.value.ambos || 0, icono: 'pi pi-check-circle' },
        { clave: 'revisar', nombre: 'Por revisar', cantidad: resumen.value.revisar || 0, icono: 'pi pi-search' }
    ]);
    const mostrarMovimientos = ref(false);
    // Las categorias son excluyentes: cada movimiento se cuenta una sola vez.
    const clasificacionDatos = computed(() => {
        const r = resumen.value;
        const ambos = Number(r.ambos || 0);
        return { labels: ['Concepto y factura', 'Solo concepto', 'Solo factura', 'Sin concepto ni factura'], datasets: [{
            data: [ambos, Math.max(0, Number(r.concepto || 0) - ambos), Math.max(0, Number(r.facturas || 0) - ambos), Math.max(0, Number(r.total || 0) - Number(r.concepto || 0) - Number(r.facturas || 0) + ambos)],
            backgroundColor: ['#10b981', '#06b6d4', '#818cf8', '#dce4ee'], borderWidth: 0, hoverOffset: 6
        }] };
    });
    const conciliacionDatos = computed(() => ({ labels: ['Completa', 'Parcial', 'Sin importe aplicado'], datasets: [{
        data: [Number(resumen.value.completo || 0), Number(resumen.value.parcial || 0), Number(resumen.value.sin_aplicacion || 0)],
        backgroundColor: ['#10b981', '#f59e0b', '#dce4ee'], borderWidth: 0, hoverOffset: 6
    }] }));
    const flujoDatos = computed(() => ({ labels: ['Ingresos', 'Egresos'], datasets: [{ label: 'Importe MXN', data: [Number(resumen.value.ingresos || 0), Number(resumen.value.egresos || 0)], backgroundColor: ['#10b981', '#f87171'], borderRadius: 7, maxBarThickness: 64 }] }));
    const opcionesAnillo = {
        responsive: true, maintainAspectRatio: false, cutout: '72%',
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 14, font: { size: 11 } } }, tooltip: { callbacks: { label: contexto => {
            const total = contexto.dataset.data.reduce((suma, valor) => suma + valor, 0);
            return `${contexto.label}: ${contexto.parsed} (${total ? (contexto.parsed / total * 100).toFixed(1) : 0}%)`;
        } } } }
    };
    const opcionesFlujo = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: contexto => handleMoneda(contexto.parsed.y) } } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, border: { display: false }, grid: { color: '#eef2f6' }, ticks: { callback: valor => new Intl.NumberFormat('es-MX', { notation: 'compact', style: 'currency', currency: 'MXN', maximumFractionDigits: 1 }).format(valor) } } }
    };
    const porcentajeCompleto = computed(() => resumen.value.total ? Math.round(Number(resumen.value.completo || 0) / resumen.value.total * 100) : 0);
    const handleDatos = res => res?.datos?.datos ?? res?.datos ?? res?.data?.datos ?? res?.data ?? {};
    const handleFecha = valor => valor instanceof Date && !Number.isNaN(valor.getTime()) ? `${valor.getFullYear()}-${String(valor.getMonth()+1).padStart(2,'0')}-${String(valor.getDate()).padStart(2,'0')}` : '';
    const handleMoneda = valor => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(valor || 0));
    const handleEstado = valor => ({ sin_aplicacion: 'Sin aplicaci\u00f3n', parcial: 'Parcial', completo: 'Completa' }[valor] || valor);
    const handlePeticion = async direccion => {
        const res = await store.dispatch('api/apiGetToken', { direccion });
        if (res?.estatus !== 200) throw new Error(res?.mensaje || 'No fue posible consultar la informaci\u00f3n.');
        return handleDatos(res);
    };
    const handleError = error => toast.add({ severity: 'error', summary: 'Tablero financiero', detail: error.message, life: 4500 });
    const handleCambiarEmpresa = async () => {
        cuenta.value = null; cuentas.value = []; movimientos.value = []; resumen.value = {}; total.value = 0; consultado.value = false;
        if (!empresa.value) return;
        cargando.value = true;
        try {
            const datos = await handlePeticion(`/finanzas/tablero/empresas/${empresa.value}/cuentas`);
            cuentas.value = (datos.cuentas || []).map(item => ({ ...item, etiqueta: `${item.banco_nombre || item.banco_descripcion || item.descripcion || item.banco || ''} ${item.numero_cuenta || item.cuenta || item.clabe_bancaria || item.clabe_banco || ''}`.trim() }));
        } catch (error) { handleError(error); } finally { cargando.value = false; }
    };
    const handleConsultar = async (reiniciar = true) => {
        if (cargando.value) return;
        if (!empresa.value || !handleFecha(desde.value) || !handleFecha(hasta.value) || desde.value > hasta.value) {
            toast.add({ severity: 'warn', summary: 'Tablero financiero', detail: 'Selecciona empresa y un periodo v\u00e1lido.', life: 3500 }); return;
        }
        if (reiniciar) primero.value = 0;
        cargando.value = true;
        try {
            const params = new URLSearchParams({ company_id: empresa.value, desde: handleFecha(desde.value), hasta: handleFecha(hasta.value), estado: estado.value, buscar: buscar.value, pagina: String(Math.floor(primero.value / limite.value)), limite: String(limite.value) });
            if (cuenta.value) params.set('cuenta', cuenta.value);
            const datos = await handlePeticion(`/finanzas/tablero/?${params}`);
            movimientos.value = datos.movimientos || []; resumen.value = datos.resumen || {}; total.value = datos.total || 0; consultado.value = true;
        } catch (error) { movimientos.value = []; total.value = 0; resumen.value = {}; consultado.value = false; handleError(error); }
        finally { cargando.value = false; }
    };
    const handlePagina = evento => { primero.value = evento.first; limite.value = evento.rows; handleConsultar(false); };
    const handleFicha = clave => { if (cargando.value) return; estado.value = clave; mostrarMovimientos.value = true; handleConsultar(); };
    const handleLimpiar = () => {
        if (cargando.value) return;
        empresa.value = null; cuenta.value = null; cuentas.value = []; estado.value = 'todos'; buscar.value = ''; movimientos.value = []; resumen.value = {}; total.value = 0; primero.value = 0; consultado.value = false; mostrarMovimientos.value = false;
        desde.value = new Date(new Date().getFullYear(), new Date().getMonth(), 1); hasta.value = new Date();
    };
    const handleNota = fila => { nota.value = fila.nota_movimiento || 'Sin nota registrada.'; mostrarNota.value = true; };
    const handleFacturas = async fila => {
        if (cargandoDetalle.value) return;
        mostrarDetalle.value = true; facturas.value = []; errorDetalle.value = ''; cargandoDetalle.value = true;
        try { facturas.value = await handlePeticion(`/finanzas/tablero/movimientos/${fila._id}/facturas`); }
        catch (error) { errorDetalle.value = error.message; }
        finally { cargandoDetalle.value = false; }
    };
    onMounted(async () => {
        cargando.value = true;
        try { empresas.value = (await handlePeticion('/finanzas/tablero/empresas')).empresas || []; }
        catch (error) { handleError(error); } finally { cargando.value = false; }
    });
    return { mostrarMovimientos, clasificacionDatos, conciliacionDatos, flujoDatos, opcionesAnillo, opcionesFlujo, porcentajeCompleto, empresas, cuentas, empresa, cuenta, desde, hasta, cargando, movimientos, total, primero, limite, estado, buscar, resumen, consultado, estados, fichas, mostrarDetalle, mostrarNota, nota, facturas, cargandoDetalle, errorDetalle,
        handleCambiarEmpresa, handleConsultar, handlePagina, handleFicha, handleLimpiar, handleNota, handleFacturas, handleMoneda, handleEstado };
}
