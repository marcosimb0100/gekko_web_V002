import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';

export default function proceso(props) {
    const store = useStore();
    const registros = ref([]), cargando = ref(false), errorHistorial = ref(''), mostrarCambios = ref(false), movimientoElegido = ref(null);
    let consulta = 0;
    const handleCargarHistorial = async () => {
        const actual = ++consulta;
        if (!props.modulo || !props.registroId) { registros.value = []; return; }
        cargando.value = true; errorHistorial.value = '';
        try {
            const res = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/historial_catalogos/' + props.modulo + '/' + props.registroId });
            if (actual !== consulta) return;
            if (res.estatus !== 200) throw new Error(res.mensaje || 'No se pudo consultar el historial.');
            registros.value = res.datos?.historial || [];
        } catch (error) { if (actual === consulta) errorHistorial.value = error.message; }
        finally { if (actual === consulta) cargando.value = false; }
    };
    watch(() => [props.modulo, props.registroId], handleCargarHistorial, { immediate: true });
    const handleVerCambios = item => { movimientoElegido.value = item; mostrarCambios.value = true; };
    const handleCerrarCambios = () => { mostrarCambios.value = false; };
    const cambiosElegidos = computed(() => Array.isArray(movimientoElegido.value?.cambios) ? movimientoElegido.value.cambios : []);
    const nombres = {
        rfc: 'RFC', razon_social_nombre_completo: 'Nombre o razón social', tipo_persona: 'Tipo de persona',
        codigo_postal: 'Código postal', numero_ext: 'Número exterior', numero_int: 'Número interior',
        numero_contacto_principal: 'Contacto principal', numero_contacto_alterno: 'Contacto alterno',
        correo_electronico: 'Correo electrónico', calle: 'Calle', colonia: 'Colonia', poblacion: 'Población',
        municipio: 'Municipio', pais: 'País', estado: 'Estado', activo: 'Estatus', logo: 'Imagen',
        nombre_completo: 'Nombre completo', correo_acceso: 'Correo de acceso', chat_habilitado: 'Acceso al chat', limite_sesiones: 'Sesiones simultaneas', foto_perfil: 'Fotografia', nombre_empresa: 'Nombre comercial',
        regimen_fiscal: 'Régimen fiscal', promotor: 'Promotor', empresa_facturadora: 'Empresa facturadora'
    };
    const handleNombreCampo = campo => nombres[campo] || String(campo).replaceAll('_', ' ');
    const handleFecha = valor => {
        const fecha = new Date(valor);
        return valor && !Number.isNaN(fecha.getTime()) ? fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha';
    };
    const handleHora = valor => {
        const fecha = new Date(valor);
        return valor && !Number.isNaN(fecha.getTime()) ? fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '';
    };
    const handleSeveridad = accion => String(accion || '').toLowerCase().startsWith('alta') ? 'success' : 'info';
    const listaHistorial = computed(() => (props.modulo ? registros.value : (Array.isArray(props.movimientos) ? props.movimientos : [])).map((item, indice) => ({ ...item, clave: indice,
        campos: Array.isArray(item.campos) ? item.campos : [], usuario: item.usuario || 'Sin usuario registrado' })).sort((a, b) => (new Date(b.fecha).getTime() || 0) - (new Date(a.fecha).getTime() || 0)));
    return { listaHistorial, cargando, errorHistorial, mostrarCambios, movimientoElegido, cambiosElegidos, handleCargarHistorial, handleVerCambios, handleCerrarCambios, handleFecha, handleHora, handleSeveridad, handleNombreCampo };
}
