import {ref,reactive,onBeforeUnmount} from 'vue';
import {useStore} from 'vuex';
import {useToast} from 'primevue/usetoast';
export default function proceso(props,emit){
    const store=useStore(),toast=useToast(),mostrar=ref(false),ocupado=ref(false),error=ref(''),vista=ref(null);
    const seleccion=reactive({configuracion:true,conceptos:true,impuestos:true,bancos:true});
    const opciones=[{campo:'configuracion',nombre:'Cuentas generales de la empresa'},{campo:'conceptos',nombre:'Conceptos de facturación'},{campo:'impuestos',nombre:'IVA y retenciones'},{campo:'bancos',nombre:'Subcuentas y vínculos bancarios'}];
    let activo=true;
    const handleLimpiar=()=>{vista.value=null;error.value='';};
    const handleAbrir=()=>{if(ocupado.value||props.disabled)return;handleLimpiar();mostrar.value=true;};
    const handleProcesar=async confirmar=>{
        if(ocupado.value||!props.empresa?.id)return;
        ocupado.value=true;error.value='';
        try{
            const r=await store.dispatch('api/apiPostToken',{direccion:'/contabilidad/cuentas/catalogo-base/'+(confirmar?'guardar':'validar'),datosJson:{company_id:props.empresa.id,...seleccion,...(confirmar?{huella:vista.value.huella}:{})}});
            if(!activo)return;
            if(r.estatus!==200)throw new Error(r.mensaje||'No fue posible cargar el catálogo.');
            if(confirmar){mostrar.value=false;toast.add({severity:'success',summary:'Cuentas contables',detail:r.mensaje,life:6000});emit('guardado');}
            else vista.value=r.datos;
        }catch(e){if(activo){error.value=e.message;vista.value=null;if(confirmar)emit('guardado');}}
        finally{if(activo)ocupado.value=false;}
    };
    const handleConsultar=()=>handleProcesar(false),handleGuardar=()=>{if(vista.value&&!vista.value.conflictos.length)handleProcesar(true);};
    onBeforeUnmount(()=>{activo=false;});
    return {mostrar,ocupado,error,vista,seleccion,opciones,handleAbrir,handleLimpiar,handleConsultar,handleGuardar};
}
