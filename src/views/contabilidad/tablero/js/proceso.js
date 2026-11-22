import {ref,computed,onMounted,onBeforeUnmount,watch} from 'vue';
import {useStore} from 'vuex';
import {useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
const fecha=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const vacio=()=>({cfdi:[],bancos:[],cuentas:[],borradores:[]});
export default function proceso(){
    const store=useStore(),router=useRouter(),toast=useToast();
    const empresas=ref([]),empresa=ref(null),desde=ref(new Date(new Date().getFullYear(),new Date().getMonth(),1)),hasta=ref(new Date());
    const grupos=ref(vacio()),cargando=ref(false),consultado=ref(false),ayuda=ref(false),seleccion=ref('cfdi'),buscar=ref(''),primero=ref(0);
    const opciones=[{clave:'cfdi',nombre:'CFDI sin contabilizar',icono:'pi pi-file'},{clave:'bancos',nombre:'Bancos por conciliar',icono:'pi pi-link'},{clave:'cuentas',nombre:'Cuentas por asignar',icono:'pi pi-sitemap'},{clave:'borradores',nombre:'Pólizas en borrador',icono:'pi pi-pencil'}];
    const titulo=computed(()=>opciones.find(o=>o.clave===seleccion.value).nombre);
    const filas=computed(()=>grupos.value[seleccion.value].filter(d=>Object.values(d).join(' ').toLocaleLowerCase().includes(buscar.value.trim().toLocaleLowerCase())));
    const handleAviso=(severity,detail)=>toast.add({severity,summary:'Tablero contable',detail,life:6000});
    let activo=true;
    const handleLimpiar=()=>{grupos.value=vacio();consultado.value=false;primero.value=0;};
    const handleSeleccionar=clave=>{seleccion.value=clave;buscar.value='';primero.value=0;};
    const handlePeticion=async direccion=>{const r=await store.dispatch('api/apiGetTokenSinCargando',{direccion});if(r.estatus!==200)throw new Error(r.mensaje||'No fue posible consultar.');return r.datos;};
    const handleConsultar=async()=>{
        if(cargando.value||!empresa.value)return;
        if(!desde.value||!hasta.value||desde.value>hasta.value){handleAviso('warn','Revisa las fechas.');return;}
        cargando.value=true;handleLimpiar();
        try{const d=await handlePeticion('/contabilidad/tablero/?'+new URLSearchParams({company_id:empresa.value,desde:fecha(desde.value),hasta:fecha(hasta.value)}));if(activo){grupos.value=d.grupos;if(!d.habilitada)handleAviso('warn','La integraci\u00f3n contable de esta empresa est\u00e1 desactivada.');consultado.value=true;}}
        catch(e){if(activo)handleAviso('error',e.message);}finally{if(activo)cargando.value=false;}
    };
    const handleAbrir=data=>router.push({path:data.ruta});
    watch(buscar,()=>{primero.value=0;});
    onMounted(async()=>{cargando.value=true;try{const d=await handlePeticion('/contabilidad/tablero/');if(activo)empresas.value=d.empresas||[];}catch(e){if(activo)handleAviso('error',e.message);}finally{if(activo)cargando.value=false;}});
    onBeforeUnmount(()=>{activo=false;});
    return {empresas,empresa,desde,hasta,grupos,cargando,consultado,ayuda,seleccion,buscar,primero,opciones,titulo,filas,handleLimpiar,handleSeleccionar,handleConsultar,handleAbrir};
}
