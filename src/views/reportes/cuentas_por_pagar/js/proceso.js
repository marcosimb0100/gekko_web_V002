import {ref,reactive,onMounted,onBeforeUnmount} from 'vue';
import {useStore} from 'vuex';
import {useToast} from 'primevue/usetoast';
const fecha=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
export default function proceso(){
    const store=useStore(),toast=useToast(),esPoliza=false;
    const ruta='/reportes/cartera/pagar';
    const empresas=ref([]),empresa=ref(null),desde=ref(new Date(new Date().getFullYear(),0,1)),hasta=ref(new Date());
    const direccion=ref('emitidas'),direcciones=[{label:'Emitidas',value:'emitidas'},{label:'Recibidas',value:'recibidas'}];
    const estados=[{label:'Todos los estados',value:'todos'},...(esPoliza?['Sin p\u00f3liza','Borrador','Anulada']:['Pendiente','Parcial','Pagado']).map(v=>({label:v,value:v}))];
    const estado=ref('todos'),buscar=ref(''),filas=ref([]),total=ref(0),primero=ref(0),limite=ref(50);
    const cargando=ref(false),exportando=ref(false),error=ref(''),mostrarAyuda=ref(false);
    const antiguedad=ref('todos'),resumen=ref({}),mostrarVencimiento=ref(false),guardando=ref(false);
    const edades=['Sin vencimiento','Por vencer','1–30 días','31–60 días','61–90 días','Más de 90 días','Pagado'];
    const opcionesEdad=[{label:'Todas las antigüedades',value:'todos'},{label:'Vence en siete días',value:'proximos'},...edades.map(value=>({label:value,value}))];
    const fuentes=[{label:'Complementos de pago vigentes',value:'complementos'},{label:'Aplicaciones bancarias',value:'banco'}];
    const formulario=reactive({uuid:'',revision:0,vencimiento:null,fuente:'complementos',dias:0,guardar_plazo:false,motivo:'',nombre:'',folio:''});
    let activo=true,consultado=null;
    const handleVencimiento=data=>{Object.assign(formulario,{uuid:data.uuid,revision:data.revision,vencimiento:data.vencimiento?new Date(data.vencimiento+'T12:00:00'):null,fuente:data.fuente,dias:data.dias_plazo||0,guardar_plazo:false,motivo:'',nombre:data.nombre,folio:data.folio,emision:data.fecha});mostrarVencimiento.value=true;};
    const handleProponer=()=>{const d=new Date(formulario.emision+'T12:00:00');d.setDate(d.getDate()+Number(formulario.dias||0));formulario.vencimiento=d;};
    const handleGuardarVencimiento=async()=>{
        if(guardando.value||!formulario.vencimiento||!formulario.motivo.trim())return;
        guardando.value=true;
        try{const r=await store.dispatch('api/apiPostToken',{direccion:ruta+'/vencimiento',datosJson:{company_id:empresa.value,uuid:formulario.uuid,revision:formulario.revision,vencimiento:fecha(formulario.vencimiento),fuente:formulario.fuente,dias:formulario.dias,guardar_plazo:formulario.guardar_plazo,motivo:formulario.motivo}});if(!activo)return;if(r.estatus!==200)throw new Error(r.mensaje||'No fue posible guardar.');mostrarVencimiento.value=false;toast.add({severity:'success',summary:'Cartera',detail:r.mensaje,life:4000});await handleConsultar();}
        catch(e){if(activo)toast.add({severity:'error',summary:'Cartera',detail:e.message,life:5000});}finally{if(activo)guardando.value=false;}
    };
    const handleImporte=(v,moneda)=>new Intl.NumberFormat('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v||0))+' '+moneda;
    const handleLimpiarResultado=()=>{filas.value=[];total.value=0;primero.value=0;consultado=null;resumen.value={};error.value='';};
    const handleLimpiar=()=>{buscar.value='';estado.value='todos';antiguedad.value='todos';handleLimpiarResultado();};
    const handlePeticion=async direccion=>{const r=await store.dispatch('api/apiGetTokenSinCargando',{direccion});if(r.estatus!==200)throw new Error(r.mensaje||'No fue posible consultar.');return r.datos;};
    const handleConsultar=async(evento=null)=>{
        if(cargando.value||exportando.value||!empresa.value)return;
        if(!desde.value||!hasta.value||desde.value>hasta.value){error.value='Revisa las fechas.';return;}
        const parametros={company_id:empresa.value,desde:fecha(desde.value),hasta:fecha(hasta.value),direccion:direccion.value,estado:estado.value,buscar:buscar.value,antiguedad:antiguedad.value};
        const offset=evento?.first||0,cantidad=evento?.rows||limite.value;cargando.value=true;error.value='';
        try{const d=await handlePeticion(ruta+'?'+new URLSearchParams({...parametros,offset,limite:cantidad}));if(!activo)return;resumen.value=d.resumen||{};filas.value=d.filas||[];total.value=d.total||0;primero.value=offset;limite.value=cantidad;consultado=parametros;}
        catch(e){if(activo){handleLimpiarResultado();error.value=e.message;}}
        finally{if(activo)cargando.value=false;}
    };
    const handleExportar=async()=>{
        if(!consultado||cargando.value||exportando.value)return;exportando.value=true;
        try{const r=await store.dispatch('api/apiGetblobSinCargando',{direccion:ruta+'/excel?'+new URLSearchParams(consultado)});if(!activo)return;if(r.estatus!==200)throw new Error(r.mensaje||'No fue posible exportar.');const url=URL.createObjectURL(r.data),a=document.createElement('a');a.href=url;a.download='pagar.xlsx';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
        catch(e){if(activo)toast.add({severity:'error',summary:'Reporte',detail:e.message,life:5000});}
        finally{if(activo)exportando.value=false;}
    };
    onMounted(async()=>{cargando.value=true;try{const d=await handlePeticion(ruta);if(activo)empresas.value=d.empresas||[];}catch(e){if(activo)error.value=e.message;}finally{if(activo)cargando.value=false;}});
    onBeforeUnmount(()=>{activo=false;});
    return {antiguedad,resumen,mostrarVencimiento,guardando,formulario,fuentes,opcionesEdad,handleVencimiento,handleProponer,handleGuardarVencimiento,esPoliza,empresas,empresa,desde,hasta,direccion,direcciones,estados,estado,buscar,filas,total,primero,limite,cargando,exportando,error,mostrarAyuda,handleImporte,handleConsultar,handleExportar,handleLimpiar,handleLimpiarResultado};
}
