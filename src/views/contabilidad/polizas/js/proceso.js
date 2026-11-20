import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';

const ruta = '/contabilidad/polizas/';
const tipos = [{nombre:'Ingreso',valor:'ingreso'},{nombre:'Egreso',valor:'egreso'},{nombre:'Diario',valor:'diario'}];
const partida = () => ({cuenta_id:null,concepto:'',cargo:0,abono:0});
const inicial = () => ({id:null,company_id:'',revision:null,folio:'',fecha:new Date(),tipo:'diario',concepto:'',referencia:'',estado:'borrador',partidas:[partida(),partida()]});
const handleFechaISO = fecha => {
    if (!(fecha instanceof Date) || isNaN(fecha)) return '';
    return fecha.getFullYear() + '-' + String(fecha.getMonth()+1).padStart(2,'0') + '-' + String(fecha.getDate()).padStart(2,'0');
};
const handleFechaLocal = valor => { const [y,m,d] = valor.split('-').map(Number); return new Date(y,m-1,d); };
const handleCentavos = valor => typeof valor === 'number' && Number.isFinite(valor) && valor >= 0 && valor < 1e12 ? Math.round(valor*100) : null;

export default function proceso() {
    const store = useStore(), toast = useToast();
    const empresas = ref([]), empresa = ref(null), cuentas = ref([]), registros = ref([]), historial = ref([]);
    const desde = ref(new Date(new Date().getFullYear(),new Date().getMonth(),1)), hasta = ref(new Date());
    const busqueda = ref(''), tipo = ref(null), estado = ref(null), primero = ref(0), tab = ref('datos');
    const cargando = ref(false), guardando = ref(false), mostrar = ref(false), mostrarAyuda = ref(false), mostrarCambios = ref(false), mostrarAnular = ref(false);
    const error = ref(''), errorFormulario = ref(''), errorAnular = ref(''), motivo = ref(''), cambios = ref([]);
    const formulario = reactive(inicial());
    const periodos=ref([]), periodoOrigen=ref(''), mostrarContabilizar=ref(false), errorContabilizar=ref('');
    const versionGuardada=ref(''); let operacionContabilizar='';
    let activo = true, consulta = 0, operacion = '', operacionAnular = '';
    const estados = [{nombre:'Borrador',valor:'borrador'},{nombre:'Contabilizada',valor:'contabilizada'},{nombre:'Anulada',valor:'anulada'}];
    const empresaActual = computed(() => empresas.value.find(e => e.id === empresa.value));
    const editable = computed(() => formulario.estado === 'borrador' && !!empresaActual.value?.activo && !guardando.value && (!formulario.id || periodoAnterior.value?.estado === 'abierto'));
    const handleNormalizar = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const handleTipo = v => tipos.find(t => t.valor === v)?.nombre || v;
    const handleMoneda = v => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(v || 0));
    const handleFechaHistorial = valor => {
        const d = new Date(valor);
        if (isNaN(d)) return '';
        const v = Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).map(p=>[p.type,p.value]));
        return v.year+'-'+v.month+'-'+v.day+' '+v.hour+':'+v.minute;
    };
    const filas = computed(() => registros.value.filter(r => (!tipo.value || tipo.value === r.tipo) && (!estado.value || estado.value === r.estado) &&
        handleNormalizar([r.folio,r.concepto,r.referencia].join(' ')).includes(handleNormalizar(busqueda.value))));
    const resumen = computed(() => [
        {nombre:'Pólizas del periodo',valor:registros.value.length,icono:'pi pi-book'},
        {nombre:'Contabilizadas',valor:registros.value.filter(r=>r.estado==='contabilizada').length,icono:'pi pi-check-circle'},
        {nombre:'Borradores',valor:registros.value.filter(r=>r.estado==='borrador').length,icono:'pi pi-pencil'},
        {nombre:'Anuladas',valor:registros.value.filter(r=>r.estado==='anulada').length,icono:'pi pi-ban'}
    ]);
    const opcionesCuentas = computed(() => {
        const lista = cuentas.value.map(c=>({...c,etiqueta:c.codigo+' · '+c.nombre}));
        for (const p of formulario.partidas) if (p.cuenta_id && !lista.some(c=>c.id===p.cuenta_id))
            lista.push({id:p.cuenta_id,etiqueta:(p.codigo || '')+' · '+(p.nombre || 'Cuenta no disponible')+' (no disponible)',noDisponible:true});
        return lista;
    });
    const totales = computed(() => {
        let cargos=0n,abonos=0n;
        for(const p of formulario.partidas) { cargos += BigInt(handleCentavos(p.cargo) ?? 0); abonos += BigInt(handleCentavos(p.abono) ?? 0); }
        return {cargos:Number(cargos)/100,abonos:Number(abonos)/100,diferencia:Number(cargos-abonos)/100,cuadrada:cargos===abonos};
    });
    const valido = computed(() => {
        if (!formulario.company_id || !handleFechaISO(formulario.fecha) || !formulario.concepto.trim() || formulario.concepto.length>300 || formulario.referencia.length>100 || !tipos.some(t=>t.valor===formulario.tipo)) return false;
        if(formulario.partidas.length<2 || formulario.partidas.length>200 || !totales.value.cuadrada) return false;
        return formulario.partidas.every(p => {
            const c=handleCentavos(p.cargo),a=handleCentavos(p.abono);
            return cuentas.value.some(c=>c.id===p.cuenta_id) && c!==null && a!==null && ((c>0 && a===0)||(a>0 && c===0)) && p.concepto.length<=300;
        });
    });

    const periodoActual = computed(() => {
        const fecha=handleFechaISO(formulario.fecha);
        return periodos.value.find(p=>p.anio===Number(fecha.slice(0,4))&&p.mes===Number(fecha.slice(5,7)));
    });
    const periodoAnterior = computed(() => periodos.value.find(p=>p.anio===Number(periodoOrigen.value.slice(0,4))&&p.mes===Number(periodoOrigen.value.slice(5,7))));
    const hayPeriodos = computed(() => periodos.value.some(p=>p.estado==='abierto'));
    const handleEstado = v => ({borrador:'Borrador',contabilizada:'Contabilizada',anulada:'Anulada'}[v]||v);
    const handleEstadoSeverity = v => ({borrador:'info',contabilizada:'success',anulada:'danger'}[v]||'secondary');
    const handleFirmaFormulario = () => JSON.stringify({fecha:handleFechaISO(formulario.fecha),tipo:formulario.tipo,concepto:formulario.concepto,referencia:formulario.referencia,partidas:formulario.partidas.map(p=>({cuenta_id:p.cuenta_id,concepto:p.concepto,cargo:handleCentavos(p.cargo),abono:handleCentavos(p.abono)}))});
    const hayCambios = computed(() => !!formulario.id && versionGuardada.value !== handleFirmaFormulario());
    const puedeContabilizar = computed(() => !!formulario.id && editable.value && valido.value && periodoActual.value?.estado==='abierto' && !hayCambios.value);
    const handleAbrirContabilizar = () => {
        if(!puedeContabilizar.value)return;
        errorContabilizar.value='';operacionContabilizar=crypto.randomUUID();mostrarContabilizar.value=true;
    };
    const handleContabilizar = async () => {
        if(!puedeContabilizar.value||guardando.value)return;
        guardando.value=true;errorContabilizar.value='';
        try{
            const r=await store.dispatch('api/apiPostToken',{direccion:ruta+formulario.id+'/contabilizar',datosJson:{revision:formulario.revision,operacion_id:operacionContabilizar}});
            if(!activo)return;
            if(r.estatus!==200)throw new Error(r.mensaje);
            mostrarContabilizar.value=false;mostrar.value=false;toast.add({severity:'success',summary:'Pólizas',detail:r.mensaje,life:5000});
        }catch(e){if(activo)errorContabilizar.value=e.message||'No fue posible contabilizar la póliza.';}
        finally{if(activo)guardando.value=false;}
        if(activo&&!mostrar.value)await handleCargar();
    };

    const handleCargar = async () => {
        if(guardando.value) return;
        const actual=++consulta; cargando.value=true;error.value='';
        try {
            let q='';
            if(empresa.value) {
                if(!handleFechaISO(desde.value)||!handleFechaISO(hasta.value)||desde.value>hasta.value) throw new Error('Revisa el periodo de consulta.');
                q='?company_id='+encodeURIComponent(empresa.value)+'&desde='+handleFechaISO(desde.value)+'&hasta='+handleFechaISO(hasta.value);
            }
            const r=await store.dispatch('api/apiGetTokenSinCargando',{direccion:ruta+q});
            if(!activo||actual!==consulta)return;
            if(r.estatus!==200)throw new Error(r.mensaje);
            empresas.value=r.datos.empresas||[];registros.value=r.datos.polizas||[];cuentas.value=r.datos.cuentas||[];periodos.value=r.datos.periodos||[];primero.value=0;
        } catch(e){if(activo&&actual===consulta){error.value=e.message||'No fue posible consultar las pólizas.';registros.value=[];cuentas.value=[];periodos.value=[];}}
        finally{if(activo&&actual===consulta)cargando.value=false;}
    };
    const handleLimpiar = () => {busqueda.value='';tipo.value=null;estado.value=null;primero.value=0;};
    const handleEmpresa = () => {registros.value=[];cuentas.value=[];periodos.value=[];handleLimpiar();handleCargar();};
    const handleNuevo = () => {
        if(cargando.value||!empresaActual.value?.activo||!hayPeriodos.value)return;
        Object.assign(formulario,inicial(),{company_id:empresa.value});
        if(!periodoActual.value || periodoActual.value.estado!=='abierto') { const p=periodos.value.filter(p=>p.estado==='abierto').sort((a,b)=>b.anio-a.anio||b.mes-a.mes)[0]; formulario.fecha=new Date(p.anio,p.mes-1,1); }
        periodoOrigen.value=''; versionGuardada.value='';
        historial.value=[];errorFormulario.value='';tab.value='datos';operacion=crypto.randomUUID();mostrar.value=true;
    };
    const handleEditar = async fila => {
        if(cargando.value||guardando.value)return;
        cargando.value=true;
        try {
            const r=await store.dispatch('api/apiGetTokenSinCargando',{direccion:ruta+fila.id});
            if(!activo)return;
            if(r.estatus!==200)throw new Error(r.mensaje);
            const p=r.datos.poliza;
            Object.assign(formulario,inicial(),p,{fecha:handleFechaLocal(p.fecha),partidas:p.partidas.map(d=>({...d,cargo:Number(d.cargo),abono:Number(d.abono)}))});
            periodos.value=r.datos.periodos||[];periodoOrigen.value=p.fecha.slice(0,7);versionGuardada.value=handleFirmaFormulario();
            historial.value=r.datos.historial||[];errorFormulario.value='';tab.value='datos';operacion=crypto.randomUUID();mostrar.value=true;
        }catch(e){if(activo)toast.add({severity:'error',summary:'Pólizas',detail:e.message,life:4500});}
        finally{if(activo)cargando.value=false;}
    };
    const handleAgregarPartida = () => {if(editable.value&&formulario.partidas.length<200)formulario.partidas.push(partida());};
    const handleQuitarPartida = indice => {if(editable.value&&formulario.partidas.length>2)formulario.partidas.splice(indice,1);};
    const handleCancelar = () => {if(!guardando.value)mostrar.value=false;};
    const handleGuardar = async () => {
        if(!valido.value||!editable.value||cargando.value||periodoActual.value?.estado!=='abierto')return;
        guardando.value=true;errorFormulario.value='';
        try {
            const datosJson={id:formulario.id,company_id:formulario.company_id,revision:formulario.revision,operacion_id:operacion,
                fecha:handleFechaISO(formulario.fecha),tipo:formulario.tipo,concepto:formulario.concepto,referencia:formulario.referencia,
                partidas:formulario.partidas.map(p=>({cuenta_id:p.cuenta_id,concepto:p.concepto,cargo:(handleCentavos(p.cargo)/100).toFixed(2),abono:(handleCentavos(p.abono)/100).toFixed(2)}))};
            const r=await store.dispatch(formulario.id?'api/apiPutToken':'api/apiPostToken',{direccion:ruta,datosJson});
            if(!activo)return;
            if(r.estatus!==200){if(r.estatus===400||r.estatus===409)operacion=crypto.randomUUID();throw new Error(r.mensaje);}
            if(formulario.fecha < desde.value || formulario.fecha > hasta.value) { desde.value=new Date(formulario.fecha.getFullYear(),formulario.fecha.getMonth(),1); hasta.value=new Date(formulario.fecha.getFullYear(),formulario.fecha.getMonth()+1,0); }
            mostrar.value=false;toast.add({severity:'success',summary:'Pólizas',detail:(r.datos.folio||'')+'. '+r.mensaje,life:5000});
        }catch(e){if(activo)errorFormulario.value=e.message||'No fue posible guardar la póliza.';}
        finally{if(activo)guardando.value=false;}
        if(activo&&!mostrar.value)await handleCargar();
    };
    const handleCambios = e => {cambios.value=e.cambios||[];mostrarCambios.value=true;};
    const handleAbrirAnular = () => {motivo.value='';errorAnular.value='';operacionAnular=crypto.randomUUID();mostrarAnular.value=true;};
    const handleAnular = async () => {
        if(guardando.value||motivo.value.trim().length<5||motivo.value.length>500)return;
        guardando.value=true;errorAnular.value='';
        try {
            const r=await store.dispatch('api/apiPostToken',{direccion:ruta+formulario.id+'/anular',datosJson:{revision:formulario.revision,motivo:motivo.value,operacion_id:operacionAnular}});
            if(!activo)return;
            if(r.estatus!==200)throw new Error(r.mensaje);
            mostrarAnular.value=false;mostrar.value=false;toast.add({severity:'success',summary:'Pólizas',detail:r.mensaje,life:4500});
        }catch(e){if(activo)errorAnular.value=e.message||'No fue posible anular el borrador.';}
        finally{if(activo)guardando.value=false;}
        if(activo&&!mostrar.value)await handleCargar();
    };
    const guia = [
        {titulo:'Revertir cobros y pagos',texto:'Abre la póliza contabilizada del cobro o pago y pulsa Revertir. Indica fecha en un periodo abierto y motivo. Se contabiliza una contrapartida completa, incluidos impuestos, y se retira la conciliación para corregirla. El banco conserva su movimiento original. Con impuestos, primero revierte o anula los abonos posteriores. El original queda identificado como Revertida; la contrapartida no puede revertirse nuevamente. Esta opción no cancela facturas ante el SAT.'},
        {titulo:'Facturas recibidas',texto:'En Generar desde CFDI elige Recibidas, empresa y fechas. Abre Asignar y elige la cuenta contable de cada concepto: gasto, costo o activo. Puedes guardar una cuenta sugerida por proveedor y empresa; Aplicar a conceptos la copia a esta factura y después puedes ajustar cada renglón. Revisa las partidas e impuestos y genera el borrador. Solo incluye CFDI 4.0 de ingreso vigentes en MXN, con proveedor activo y datos completos. No registra pagos ni genera pólizas de egreso. El borrador conserva las partidas de su origen; puedes contabilizarlo o anularlo. La cuenta sugerida no determina por sí sola el tratamiento fiscal del gasto o impuesto.'},
        {titulo:'Pólizas de cobros bancarios',texto:'En Conciliación CFDI Bancaria, elige Emitidas / Cobros y abre el detalle de las aplicaciones de la factura. El botón Póliza de cobro muestra las partidas y genera un borrador por el importe aplicado. Requiere acceso a Pólizas, la venta contabilizada, un periodo abierto y la cuenta contable del banco. Se conservan las parcialidades sin registrar otro depósito. Antes de desconciliar debes anular el borrador; una póliza contabilizada requiere usar Revertir desde el detalle de la póliza.'},
        {titulo:'Facturas emitidas',texto:'Desde el listado, selecciona Generar desde CFDI, elige Emitidas, empresa y fechas. Revisa las partidas con el ojo, elige las facturas y confirma. Se crea un borrador por UUID; después ábrelo y contabilízalo cuando esté revisado. Requiere integración activa, cuentas configuradas y periodo abierto. Solo facturas emitidas en Gekko, CFDI 4.0 de ingreso en MXN desde la fecha de inicio contable; no incluye complementos, notas de crédito ni carga histórica anterior. Una factura PUE también se registra contra clientes: su cobro se registra por separado. Si una póliza se anula, conserva el vínculo y no se genera otra automáticamente.'},{"titulo": "1. Abre el periodo de la empresa", "texto": "En Periodos abre el mes que utilizar\u00e1s. Solo puedes guardar, modificar, anular o contabilizar p\u00f3lizas en meses abiertos. El acceso a Periodos depende de tu perfil."}, {"titulo": "2. Captura encabezado y partidas", "texto": "Selecciona fecha, tipo y concepto. Agrega al menos dos partidas con cuentas activas que permitan movimientos. Cada partida lleva un cargo o un abono. El total de cargos debe coincidir con el de abonos. Los importes se capturan en MXN."}, {"titulo": "3. Guarda el borrador", "texto": "Guardar borrador conserva la captura sin afectar saldos. El folio es autom\u00e1tico por empresa, a\u00f1o y tipo. Despu\u00e9s del alta se conservan el tipo y el a\u00f1o. Puedes revisar cambios en Historial."}, {"titulo": "4. Contabiliza", "texto": "Abre el borrador guardado y pulsa Contabilizar. Si modificaste alg\u00fan dato, guarda primero los cambios. La API vuelve a revisar el periodo, las cuentas y los importes. Al confirmar, las partidas pasan a los movimientos contables una sola vez y la p\u00f3liza queda protegida contra edici\u00f3n."}, {"titulo": "5. Correcciones y anulaciones", "texto": "Un borrador puede anularse con motivo mientras su periodo est\u00e9 abierto. Una p\u00f3liza contabilizada no se edita ni se elimina: para corregirla registra otra p\u00f3liza con las partidas de ajuste o contrapartida e indica el folio original en la referencia. El historial original se conserva."}, {"titulo": "6. Consulta saldos y cierra el mes", "texto": "En el detalle de Periodos puedes revisar cargos, abonos y saldos por cuenta. Cerrar el mes impide nuevas contabilizaciones y cambios. Reabrir requiere motivo. La contabilizaci\u00f3n no genera movimientos bancarios ni de caja; registra el asiento contable. Los reportes y el cierre anual se integran por separado."}];
    onMounted(handleCargar);onUnmounted(()=>{activo=false;consulta++;});
    return {periodos,periodoActual,hayPeriodos,mostrarContabilizar,errorContabilizar,hayCambios,puedeContabilizar,handleEstado,handleEstadoSeverity,handleAbrirContabilizar,handleContabilizar,tipos,estados,empresas,empresa,empresaActual,cuentas,registros,historial,desde,hasta,busqueda,tipo,estado,primero,tab,cargando,guardando,mostrar,mostrarAyuda,mostrarCambios,mostrarAnular,error,errorFormulario,errorAnular,motivo,cambios,formulario,editable,filas,resumen,opcionesCuentas,totales,valido,guia,
        handleCargar,handleEmpresa,handleLimpiar,handleNuevo,handleEditar,handleAgregarPartida,handleQuitarPartida,handleCancelar,handleGuardar,handleCambios,handleAbrirAnular,handleAnular,handleMoneda,handleTipo,handleFechaHistorial};
}
