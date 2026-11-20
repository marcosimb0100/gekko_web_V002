import {ref,computed,onBeforeUnmount} from 'vue';
import {useStore} from 'vuex';
import {useToast} from 'primevue/usetoast';
export default function proceso(props,emit){
    const store=useStore(),toast=useToast(),mostrar=ref(false),ocupado=ref(false),error=ref(''),vista=ref(null),motivo=ref(''),mensaje=ref('');
    let activo=true;
    const puedeGuardar=computed(()=>!ocupado.value && !!vista.value?.carga_id && !vista.value.bloqueos.length && motivo.value.trim().length>=5);
    const handleProcesar=async confirmar=>{
        if(ocupado.value||!props.empresa?.id)return;
        ocupado.value=true;error.value='';
        try{
            const r=await store.dispatch('api/apiPostToken',{direccion:'/contabilidad/cuentas/catalogo-base/deshacer/'+(confirmar?'confirmar':'validar'),datosJson:{company_id:props.empresa.id,...(confirmar?{carga_id:vista.value.carga_id,huella:vista.value.huella,motivo:motivo.value.trim()}:{})}});
            if(!activo)return;
            if(r.estatus!==200)throw new Error(r.mensaje||'No fue posible revisar la carga.');
            mensaje.value=r.mensaje;
            if(confirmar){mostrar.value=false;toast.add({severity:'success',summary:'Cuentas contables',detail:r.mensaje,life:6000});emit('guardado');}
            else vista.value=r.datos;
        }catch(e){if(activo){error.value=e.message;vista.value=null;if(confirmar)emit('guardado');}}
        finally{if(activo)ocupado.value=false;}
    };
    const handleConsultar=()=>handleProcesar(false);
    const handleAbrir=()=>{if(ocupado.value||props.disabled)return;vista.value=null;motivo.value='';error.value='';mostrar.value=true;handleConsultar();};
    const handleGuardar=()=>{if(puedeGuardar.value)handleProcesar(true);};
    onBeforeUnmount(()=>{activo=false;});
    return {mostrar,ocupado,error,vista,motivo,mensaje,puedeGuardar,handleAbrir,handleConsultar,handleGuardar};
}
