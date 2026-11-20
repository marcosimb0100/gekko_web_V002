import {onMounted,onUnmounted,ref} from 'vue';
import {useStore} from 'vuex';
import {useToast} from 'primevue/usetoast';
const ruta='/contabilidad/balance_general/';
const fechaLocal=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
export default function proceso(){
    const store=useStore(),toast=useToast();
    const empresas=ref([]),empresa=ref(null),corte=ref(new Date()),incluirCeros=ref(false);
    const cargando=ref(false),exportando=ref(false),error=ref(''),mostrarAyuda=ref(false),resultado=ref(null),filas=ref([]),total=ref(0),primero=ref(0),limite=ref(50);
    let activo=true,consulta=0,consultado=null;
    const handleMoneda=v=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(v||0));
    const handleLimpiarResultado=()=>{resultado.value=null;filas.value=[];total.value=0;primero.value=0;consultado=null;error.value='';};
    const handleConsultar=async(evento=null)=>{
        if(cargando.value||exportando.value)return;
        if(!empresa.value||!corte.value){error.value='Selecciona empresa y fecha de corte.';return;}
        const pagina=evento&&Number.isInteger(evento.first)?evento.first:0,cantidad=evento?.rows||limite.value;
        const parametros={company_id:empresa.value,corte:fechaLocal(corte.value),incluir_ceros:String(incluirCeros.value)};
        const turno=++consulta;cargando.value=true;error.value='';
        try{
            const r=await store.dispatch('api/apiGetTokenSinCargando',{direccion:ruta+'?'+new URLSearchParams({...parametros,offset:pagina,limite:cantidad})});
            if(!activo||turno!==consulta)return;if(r.estatus!==200)throw new Error(r.mensaje||'No fue posible consultar el balance general.');
            resultado.value=r.datos;filas.value=r.datos.filas||[];total.value=r.datos.total||0;primero.value=pagina;limite.value=cantidad;consultado=parametros;
        }catch(e){if(activo&&turno===consulta){handleLimpiarResultado();error.value=e.message;}}
        finally{if(activo&&turno===consulta)cargando.value=false;}
    };
    const handleExportar=async()=>{
        if(!consultado||cargando.value||exportando.value)return;exportando.value=true;
        try{
            const r=await store.dispatch('api/apiGetblobSinCargando',{direccion:ruta+'excel?'+new URLSearchParams(consultado)});
            if(!activo)return;if(r.estatus!==200)throw new Error(r.mensaje||'No fue posible exportar el balance general.');
            const url=URL.createObjectURL(r.data),a=document.createElement('a');a.href=url;a.download='Balance_general_'+consultado.corte+'.xlsx';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
        }catch(e){if(activo)toast.add({severity:'error',summary:'Balance general',detail:e.message,life:5000});}
        finally{if(activo)exportando.value=false;}
    };
    const handleLimpiar=()=>{if(cargando.value||exportando.value)return;empresa.value=null;incluirCeros.value=false;corte.value=new Date();handleLimpiarResultado();};
    onMounted(async()=>{cargando.value=true;try{const r=await store.dispatch('api/apiGetTokenSinCargando',{direccion:ruta});if(!activo)return;if(r.estatus!==200)throw new Error(r.mensaje);empresas.value=r.datos.empresas||[];}catch(e){if(activo)error.value=e.message;}finally{if(activo)cargando.value=false;}});
    onUnmounted(()=>{activo=false;consulta++;});
    return {empresas,empresa,corte,incluirCeros,cargando,exportando,error,mostrarAyuda,resultado,filas,total,primero,limite,handleMoneda,handleConsultar,handleLimpiar,handleLimpiarResultado,handleExportar};
}
