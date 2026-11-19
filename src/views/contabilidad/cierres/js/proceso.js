import {computed,onMounted,onUnmounted,ref} from 'vue';
import {useStore} from 'vuex';
import {useToast} from 'primevue/usetoast';

const ruta='/contabilidad/cierres/';
export default function proceso(){
    const store=useStore(),toast=useToast();
    const empresas=ref([]),empresa=ref(null),anio=ref(new Date().getFullYear());
    const ejercicios=Array.from({length:3},(_,i)=>{const valor=new Date().getFullYear()+i;return {nombre:String(valor),valor};});
    const datos=ref(null),cargando=ref(false),guardando=ref(false),error=ref(''),tab=ref('revision');
    const mostrarAyuda=ref(false),mostrarCambio=ref(false),motivo=ref(''),errorCambio=ref('');
    let activo=true,consulta=0,operacion='',contexto=null;
    const empresaActual=computed(()=>empresas.value.find(e=>e.id===empresa.value));
    const estado=computed(()=>datos.value?.cierre?.estado||'abierto');
    const puedeCambiar=computed(()=>!!datos.value&&empresaActual.value?.activo&&!cargando.value&&!guardando.value&&
        (estado.value==='cerrado'||(estado.value==='abierto'&&datos.value.validaciones.every(v=>v.correcto))));
    const valido=computed(()=>motivo.value.trim().length>=5&&motivo.value.trim().length<=500);
    const handleEstado=v=>({abierto:'Abierto',cerrado:'Cerrado',revisando:'En revisión',sin_abrir:'Sin abrir'}[v]||v);
    const handleSeverity=v=>({abierto:'success',cerrado:'secondary',revisando:'warn',sin_abrir:'secondary'}[v]||'secondary');
    const handleMoneda=v=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(v||0));
    const handleFecha=v=>v?new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(v)):'';
    const handleCargar=async()=>{
        if(guardando.value)return;
        const actual=++consulta;cargando.value=true;error.value='';
        try{
            const q=empresa.value?'?company_id='+encodeURIComponent(empresa.value)+'&anio='+anio.value:'';
            const r=await store.dispatch('api/apiGetTokenSinCargando',{direccion:ruta+q});
            if(!activo||actual!==consulta)return;
            if(r.estatus!==200)throw new Error(r.mensaje);
            empresas.value=r.datos.empresas||[];datos.value=empresa.value?r.datos:null;
        }catch(e){if(activo&&actual===consulta){datos.value=null;error.value=e.message||'No fue posible consultar el ejercicio.';}}
        finally{if(activo&&actual===consulta)cargando.value=false;}
    };
    const handleFiltro=()=>{datos.value=null;tab.value='revision';handleCargar();};
    const handleCambio=()=>{
        if(!puedeCambiar.value)return;
        contexto={company_id:empresa.value,anio:anio.value,revision:datos.value.cierre.revision,accion:estado.value==='cerrado'?'reabrir':'cerrar'};
        motivo.value='';errorCambio.value='';operacion=crypto.randomUUID();mostrarCambio.value=true;
    };
    const handleGuardar=async()=>{
        if(!valido.value||guardando.value)return;
        guardando.value=true;errorCambio.value='';
        try{
            const r=await store.dispatch('api/apiPostToken',{direccion:ruta,datosJson:{...contexto,motivo:motivo.value.trim(),operacion_id:operacion}});
            if(!activo)return;
            if(r.estatus!==200)throw new Error(r.mensaje);
            mostrarCambio.value=false;toast.add({severity:'success',summary:'Cierres contables',detail:r.mensaje,life:4500});
        }catch(e){if(activo)errorCambio.value=e.message||'No fue posible guardar el cierre.';}
        finally{if(activo)guardando.value=false;}
        if(activo&&!mostrarCambio.value)await handleCargar();
    };
    const guia=[
        {titulo:'1. Prepara el ejercicio',texto:'Selecciona empresa y año. Revisa las pólizas y sus saldos antes de cerrar. Esta opción controla el bloqueo del ejercicio completo.'},
        {titulo:'2. Revisa los doce meses',texto:'Todos los meses deben estar cerrados en Periodos. No debe haber borradores ni operaciones mensuales en curso y los cargos deben coincidir con los abonos. Los meses sin movimientos también deben abrirse y cerrarse.'},
        {titulo:'3. Cierra el ejercicio',texto:'Registra un motivo. Se conserva el responsable, la fecha, el resumen y una copia de los saldos al cerrar. Las pólizas contabilizadas se conservan y no se borran.'},
        {titulo:'4. Si necesitas corregir',texto:'Reabre el ejercicio con un motivo. Los meses siguen cerrados: después reabre únicamente el mes que necesites en Periodos. Al terminar, vuelve a cerrar el mes y el ejercicio.'},
        {titulo:'Póliza de resultados',texto:'Este cierre es operativo: no genera una póliza para saldar ingresos, costos y gastos ni traspasa automáticamente el resultado a capital. Esos asientos deben revisarse y contabilizarse antes del cierre; requieren las cuentas definidas por tu contador. Los saldos se calculan con el historial contabilizado, sin duplicar una póliza de apertura.'}
    ];
    onMounted(handleCargar);onUnmounted(()=>{activo=false;consulta++;});
    return {empresas,empresa,anio,ejercicios,datos,cargando,guardando,error,tab,mostrarAyuda,mostrarCambio,motivo,errorCambio,
        empresaActual,estado,puedeCambiar,valido,guia,handleEstado,handleSeverity,handleMoneda,handleFecha,
        handleCargar,handleFiltro,handleCambio,handleGuardar};
}
