import {computed,onMounted,onUnmounted,reactive,ref} from 'vue';
import {useStore} from 'vuex';
import {useToast} from 'primevue/usetoast';

const ruta='/contabilidad/periodos/';
export default function proceso(){
    const store=useStore(),toast=useToast();
    const empresas=ref([]),empresa=ref(null),anio=ref(new Date().getFullYear()),periodos=ref([]),busqueda=ref(''),estado=ref(null);
    const cargando=ref(false),guardando=ref(false),error=ref(''),mostrarCambio=ref(false),errorCambio=ref(''),mostrarAyuda=ref(false),mostrarDetalle=ref(false),tab=ref('saldos');
    const ejercicioEstado=ref('abierto');
    const seleccionado=ref(null),historial=ref([]),saldos=ref([]);
    const formulario=reactive({accion:'abrir',mes:null,revision:0,motivo:''});
    let activo=true,consulta=0,operacion='';
    const ejercicios=Array.from({length:3},(_,i)=>{const valor=new Date().getFullYear()+i;return {nombre:String(valor),valor};});
    const empresaActual=computed(()=>empresas.value.find(e=>e.id===empresa.value));
    const estados=[{nombre:'Sin abrir',valor:'sin_abrir'},{nombre:'Abiertos',valor:'abierto'},{nombre:'Cerrados',valor:'cerrado'}];
    const handleEstado=v=>({sin_abrir:'Sin abrir',abierto:'Abierto',cerrado:'Cerrado'}[v]||v);
    const handleSeverity=v=>({sin_abrir:'secondary',abierto:'success',cerrado:'warn'}[v]||'secondary');
    const handleMoneda=v=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(v||0));
    const handleFecha=valor=>{
        if(!valor)return '';
        const d=new Date(valor);if(isNaN(d))return '';
        const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).map(p=>[p.type,p.value]));
        return p.year+'-'+p.month+'-'+p.day+' '+p.hour+':'+p.minute;
    };
    const filas=computed(()=>periodos.value.filter(p=>(!estado.value||p.estado===estado.value)&&
        (p.nombre+' '+p.anio+'-'+String(p.mes).padStart(2,'0')).toLowerCase().includes(busqueda.value.toLowerCase())));
    const sinAbrir=computed(()=>periodos.value.filter(p=>p.estado==='sin_abrir'));
    const resumen=computed(()=>[
        {nombre:'Ejercicio',valor:anio.value,icono:'pi pi-calendar'},
        {nombre:'Abiertos',valor:periodos.value.filter(p=>p.estado==='abierto').length,icono:'pi pi-lock-open'},
        {nombre:'Cerrados',valor:periodos.value.filter(p=>p.estado==='cerrado').length,icono:'pi pi-lock'}
    ]);
    const tituloCambio=computed(()=>({abrir:'Abrir periodo',cerrar:'Cerrar periodo',reabrir:'Reabrir periodo'}[formulario.accion]));
    const periodoCambio=computed(()=>periodos.value.find(p=>p.mes===formulario.mes));
    const valido=computed(()=>!!periodoCambio.value&&formulario.motivo.trim().length>=5&&formulario.motivo.length<=500);
    const handleCargar=async()=>{
        if(guardando.value)return;
        const actual=++consulta;cargando.value=true;error.value='';
        try{
            if(empresa.value&&(!Number.isInteger(anio.value)||anio.value<1900||anio.value>9998))throw new Error('Captura un ejercicio válido.');
            const q=empresa.value?'?company_id='+encodeURIComponent(empresa.value)+'&anio='+anio.value:'';
            const r=await store.dispatch('api/apiGetTokenSinCargando',{direccion:ruta+q});
            if(!activo||actual!==consulta)return;
            if(r.estatus!==200)throw new Error(r.mensaje);
            empresas.value=r.datos.empresas||[];periodos.value=r.datos.periodos||[];ejercicioEstado.value=r.datos.ejercicio_estado||'abierto';
        }catch(e){if(activo&&actual===consulta){error.value=e.message||'No fue posible consultar los periodos.';periodos.value=[];}}
        finally{if(activo&&actual===consulta)cargando.value=false;}
    };
    const handleLimpiar=()=>{busqueda.value='';estado.value=null;};
    const handleEjercicio=()=>{handleLimpiar();if(empresa.value)handleCargar();};
    const handleEmpresa=()=>{periodos.value=[];handleLimpiar();handleCargar();};
    const handleCambio=(p,accion)=>{
        if(!empresaActual.value?.activo||cargando.value||ejercicioEstado.value!=='abierto')return;
        Object.assign(formulario,{accion,mes:p.mes,revision:p.revision,motivo:''});
        errorCambio.value='';operacion=crypto.randomUUID();mostrarCambio.value=true;
    };
    const handleMes=()=>{formulario.revision=periodoCambio.value?.revision||0;operacion=crypto.randomUUID();};
    const handleGuardar=async()=>{
        if(!valido.value||guardando.value)return;
        guardando.value=true;errorCambio.value='';
        try{
            const r=await store.dispatch('api/apiPostToken',{direccion:ruta,datosJson:{company_id:empresa.value,anio:anio.value,mes:formulario.mes,revision:formulario.revision,accion:formulario.accion,motivo:formulario.motivo,operacion_id:operacion}});
            if(!activo)return;
            if(r.estatus!==200)throw new Error(r.mensaje);
            mostrarCambio.value=false;toast.add({severity:'success',summary:'Periodos contables',detail:r.mensaje,life:4500});
        }catch(e){if(activo)errorCambio.value=e.message||'No fue posible actualizar el periodo.';}
        finally{if(activo)guardando.value=false;}
        if(activo&&!mostrarCambio.value)await handleCargar();
    };
    const handleDetalle=async p=>{
        if(cargando.value)return;cargando.value=true;error.value='';
        try{
            const r=await store.dispatch('api/apiGetTokenSinCargando',{direccion:ruta+'detalle?company_id='+encodeURIComponent(empresa.value)+'&anio='+p.anio+'&mes='+p.mes});
            if(!activo)return;if(r.estatus!==200)throw new Error(r.mensaje);
            seleccionado.value=r.datos.periodo;historial.value=r.datos.historial||[];saldos.value=r.datos.saldos||[];tab.value='saldos';mostrarDetalle.value=true;
        }catch(e){if(activo)error.value=e.message||'No fue posible abrir el periodo.';}
        finally{if(activo)cargando.value=false;}
    };
    const guia=[
        {titulo:'1. Empresa y ejercicio',texto:'Selecciona la empresa y el año. Verás los doce meses; Sin abrir significa que todavía no se ha habilitado ese mes.'},
        {titulo:'2. Abre el mes',texto:'Pulsa Abrir e indica un motivo. La apertura permite guardar borradores, editarlos, anularlos y contabilizarlos dentro de ese mes.'},
        {titulo:'3. Contabiliza las pólizas',texto:'Guardar borrador no modifica saldos. En Pólizas, abre un borrador guardado y pulsa Contabilizar. La suma de cargos y abonos debe coincidir y las cuentas deben estar activas.'},
        {titulo:'4. Cierra o reabre',texto:'El cierre bloquea cambios y nuevas contabilizaciones. Puede haber borradores pendientes: permanecen guardados, pero no se pueden modificar ni contabilizar hasta reabrir. La reapertura también exige motivo. El sistema impide cerrar mientras una escritura está en curso.'},
        {titulo:'5. Consulta movimientos e historial',texto:'El detalle muestra los movimientos por cuenta y sus saldos según la naturaleza deudora o acreedora, calculados con las pólizas contabilizadas hasta ese mes. Borradores y anuladas no se suman. También puedes consultar quién abrió, cerró o reabrió cada periodo.'},
        {titulo:'Cierre mensual y cierre anual',texto:'Esta pantalla controla la apertura y el cierre operativo mensual. El cierre anual y sus pólizas de resultados corresponden a la opción Cierres y deben revisarse antes de bloquear el ejercicio en Cierres contables.'}
    ];
    onMounted(handleCargar);onUnmounted(()=>{activo=false;consulta++;});
    return {empresas,empresa,empresaActual,ejercicioEstado,anio,ejercicios,periodos,busqueda,estado,estados,cargando,guardando,error,mostrarCambio,errorCambio,mostrarAyuda,mostrarDetalle,tab,seleccionado,historial,saldos,formulario,filas,sinAbrir,resumen,tituloCambio,periodoCambio,valido,guia,
        handleEstado,handleSeverity,handleMoneda,handleFecha,handleCargar,handleLimpiar,handleEmpresa,handleCambio,handleEjercicio,handleMes,handleGuardar,handleDetalle};
}
