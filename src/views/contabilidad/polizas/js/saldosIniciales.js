import {computed,onBeforeUnmount,ref} from 'vue';
import {useStore} from 'vuex';
import {useToast} from 'primevue/usetoast';
const partida=()=>({cuenta_id:null,cargo:0,abono:0});
const centavos=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<1e12?Math.round(v*100):null;
export default function proceso(props,emit){
    const store=useStore(),toast=useToast(),mostrar=ref(false),ocupado=ref(false),error=ref(''),datos=ref(null),partidas=ref([]);
    let activo=true,operacion='';
    const totales=computed(()=>{const cargos=partidas.value.reduce((n,p)=>n+(centavos(p.cargo)||0),0),abonos=partidas.value.reduce((n,p)=>n+(centavos(p.abono)||0),0);return {cargos,abonos,diferencia:cargos-abonos};});
    const valido=computed(()=>datos.value?.habilitada&&datos.value.periodo_abierto&&!datos.value.existente&&partidas.value.length>=2&&partidas.value.length<=200&&totales.value.cargos>0&&!totales.value.diferencia&&new Set(partidas.value.map(p=>p.cuenta_id)).size===partidas.value.length&&partidas.value.every(p=>datos.value.cuentas.some(c=>c.id===p.cuenta_id)&&centavos(p.cargo)!==null&&centavos(p.abono)!==null&&((p.cargo>0&&p.abono===0)||(p.abono>0&&p.cargo===0))));
    const handleMoneda=v=>(v/100).toLocaleString('es-MX',{style:'currency',currency:'MXN'});
    const handleAbrir=async()=>{
        if(ocupado.value||props.disabled)return;
        mostrar.value=true;ocupado.value=true;error.value='';datos.value=null;partidas.value=[partida(),partida()];operacion=crypto.randomUUID();
        try{const r=await store.dispatch('api/apiGetTokenSinCargando',{direccion:'/contabilidad/polizas/saldos_iniciales?company_id='+encodeURIComponent(props.empresa.id)});if(!activo)return;if(r.estatus!==200)throw new Error(r.mensaje);datos.value=r.datos;}
        catch(e){if(activo)error.value=e.message||'No fue posible consultar la apertura.';}
        finally{if(activo)ocupado.value=false;}
    };
    const handleAgregar=()=>{if(!ocupado.value&&partidas.value.length<200)partidas.value.push(partida());};
    const handleQuitar=i=>{if(!ocupado.value&&partidas.value.length>2)partidas.value.splice(i,1);};
    const handleExistente=()=>{mostrar.value=false;emit('abrir',datos.value.existente);};
    const handleGuardar=async()=>{
        if(ocupado.value||!valido.value)return;
        ocupado.value=true;error.value='';
        try{
            const r=await store.dispatch('api/apiPostToken',{direccion:'/contabilidad/polizas/saldos_iniciales',datosJson:{company_id:props.empresa.id,fecha:datos.value.fecha,operacion_id:operacion,partidas:partidas.value.map(p=>({cuenta_id:p.cuenta_id,concepto:'SALDO INICIAL',cargo:(centavos(p.cargo)/100).toFixed(2),abono:(centavos(p.abono)/100).toFixed(2)}))}});
            if(!activo)return;if(r.estatus!==200)throw new Error(r.mensaje);
            mostrar.value=false;toast.add({severity:'success',summary:'Saldos iniciales',detail:r.mensaje,life:6000});emit('guardada');emit('abrir',{id:r.datos.id});
        }catch(e){if(activo)error.value=e.message||'No fue posible guardar la apertura.';}
        finally{if(activo)ocupado.value=false;}
    };
    onBeforeUnmount(()=>{activo=false;});
    return {mostrar,ocupado,error,datos,partidas,totales,valido,handleAbrir,handleAgregar,handleQuitar,handleExistente,handleGuardar,handleMoneda};
}
