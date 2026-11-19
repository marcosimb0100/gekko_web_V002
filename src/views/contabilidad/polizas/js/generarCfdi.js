import { ref, onUnmounted } from 'vue';
import { useStore } from 'vuex';

const ruta='/contabilidad/polizas/desde_cfdi';
const handleFecha = d => d instanceof Date && !isNaN(d) ? d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0') : '';
export default function proceso(emit) {
    const store=useStore(), mostrar=ref(false), ocupado=ref(false), confirmar=ref(false), vista=ref(null);
    const empresas=ref([]), empresa=ref(null), desde=ref(new Date(new Date().getFullYear(),new Date().getMonth(),1)), hasta=ref(new Date());
    const filas=ref([]), seleccion=ref([]), offset=ref(0), total=ref(0), error=ref(''), resultado=ref('');
    let activo=true;
    onUnmounted(()=>{activo=false;});
    const handleMoneda = v => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(v));
    const handleLimpiar = () => {filas.value=[];seleccion.value=[];offset.value=0;total.value=0;error.value='';resultado.value='';};
    const handleAbrir = async () => {
        mostrar.value=true;ocupado.value=true;error.value='';
        try {
            const r=await store.dispatch('api/apiGetTokenSinCargando',{direccion:ruta});
            if(r.estatus!==200)throw new Error(r.mensaje);
            if(activo)empresas.value=r.datos.empresas||[];
        } catch(e){if(activo)error.value=e.message||'No fue posible consultar empresas.';}
        finally {if(activo)ocupado.value=false;}
    };
    const handleConsultar = async (primero=0) => {
        if(ocupado.value)return;
        ocupado.value=true;error.value='';seleccion.value=[];filas.value=[];
        try {
            if(!empresa.value || !handleFecha(desde.value)||!handleFecha(hasta.value)||desde.value>hasta.value)throw new Error('Selecciona empresa y fechas válidas.');
            const q=new URLSearchParams({company_id:empresa.value,desde:handleFecha(desde.value),hasta:handleFecha(hasta.value),offset:String(primero)});
            const r=await store.dispatch('api/apiGetTokenSinCargando',{direccion:ruta+'?'+q});
            if(r.estatus!==200)throw new Error(r.mensaje);
            if(activo){filas.value=r.datos.facturas||[];total.value=r.datos.total||0;offset.value=primero;}
        } catch(e){if(activo){total.value=0;error.value=e.message||'No fue posible consultar facturas.';}}
        finally {if(activo)ocupado.value=false;}
    };
    const handleGenerar = async () => {
        if(ocupado.value)return;
        confirmar.value=false;ocupado.value=true;error.value='';resultado.value='';
        let generadas=0;
        try {
            const elegidas=filas.value.filter(f=>f.generable&&seleccion.value.includes(f.solicitud_id));
            for(const fila of elegidas) {
                if(!activo)break;
                const r=await store.dispatch('api/apiPostToken',{direccion:ruta,datosJson:{company_id:empresa.value,solicitud_id:fila.solicitud_id,huella:fila.huella}});
                if(r.estatus!==200)throw new Error((fila.serie_folio||'Factura')+': '+(r.mensaje||'No fue posible generar.'));
                generadas++;fila.generable=false;fila.motivo=r.mensaje;seleccion.value=seleccion.value.filter(id=>id!==fila.solicitud_id);
            }
        } catch(e){if(activo)error.value=e.message||'No fue posible generar los borradores.';}
        finally {
            if(activo){ocupado.value=false;resultado.value=generadas ? generadas+' borrador(es) disponibles en Pólizas. Los saldos aún no cambian.' : '';if(generadas)emit('generadas');}
        }
    };
    return {mostrar,ocupado,confirmar,vista,empresas,empresa,desde,hasta,filas,seleccion,offset,total,error,resultado,handleAbrir,handleConsultar,handleLimpiar,handleGenerar,handleMoneda};
}
