import {onMounted,onUnmounted,ref} from 'vue';
import {useStore} from 'vuex';
import {useToast} from 'primevue/usetoast';
const ruta='/contabilidad/auxiliares/';
const fechaLocal=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
export default function proceso(){
    const store=useStore(),toast=useToast();
    const empresas=ref([]),empresa=ref(null),cuentas=ref([]),cuenta=ref(null);
    const desde=ref(new Date(new Date().getFullYear(),new Date().getMonth(),1)),hasta=ref(new Date());
    const cargando=ref(false),exportando=ref(false),error=ref(''),mostrarAyuda=ref(false);
    const resultado=ref(null),filas=ref([]),total=ref(0),primero=ref(0),limite=ref(50);
    let activo=true,consulta=0,consultado=null;
    const handleMoneda=v=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(v||0));
    const handlePeticion=async direccion=>{
        const r=await store.dispatch('api/apiGetTokenSinCargando',{direccion});
        if(r.estatus!==200)throw new Error(r.mensaje||'No fue posible consultar el auxiliar.');
        return r.datos;
    };
    const handleLimpiarResultado=()=>{resultado.value=null;filas.value=[];total.value=0;primero.value=0;consultado=null;error.value='';};
    const handleEmpresa=async()=>{
        handleLimpiarResultado();cuenta.value=null;cuentas.value=[];
        if(!empresa.value)return;
        const turno=++consulta;cargando.value=true;
        try{const d=await handlePeticion(ruta+'?company_id='+encodeURIComponent(empresa.value));if(activo&&turno===consulta)cuentas.value=d.cuentas||[];}
        catch(e){if(activo&&turno===consulta)error.value=e.message;}
        finally{if(activo&&turno===consulta)cargando.value=false;}
    };
    const handleConsultar=async(evento=null)=>{
        if(cargando.value||exportando.value)return;
        if(!empresa.value||!cuenta.value||!desde.value||!hasta.value){error.value='Selecciona empresa, cuenta y fechas.';return;}
        if(desde.value>hasta.value){error.value='La fecha inicial debe ser anterior o igual a la final.';return;}
        const pagina=evento&&Number.isInteger(evento.first)?evento.first:0;
        const cantidad=evento?.rows||limite.value;
        const parametros={company_id:empresa.value,cuenta_id:cuenta.value,desde:fechaLocal(desde.value),hasta:fechaLocal(hasta.value)};
        const turno=++consulta;cargando.value=true;error.value='';
        try{
            const d=await handlePeticion(ruta+'?'+new URLSearchParams({...parametros,offset:pagina,limite:cantidad}));
            if(!activo||turno!==consulta)return;
            resultado.value=d;filas.value=d.movimientos||[];total.value=d.total||0;primero.value=pagina;limite.value=cantidad;consultado=parametros;
        }catch(e){if(activo&&turno===consulta){handleLimpiarResultado();error.value=e.message;}}
        finally{if(activo&&turno===consulta)cargando.value=false;}
    };
    const handleExportar=async()=>{
        if(!consultado||cargando.value||exportando.value)return;exportando.value=true;
        try{
            const r=await store.dispatch('api/apiGetblobSinCargando',{direccion:ruta+'excel?'+new URLSearchParams(consultado)});
            if(!activo)return;if(r.estatus!==200)throw new Error(r.mensaje||'No fue posible exportar el auxiliar.');
            const url=URL.createObjectURL(r.data),a=document.createElement('a');a.href=url;a.download='Auxiliar_'+consultado.desde+'_'+consultado.hasta+'.xlsx';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
        }catch(e){if(activo)toast.add({severity:'error',summary:'Auxiliares contables',detail:e.message,life:5000});}
        finally{if(activo)exportando.value=false;}
    };
    const handleLimpiar=()=>{if(cargando.value||exportando.value)return;cuenta.value=null;desde.value=new Date(new Date().getFullYear(),new Date().getMonth(),1);hasta.value=new Date();handleLimpiarResultado();};
    onMounted(async()=>{cargando.value=true;try{const d=await handlePeticion(ruta);if(activo)empresas.value=d.empresas||[];}catch(e){if(activo)error.value=e.message;}finally{if(activo)cargando.value=false;}});
    onUnmounted(()=>{activo=false;consulta++;});
    return {empresas,empresa,cuentas,cuenta,desde,hasta,cargando,exportando,error,mostrarAyuda,resultado,filas,total,primero,limite,handleMoneda,handleEmpresa,handleConsultar,handleLimpiar,handleLimpiarResultado,handleExportar};
}
