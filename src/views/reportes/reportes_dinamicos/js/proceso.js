import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';

export default function useProceso() {
    const store = useStore(), toast = useToast(), direccion = '/reportes/dinamicos';
    const reportes = ref([]), empresas = ref([]), cuentas = ref([]), reporteId = ref(null), empresa = ref(null);
    const desde = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), hasta = ref(new Date());
    const banco = ref(null), cuenta = ref(null), concepto = ref(''), tipo = ref(null), estado = ref(null), conFacturas = ref(null);
    const cargando = ref(false), resultado = ref(null), errorConsulta = ref(''), mostrarAyuda = ref(false), valorGrafica = ref(null);
    const reporte = computed(() => reportes.value.find(item => item._id === reporteId.value));
    const handleFiltro = campo => reporte.value?.filtros?.includes(campo);
    const bancos = computed(() => [...new Map(cuentas.value.map(item => [item.clave_banco, { value: item.clave_banco, label: `${item.clave_banco} - ${item.banco}` }])).values()]);
    const cuentasFiltradas = computed(() => cuentas.value.filter(item => !banco.value || item.clave_banco === banco.value));
    const tipos = ['Ingreso', 'Egreso'];
    const estados = [{ label: 'Sin aplicacion', value: 'Sin aplicacion' }, { label: 'Parcial', value: 'Parcial' }, { label: 'Completa', value: 'Completa' }];
    const facturasOpciones = ['Con facturas', 'Sin facturas'];
    const etiquetas = { ingresos: 'Ingresos', egresos: 'Egresos', aplicado: 'Importe aplicado a CFDI', pendiente: 'Importe pendiente de aplicar', movimientos: 'Cantidad de movimientos', facturas: 'Facturas diferentes', empresa: 'Empresa', banco: 'Banco', cuenta: 'Cuenta', concepto: 'Concepto', anio: 'Anio', mes: 'Mes', tipo_movimiento: 'Ingreso / egreso', estado_aplicacion: 'Estado CFDI', con_facturas: 'Con / sin facturas' };
    const handleEtiqueta = campo => etiquetas[campo] || campo;
    const valoresGrafica = computed(() => (resultado.value?.reporte.valores || []).map(value => ({ value, label: handleEtiqueta(value) })));
    const graficaDatos = computed(() => ({ labels: (resultado.value?.grafica || []).slice(0,15).map(item => item.nombre), datasets: [{ label: handleEtiqueta(valorGrafica.value), data: (resultado.value?.grafica || []).slice(0,15).map(item => item[valorGrafica.value] || 0), backgroundColor: '#06b6d4', borderRadius: 5, maxBarThickness: 35 }] }));
    const handleFormato = (valor, campo) => new Intl.NumberFormat('es-MX', ['movimientos','facturas'].includes(campo) ? { maximumFractionDigits: 0 } : { style:'currency', currency:'MXN' }).format(valor || 0);
    const graficaOpciones = computed(() => ({ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display:false }, tooltip: { callbacks: { label: item => handleFormato(item.parsed.x, valorGrafica.value) } } }, scales: { y: { grid:{display:false} }, x: { beginAtZero:true, ticks: { callback: valor => new Intl.NumberFormat('es-MX', {notation:'compact'}).format(valor) } } } }));
    const handleClase = fila => fila.tipo === 'total' ? 'reporte-total' : fila.tipo === 'subtotal' ? 'reporte-subtotal' : '';
    const handleFecha = fecha => fecha instanceof Date && !Number.isNaN(fecha.getTime()) ? `${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}-${String(fecha.getDate()).padStart(2,'0')}` : '';
    const handleDatos = res => res?.datos?.datos ?? res?.datos ?? res?.data?.datos ?? res?.data ?? {};
    const handlePeticion = async ruta => {
        const res = await store.dispatch('api/apiGetToken', {direccion:ruta});
        if(res?.estatus !== 200) throw new Error(res?.mensaje || 'No fue posible consultar el reporte.');
        return handleDatos(res);
    };
    const handleError = error => { errorConsulta.value = error.message; toast.add({severity:'error',summary:'Reportes dinamicos',detail:error.message,life:5000}); };
    const handleCambiarReporte = () => {
        resultado.value = null; errorConsulta.value = ''; banco.value = null; cuenta.value = null; concepto.value = ''; tipo.value = null; estado.value = null; conFacturas.value = null;
    };
    const handleCambiarEmpresa = async () => {
        resultado.value = null; cuentas.value = []; cuenta.value = null; banco.value = null;
        if (!empresa.value) return;
        cargando.value = true;
        try { cuentas.value = ((await handlePeticion(`${direccion}/empresas/${empresa.value}/cuentas`)).cuentas || []).map(item => ({...item, etiqueta:`${item.banco} - ${item.cuenta_banco || item.clabe_bancaria}`})); }
        catch(error) { handleError(error); } finally { cargando.value = false; }
    };
    const handleActualizar = async () => {
        if(cargando.value) return;
        cargando.value = true; resultado.value = null; errorConsulta.value = '';
        try {
            reportes.value = (await handlePeticion(`${direccion}/`)).reportes || [];
            empresas.value = (await handlePeticion(`${direccion}/empresas`)).empresas || [];
            if(!reportes.value.some(item => item._id === reporteId.value)) reporteId.value = null;
        } catch(error) { handleError(error); } finally { cargando.value = false; }
    };
    const handleGenerar = async () => {
        if(cargando.value) return;
        if(!reporte.value || !empresa.value || !handleFecha(desde.value) || !handleFecha(hasta.value) || desde.value > hasta.value) {
            toast.add({severity:'warn',summary:'Reportes dinamicos',detail:'Selecciona reporte, empresa y un periodo valido.',life:4000}); return;
        }
        cargando.value = true; resultado.value = null; errorConsulta.value = '';
        try {
            const parametros = new URLSearchParams({company_id:empresa.value,desde:handleFecha(desde.value),hasta:handleFecha(hasta.value)});
            const filtros = {banco:banco.value,cuenta:cuenta.value,concepto:concepto.value,tipo_movimiento:tipo.value,estado_aplicacion:estado.value,con_facturas:conFacturas.value};
            for(const [campo,valor] of Object.entries(filtros)) if(handleFiltro(campo) && valor) parametros.set(campo,valor);
            resultado.value = await handlePeticion(`${direccion}/${reporteId.value}/generar?${parametros}`);
            valorGrafica.value = resultado.value.reporte.valores[0];
        } catch(error) { handleError(error); } finally { cargando.value = false; }
    };
    const handleLimpiar = () => {
        if(cargando.value) return;
        reporteId.value = null; empresa.value = null; cuentas.value = []; handleCambiarReporte();
        desde.value = new Date(new Date().getFullYear(),new Date().getMonth(),1); hasta.value = new Date();
    };
    watch([desde,hasta,banco,cuenta,concepto,tipo,estado,conFacturas], () => { resultado.value = null; });
    onMounted(handleActualizar);
    return { reportes,empresas,cuentasFiltradas,bancos,reporteId,reporte,empresa,desde,hasta,banco,cuenta,concepto,tipo,estado,conFacturas,cargando,resultado,errorConsulta,mostrarAyuda,valorGrafica,valoresGrafica,graficaDatos,graficaOpciones,tipos,estados,facturasOpciones,
        handleFiltro,handleEtiqueta,handleFormato,handleClase,handleCambiarReporte,handleCambiarEmpresa,handleActualizar,handleGenerar,handleLimpiar };
}
