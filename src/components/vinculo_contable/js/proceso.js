import {computed,onBeforeUnmount,ref} from 'vue';
import {useStore} from 'vuex';
import {useToast} from 'primevue/usetoast';

export default function proceso(props){
    const store=useStore(),toast=useToast();
    const mostrar=ref(false),cargando=ref(false),guardando=ref(false),error=ref('');
    const datos=ref(null),empresa=ref(null),cuenta=ref(null),tab=ref('cuenta');
    let activo=true,consulta=0;
    const ruta=computed(()=>(props.tipo==='banco'?'/companias/bancos/':'/efectivo/cajas/')+encodeURIComponent(props.registroId)+'/cuenta_contable');
    const empresaActiva=computed(()=>datos.value?.empresas?.some(e=>e.id===empresa.value&&e.activo));
    const valido=computed(()=>!!datos.value&&datos.value.contabilidad_habilitada===true&&empresaActiva.value&&!cargando.value&&!guardando.value&&
        cuenta.value!==datos.value.cuenta_id&&(!cuenta.value||datos.value.cuentas.some(c=>c.id===cuenta.value)));
    const handleFecha=v=>v?new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(v)):'';
    const handleCargar=async()=>{
        if(guardando.value)return;
        const actual=++consulta;cargando.value=true;error.value='';datos.value=null;
        try{
            const q=empresa.value?'?company_id='+encodeURIComponent(empresa.value):'';
            const r=await store.dispatch('api/apiGetTokenSinCargando',{direccion:ruta.value+q});
            if(!activo||actual!==consulta)return;
            if(r.estatus!==200)throw new Error(r.mensaje);
            datos.value=r.datos;empresa.value=r.datos.company_id;cuenta.value=r.datos.cuenta_id||null;
        }catch(e){if(activo&&actual===consulta)error.value=e.message||'No fue posible consultar el vínculo.';}
        finally{if(activo&&actual===consulta)cargando.value=false;}
    };
    const handleAbrir=()=>{if(!props.registroId)return;empresa.value=null;cuenta.value=null;tab.value='cuenta';mostrar.value=true;handleCargar();};
    const handleGuardar=async()=>{
        if(!valido.value)return;guardando.value=true;error.value='';
        try{
            const r=await store.dispatch('api/apiPutToken',{direccion:ruta.value,datosJson:{company_id:empresa.value,cuenta_id:cuenta.value,revision:datos.value.revision}});
            if(!activo)return;
            if(r.estatus!==200)throw new Error(r.mensaje);
            toast.add({severity:'success',summary:'Cuenta contable',detail:r.mensaje,life:4000});
        }catch(e){if(activo){error.value=e.message||'No fue posible guardar el vínculo.';return;}}
        finally{if(activo)guardando.value=false;}
        if(activo)await handleCargar();
    };
    onBeforeUnmount(()=>{activo=false;consulta++;});
    return {mostrar,cargando,guardando,error,datos,empresa,cuenta,tab,valido,handleFecha,handleAbrir,handleCargar,handleGuardar};
}
