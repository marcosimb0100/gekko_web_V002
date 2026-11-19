import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
const ruta='/contabilidad/polizas/recibidas';
const handleFecha=d=>d instanceof Date&&!isNaN(d)?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'):'';
export default function proceso(emit){
    const store=useStore(),toast=useToast();
    const empresa=ref(null),empresas=ref([]),desde=ref(new Date(new Date().getFullYear(),new Date().getMonth(),1)),hasta=ref(new Date());
    const filas=ref([]),total=ref(0),offset=ref(0),detalle=ref(null),sugerida=ref(null),vista=ref(null),error=ref(''),resultado=ref(''),ocupado=ref(false);
    let activo=true,cfdiId='',companyId='';
    const handleOcupado=v=>{ocupado.value=v;emit('ocupado',v);};
    const handleMoneda=v=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(v||0));
    const completo=computed(()=>!!detalle.value?.conceptos?.length&&detalle.value.conceptos.every(c=>c.cuenta_id));
    const handleInvalidar=()=>{vista.value=null;error.value='';};
    const handleLimpiar=()=>{filas.value=[];total.value=0;offset.value=0;error.value='';};
    const handlePeticion=async(action,direccion,datosJson)=>{
        const r=await store.dispatch(action,{direccion,...(datosJson?{datosJson}:{})});
        if(r.estatus!==200)throw new Error(r.mensaje||'No fue posible completar la operación.');
        return r;
    };
    const handleConsultar=async(first=0)=>{
        if(ocupado.value)return;handleOcupado(true);error.value='';filas.value=[];
        try{
            if(!empresa.value||!handleFecha(desde.value)||!handleFecha(hasta.value)||desde.value>hasta.value)throw new Error('Revisa empresa y fechas.');
            const q=new URLSearchParams({company_id:empresa.value,desde:handleFecha(desde.value),hasta:handleFecha(hasta.value),offset:String(first)});
            const r=await handlePeticion('api/apiGetTokenSinCargando',ruta+'?'+q);
            if(activo){filas.value=r.datos.facturas||[];total.value=r.datos.total||0;offset.value=first;}
        }catch(e){if(activo){error.value=e.message;total.value=0;}}finally{if(activo)handleOcupado(false);}
    };
    const handleDetalle=async(f)=>{
        if(ocupado.value||!f.disponible)return;handleOcupado(true);error.value='';vista.value=null;resultado.value='';
        cfdiId=f.id;companyId=empresa.value;
        try{const r=await handlePeticion('api/apiGetTokenSinCargando',ruta+'/'+encodeURIComponent(cfdiId)+'?company_id='+encodeURIComponent(companyId));if(activo){detalle.value=r.datos;sugerida.value=r.datos.cuenta_sugerida;}}
        catch(e){if(activo)error.value=e.message;}finally{if(activo)handleOcupado(false);}
    };
    const handlePayload=()=>({company_id:companyId,cfdi_id:cfdiId,cuentas:detalle.value.conceptos.map(c=>({partida:c.partida,cuenta_id:c.cuenta_id}))});
    const handleAplicar=()=>{if(ocupado.value||!sugerida.value)return;detalle.value.conceptos.forEach(c=>{c.cuenta_id=sugerida.value;});handleInvalidar();};
    const handleSugerencia=async()=>{
        if(ocupado.value||!detalle.value)return;handleOcupado(true);error.value='';
        try{const r=await handlePeticion('api/apiPutToken',ruta+'/sugerencia',{company_id:companyId,proveedor_id:detalle.value.proveedor_id,revision:detalle.value.revision_sugerencia,cuenta_id:sugerida.value});if(activo){detalle.value.revision_sugerencia=r.datos.revision;toast.add({severity:'success',summary:'Proveedor',detail:r.mensaje,life:4000});}}
        catch(e){if(activo)error.value=e.message;}finally{if(activo)handleOcupado(false);}
    };
    const handleRevisar=async()=>{
        if(ocupado.value||!completo.value)return;handleOcupado(true);vista.value=null;error.value='';
        try{const r=await handlePeticion('api/apiPostToken',ruta+'/previsualizar',handlePayload());if(activo)vista.value=r.datos;}
        catch(e){if(activo)error.value=e.message;}finally{if(activo)handleOcupado(false);}
    };
    const handleGenerar=async()=>{
        if(ocupado.value||!vista.value?.huella)return;handleOcupado(true);error.value='';
        try{const r=await handlePeticion('api/apiPostToken',ruta+'/generar',{...handlePayload(),huella:vista.value.huella});if(activo){resultado.value=r.mensaje+' '+(r.datos.folio||'');vista.value=null;emit('generadas');}}
        catch(e){if(activo){error.value=e.message;vista.value=null;}}finally{if(activo)handleOcupado(false);}
    };
    const handleVolver=()=>{if(ocupado.value)return;detalle.value=null;vista.value=null;resultado.value='';handleConsultar(offset.value);};
    onMounted(async()=>{handleOcupado(true);try{const r=await handlePeticion('api/apiGetTokenSinCargando',ruta);if(activo)empresas.value=r.datos.empresas||[];}catch(e){if(activo)error.value=e.message;}finally{if(activo)handleOcupado(false);}});
    onUnmounted(()=>{activo=false;emit('ocupado',false);});
    return{empresa,empresas,desde,hasta,filas,total,offset,detalle,sugerida,vista,error,resultado,ocupado,completo,handleMoneda,handleConsultar,handleLimpiar,handleDetalle,handleInvalidar,handleAplicar,handleSugerencia,handleRevisar,handleGenerar,handleVolver};
}
