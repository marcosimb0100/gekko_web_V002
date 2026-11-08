import { computed, ref, onBeforeUnmount } from 'vue';
import logoGekko from '../assets/images/logo_gekko.png';

// Avisos locales mientras la pagina esta abierta; no requiere Web Push.
export default function useAvisosNavegador({ permitido, handleAbrir, origen, titulo, mensaje, textoActivacion, validarId }) {
    const soportaAvisos = typeof window !== 'undefined' && window.isSecureContext && 'Notification' in window;
    const permisoAvisos = ref(soportaAvisos ? Notification.permission : 'no_disponible');
    const usuario = localStorage.getItem('correo_electronico') || 'sesion';
    const clavePreferencia = 'gekko_' + origen + '_avisos:' + usuario;
    const claveUltimoAviso = 'gekko_' + origen + '_ultimo_aviso:' + usuario;
    const handleLeerPreferencia = () => {
        try { return localStorage.getItem(clavePreferencia) !== 'false'; } catch { return true; }
    };
    const avisosActivos = ref(soportaAvisos && permisoAvisos.value === 'granted' && handleLeerPreferencia());
    const solicitandoAvisos = ref(false), ayudaAvisos = ref('');
    const etiquetaAvisos = computed(() => !soportaAvisos ? 'Avisos no disponibles' : permisoAvisos.value === 'denied' ? 'Avisos bloqueados' : avisosActivos.value ? 'Silenciar avisos' : 'Activar avisos');
    let activa = true, aviso = null, ultimoAvisado = '', canal = null;
    const consultasFoco = new Map();
    const handleEnPrimerPlano = () => document.visibilityState === 'visible' && document.hasFocus();
    const handleCerrarAviso = () => { aviso?.close(); aviso = null; };
    const handleActualizarPermiso = () => {
        if (!soportaAvisos) return;
        permisoAvisos.value = Notification.permission;
        avisosActivos.value = permisoAvisos.value === 'granted' && handleLeerPreferencia();
    };
    const handleActivarAvisos = async () => {
        ayudaAvisos.value = '';
        if (!soportaAvisos || solicitandoAvisos.value) return;
        handleActualizarPermiso();
        if (permisoAvisos.value === 'denied') {
            ayudaAvisos.value = 'Permite las notificaciones de este sitio en la configuraci\u00f3n del navegador.';
            return;
        }
        if (avisosActivos.value) {
            try { localStorage.setItem(clavePreferencia, 'false'); } catch { /* Preferencia de esta ventana. */ }
            avisosActivos.value = false; handleCerrarAviso();
            return;
        }
        solicitandoAvisos.value = true;
        try {
            // Solo se solicita permiso al pulsar el boton.
            const permiso = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
            if (!activa) return;
            permisoAvisos.value = permiso;
            avisosActivos.value = permiso === 'granted';
            if (permiso === 'granted') {
                try { localStorage.setItem(clavePreferencia, 'true'); } catch { /* Preferencia de esta ventana. */ }
                ayudaAvisos.value = textoActivacion;
            } else ayudaAvisos.value = permiso === 'denied' ? 'El navegador bloque\u00f3 los avisos. Puedes permitirlos desde la configuraci\u00f3n del sitio.' : 'No se activaron los avisos.';
        } catch { ayudaAvisos.value = 'No fue posible activar los avisos en este navegador.'; }
        finally { if (activa) solicitandoAvisos.value = false; }
    };
    const handleConsultarFoco = () => {
        if (handleEnPrimerPlano()) return Promise.resolve(false);
        if (!canal) return Promise.resolve(true);
        return new Promise(resolve => {
            const id = crypto.randomUUID();
            const timer = setTimeout(() => { consultasFoco.delete(id); resolve(true); }, 150);
            consultasFoco.set(id, { timer, resolve });
            try { canal.postMessage({ tipo: 'consultar_foco' }); } catch { clearTimeout(timer); consultasFoco.delete(id); resolve(true); }
        });
    };
    const handleFoco = () => {
        handleActualizarPermiso();
        if (!handleEnPrimerPlano()) return;
        handleCerrarAviso();
        try { canal?.postMessage({ tipo: 'foco' }); } catch { /* El chat no depende de BroadcastChannel. */ }
    };
    if (typeof BroadcastChannel !== 'undefined') {
        try {
            canal = new BroadcastChannel('gekko-' + origen + '-foco:' + usuario);
            canal.onmessage = (event) => {
                if (event.data?.tipo === 'consultar_foco' && handleEnPrimerPlano()) canal.postMessage({ tipo: 'foco' });
                if (event.data?.tipo === 'foco') {
                    handleCerrarAviso();
                    consultasFoco.forEach(({ timer, resolve }) => { clearTimeout(timer); resolve(false); });
                    consultasFoco.clear();
                }
            };
        } catch { canal = null; }
    }
    const handleCrearAviso = (id) => {
        if (!activa || !permitido.value || !avisosActivos.value || Notification.permission !== 'granted' || handleEnPrimerPlano()) return;
        let anterior = ultimoAvisado;
        try { anterior = localStorage.getItem(claveUltimoAviso) || anterior; } catch { /* Dedupe local si no hay almacenamiento. */ }
        if (anterior >= id) return;
        try {
            const nuevo = new Notification(titulo, {
                body: mensaje,
                icon: logoGekko, tag: 'gekko-' + origen, renotify: false
            });
            handleCerrarAviso(); aviso = nuevo; ultimoAvisado = id;
            try { localStorage.setItem(claveUltimoAviso, id); } catch { /* tag agrupa los avisos. */ }
            nuevo.onclick = () => {
                nuevo.close();
                if (!activa || !permitido.value) return;
                window.focus();
                handleAbrir();
            };
            nuevo.onclose = () => { if (aviso === nuevo) aviso = null; };
        } catch { ayudaAvisos.value = 'Este navegador no pudo mostrar el aviso. Tus avisos siguen disponibles en Gekko.'; }
    };
    const handleAvisar = async (id) => {
        if (!soportaAvisos || !activa || !permitido.value || !avisosActivos.value || !validarId(id)) return;
        if (!await handleConsultarFoco() || !activa) return;
        try {
            if (typeof navigator !== 'undefined' && navigator.locks?.request) {
                await navigator.locks.request('gekko-' + origen + '-avisos', { ifAvailable: true }, lock => { if (lock) handleCrearAviso(id); });
            } else handleCrearAviso(id);
        } catch { /* Un aviso opcional nunca interrumpe el chat. */ }
    };
    const handleStorage = (event) => { if (event.key === clavePreferencia) { handleActualizarPermiso(); if (!avisosActivos.value) handleCerrarAviso(); } };
    window.addEventListener('focus', handleFoco);
    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleFoco);
    onBeforeUnmount(() => {
        activa = false; handleCerrarAviso();
        window.removeEventListener('focus', handleFoco); window.removeEventListener('storage', handleStorage);
        document.removeEventListener('visibilitychange', handleFoco);
        consultasFoco.forEach(({ timer, resolve }) => { clearTimeout(timer); resolve(false); }); consultasFoco.clear(); canal?.close();
    });
    return { soportaAvisos, avisosActivos, solicitandoAvisos, etiquetaAvisos, ayudaAvisos, handleActivarAvisos, handleAvisar, handleCerrarAviso };
}
