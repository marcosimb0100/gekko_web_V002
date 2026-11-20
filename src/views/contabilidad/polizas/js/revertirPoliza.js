import {computed,onBeforeUnmount,ref} from 'vue';
import {useStore} from 'vuex';
import {useToast} from 'primevue/usetoast';
export default function proceso(props,emit){
    const store=useStore(),toast=useToast();
    const mostrar=ref(false),ocupado=ref(false),fecha=ref(new Date()),motivo=ref(''),error=ref('');
    let activo=true,operacion='';
    const fechaMinima=computed(()=>new Date(props.poliza.fecha.getFullYear(),props.poliza.fecha.getMonth(),props.poliza.fecha.getDate()));
    const handleISO=d=>d instanceof Date&&!isNaN(d)?[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'):'';
    const valido=computed(()=>!!handleISO(fecha.value)&&fecha.value>=fechaMinima.value&&motivo.value.trim().length>=5&&motivo.value.length<=500);
    const handleAbrir=()=>{if(props.disabled||ocupado.value)return;fecha.value=new Date();if(fecha.value<fechaMinima.value)fecha.value=new Date(fechaMinima.value);motivo.value='';error.value='';operacion=crypto.randomUUID();mostrar.value=true;};
    const handleRevertir=async()=>{
        if(ocupado.value||!valido.value)return;ocupado.value=true;error.value='';
        try{
            const r=await store.dispatch('api/apiPostToken',{direccion:'/contabilidad/polizas/'+props.poliza.id+'/revertir',datosJson:{revision:props.poliza.revision,operacion_id:operacion,fecha:handleISO(fecha.value),motivo:motivo.value.trim()}});
            if(!activo)return;if(r.estatus!==200)throw new Error(r.mensaje);
            mostrar.value=false;toast.add({severity:'success',summary:'Reversión contable',detail:(r.datos.folio||'')+'. '+r.mensaje,life:6000});emit('revertida');
        }catch(e){if(activo)error.value=e.message||'No fue posible confirmar la reversión. Puedes reintentar para verificar su resultado.';}
        finally{if(activo)ocupado.value=false;}
    };
    onBeforeUnmount(()=>{activo=false;});
    return {mostrar,ocupado,fecha,motivo,error,fechaMinima,valido,handleAbrir,handleRevertir};
}
