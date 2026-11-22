import { computed, ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';

export default function proceso() {
    const store = useStore(), toast = useToast();
    const cargando = ref(false), guardando = ref(false), configuracion = ref(null);
    const formulario = ref({ api_url: '', exigir_timbrado: false });
    const confirmar = ref(false), accion = ref(null), mostrarClave = ref(false), clave = ref(''), tipoClave = ref('');
    const tipos = [{ id: 'timbrado', nombre: 'Timbrado de facturas y complementos', icono: 'pi pi-file-check' },
        { id: 'cancelaciones', nombre: 'Cancelaciones', icono: 'pi pi-ban' }];
    const ocupado = computed(() => cargando.value || guardando.value);
    const handleAplicar = datos => { configuracion.value = datos; formulario.value = { api_url: datos.api_url || '', exigir_timbrado: datos.exigir_timbrado === true }; };
    const handleError = err => toast.add({ severity: 'error', summary: 'CONTPAQi .NET', detail: err.message || 'No fue posible completar la operación.', life: 6000 });
    const handleCargar = async () => {
        if (ocupado.value) return;
        cargando.value = true;
        try {
            const res = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/contpaq_net/' });
            if (res.estatus !== 200) throw new Error(res.mensaje);
            handleAplicar(res.datos);
        } catch (err) { handleError(err); }
        finally { cargando.value = false; }
    };
    const handleGuardar = async () => {
        if (ocupado.value || !configuracion.value) return;
        guardando.value = true;
        try {
            const res = await store.dispatch('api/apiPutToken', { direccion: '/contpaq_net/', datosJson: { ...formulario.value, revision: configuracion.value.revision } });
            if (res.estatus !== 200) throw new Error(res.mensaje);
            handleAplicar(res.datos);
            toast.add({ severity: 'success', summary: 'CONTPAQi .NET', detail: 'Configuración guardada.', life: 4000 });
        } catch (err) { handleError(err); }
        finally { guardando.value = false; }
    };
    const handleSolicitar = (tipo, operacion, habilitada = false) => {
        accion.value = { tipo, operacion, habilitada };
        confirmar.value = true;
    };
    const handleConfirmar = async () => {
        if (ocupado.value || !accion.value || !configuracion.value) return;
        guardando.value = true;
        try {
            const { tipo, operacion, habilitada } = accion.value;
            const generar = operacion === 'generar';
            const res = await store.dispatch(generar ? 'api/apiPostToken' : 'api/apiPutToken', {
                direccion: '/contpaq_net/claves/' + tipo + (generar ? '/generar' : ''),
                datosJson: { revision: configuracion.value.revision, ...(generar ? {} : { habilitada }) }
            });
            if (res.estatus !== 200) throw new Error(res.mensaje);
            handleAplicar(generar ? res.datos.configuracion : res.datos);
            confirmar.value = false;
            if (generar) { clave.value = res.datos.clave; tipoClave.value = tipo; mostrarClave.value = true; }
            else toast.add({ severity: 'success', summary: 'CONTPAQi .NET', detail: 'Estado de la clave actualizado.', life: 4000 });
        } catch (err) { handleError(err); }
        finally { guardando.value = false; }
    };
    const handleCopiar = async () => {
        try { await navigator.clipboard.writeText(clave.value); toast.add({ severity: 'success', summary: 'Clave copiada', detail: 'Pégala en la configuración del ejecutable.', life: 3500 }); }
        catch { toast.add({ severity: 'warn', summary: 'Copiar clave', detail: 'Selecciona el texto y cópialo manualmente.', life: 4500 }); }
    };
    const handleCerrarClave = () => { clave.value = ''; tipoClave.value = ''; };
    const handleFecha = valor => valor ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(valor)) : 'Sin registro';
    onMounted(handleCargar);
    return { tipos, configuracion, formulario, cargando, guardando, ocupado, confirmar, accion, mostrarClave, clave, tipoClave,
        handleCargar, handleGuardar, handleSolicitar, handleConfirmar, handleCopiar, handleCerrarClave, handleFecha };
}