import {computed,onBeforeUnmount,ref} from 'vue';
import {useStore} from 'vuex';
import {useToast} from 'primevue/usetoast';

export default function proceso(props){
    const store=useStore(),toast=useToast();
    const mostrar=ref(false),mostrarAyuda=ref(false),cargando=ref(false),guardando=ref(false),error=ref('');
    const datos=ref(null),empresa=ref(null),cuentas=ref({}),tab=ref('cuentas');
    let activo=true,consulta=0;
    const ruta=computed(()=>(props.tipo==='concepto'?'/companias/conceptos/':'/impuestos/')+encodeURIComponent(props.registroId)+'/cuentas_contables');
    const habilitada=computed(()=>!!datos.value?.contabilidad_habilitada&&datos.value.empresas.some(e=>e.id===empresa.value&&e.activo));
    const modificable=computed(()=>habilitada.value&&datos.value.origen.activo&&!datos.value.origen.exento&&!guardando.value&&!cargando.value);
    const handleOpciones=tipo=>datos.value?.opciones.filter(c=>c.tipo===tipo)||[];
    const hayCambios=computed(()=>!!datos.value&&(datos.value.definicion_modificada||datos.value.origen.campos.some(c=>cuentas.value[c.campo]!==datos.value.cuentas[c.campo])));
    const valido=computed(()=>habilitada.value&&hayCambios.value&&!guardando.value&&!cargando.value&&datos.value.origen.campos.every(c=>{
        const valor=cuentas.value[c.campo];
        return valor===null||(datos.value.origen.activo&&!datos.value.origen.exento&&handleOpciones(c.tipo).some(a=>a.id===valor));
    }));
    const handleFecha=v=>v?new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(v)):'';
    const handleCargar=async()=>{
        if(guardando.value)return;
        const actual=++consulta;cargando.value=true;error.value='';datos.value=null;
        try{
            const q=empresa.value?'?company_id='+encodeURIComponent(empresa.value):'';
            const r=await store.dispatch('api/apiGetTokenSinCargando',{direccion:ruta.value+q});
            if(!activo||actual!==consulta)return;
            if(r.estatus!==200)throw new Error(r.mensaje);
            datos.value=r.datos;empresa.value=r.datos.company_id;cuentas.value={...r.datos.cuentas};
        }catch(e){if(activo&&actual===consulta)error.value=e.message||'No fue posible consultar las cuentas contables.';}
        finally{if(activo&&actual===consulta)cargando.value=false;}
    };
    const handleAbrir=()=>{if(!props.registroId)return;empresa.value=null;cuentas.value={};tab.value='cuentas';mostrar.value=true;handleCargar();};
    const handleRetirar=()=>{if(!habilitada.value||guardando.value)return;cuentas.value=Object.fromEntries(datos.value.origen.campos.map(c=>[c.campo,null]));};
    const handleGuardar=async()=>{
        if(!valido.value)return;guardando.value=true;error.value='';
        try{
            const r=await store.dispatch('api/apiPutToken',{direccion:ruta.value,datosJson:{company_id:empresa.value,revision:datos.value.revision,cuentas:{...cuentas.value}}});
            if(!activo)return;
            if(r.estatus!==200)throw new Error(r.mensaje);
            toast.add({severity:'success',summary:'Cuentas contables',detail:r.mensaje,life:4500});
        }catch(e){if(activo){error.value=e.message||'No fue posible guardar la asignación.';return;}}
        finally{if(activo)guardando.value=false;}
        if(activo)await handleCargar();
    };
    onBeforeUnmount(()=>{activo=false;consulta++;});
    return {mostrar,mostrarAyuda,cargando,guardando,error,datos,empresa,cuentas,tab,habilitada,modificable,valido,
        handleOpciones,handleFecha,handleAbrir,handleRetirar,handleCargar,handleGuardar};
}
