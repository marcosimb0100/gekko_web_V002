import {computed,onBeforeUnmount,reactive,ref,watch} from 'vue';
import {useStore} from 'vuex';
import {useToast} from 'primevue/usetoast';

const inicial=()=>({revision:0,habilitada:false,fecha_inicio:null,modo:'borrador',clientes:null,proveedores:null,ventas:null,iva_trasladado:null,iva_acreditable:null,retenciones_por_pagar:null,retenciones_a_favor:null});
export default function proceso(props,emit){
    const store=useStore(),toast=useToast(),configuracion=reactive(inicial());
    const cuentas=ref([]),cargando=ref(false),guardando=ref(false),error=ref(''),cargada=ref(false);
    const fechaInicio=ref(null),mostrarAyuda=ref(false),versionGuardada=ref('');
    let consulta=0,activo=true;
    const campos=[
        {campo:'clientes',nombre:'Clientes por cobrar',tipo:'activo',requerido:true},
        {campo:'proveedores',nombre:'Proveedores por pagar',tipo:'pasivo',requerido:true},
        {campo:'ventas',nombre:'Ventas e ingresos',tipo:'ingresos',requerido:true},
        {campo:'iva_trasladado',nombre:'IVA trasladado',tipo:'pasivo'},
        {campo:'iva_acreditable',nombre:'IVA acreditable',tipo:'activo'},
        {campo:'retenciones_por_pagar',nombre:'Retenciones por pagar',tipo:'pasivo'},
        {campo:'retenciones_a_favor',nombre:'Retenciones a favor',tipo:'activo'}
    ];
    const handleCuentas=tipo=>cuentas.value.filter(c=>c.tipo===tipo);
    const valido=computed(()=>cargada.value&&!cargando.value&&!guardando.value&&hayCambios.value&&
        (!configuracion.habilitada||(fechaInicio.value&&configuracion.clientes&&configuracion.proveedores&&configuracion.ventas)));
    const handleFecha=d=>d?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'):null;
    const handleVersion=()=>JSON.stringify({...configuracion,fecha_inicio:handleFecha(fechaInicio.value)});
    const hayCambios=computed(()=>handleVersion()!==versionGuardada.value);
    const handleAsignar=datos=>{
        Object.assign(configuracion,inicial(),datos);
        fechaInicio.value=configuracion.fecha_inicio?new Date(configuracion.fecha_inicio+'T12:00:00'):null;
        versionGuardada.value=handleVersion();
    };
    const handleCargar=async()=>{
        if(guardando.value)return;
        const actual=++consulta;error.value='';cargada.value=false;handleAsignar({});cuentas.value=[];
        if(!props.empresaId){cargando.value=false;return;}
        cargando.value=true;
        try{
            const r=await store.dispatch('api/apiGetTokenSinCargando',{direccion:'/companias/'+props.empresaId+'/configuracion_contable'});
            if(!activo||consulta!==actual)return;
            if(r.estatus!==200)throw new Error(r.mensaje);
            handleAsignar(r.datos.configuracion);cuentas.value=r.datos.cuentas||[];cargada.value=true;
        }catch(e){if(activo&&consulta===actual)error.value=e.message||'No fue posible consultar la configuración.';}
        finally{if(activo&&consulta===actual)cargando.value=false;}
    };
    const handleGuardar=async()=>{
        if(!valido.value)return;
        const empresa=props.empresaId;guardando.value=true;error.value='';
        try{
            const r=await store.dispatch('api/apiPutToken',{direccion:'/companias/'+empresa+'/configuracion_contable',datosJson:{...configuracion,fecha_inicio:handleFecha(fechaInicio.value)}});
            if(!activo||empresa!==props.empresaId)return;
            if(r.estatus!==200)throw new Error(r.mensaje);
            handleAsignar(r.datos.configuracion);emit('guardado');toast.add({severity:'success',summary:'Configuración contable',detail:r.mensaje,life:5000});
        }catch(e){if(activo&&empresa===props.empresaId)error.value=e.message||'No fue posible guardar la configuración.';}
        finally{if(activo){guardando.value=false;if(empresa!==props.empresaId)handleCargar();}}
    };
    watch(()=>props.empresaId,handleCargar,{immediate:true});onBeforeUnmount(()=>{activo=false;consulta++;});
    return {configuracion,cuentas,cargando,guardando,error,cargada,fechaInicio,mostrarAyuda,campos,valido,handleCuentas,handleCargar,handleGuardar};
}
