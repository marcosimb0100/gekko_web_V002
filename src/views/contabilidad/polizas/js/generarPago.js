import { ref, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
const ruta='/contabilidad/polizas/desde_pagos';
export default function proceso(props) {
    const store=useStore(),toast=useToast(),mostrar=ref(false),ocupado=ref(false),datos=ref({}),error=ref('');
    let activo=true,origen='';
    onUnmounted(()=>{activo=false;});
    const handleMoneda=v=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(v||0));
    const handleAbrir=async()=>{
        if(ocupado.value||props.disabled)return;
        origen=props.conciliacionId;mostrar.value=true;ocupado.value=true;datos.value={};error.value='';
        try {
            const r=await store.dispatch('api/apiGetTokenSinCargando',{direccion:ruta+'/'+encodeURIComponent(origen)});
            if(r.estatus!==200)throw new Error(r.mensaje);
            if(activo)datos.value=r.datos||{};
        } catch(e){if(activo)error.value=e.message||'No fue posible revisar el pago.';}
        finally{if(activo)ocupado.value=false;}
    };
    const handleGenerar=async()=>{
        if(ocupado.value||!datos.value.huella||datos.value.existente)return;
        ocupado.value=true;error.value='';
        try {
            const r=await store.dispatch('api/apiPostToken',{direccion:ruta,datosJson:{conciliacion_id:origen,huella:datos.value.huella}});
            if(r.estatus!==200)throw new Error(r.mensaje);
            if(activo){datos.value={existente:true,folio:r.datos?.folio,estado:r.datos?.estado||'borrador'};toast.add({severity:'success',summary:'Póliza de pago',detail:r.mensaje,life:5000});}
        } catch(e){if(activo){error.value=e.message||'No fue posible generar el borrador.';datos.value={};}}
        finally{if(activo)ocupado.value=false;}
    };
    return {mostrar,ocupado,datos,error,handleMoneda,handleAbrir,handleGenerar};
}
