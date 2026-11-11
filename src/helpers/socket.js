import { reactive, readonly } from 'vue';
import { io } from 'socket.io-client';

const estado = reactive({ estado: 'desconectado', autorizado: false, mensaje: 'Sin conexión en tiempo real.', ultimoAviso: null, revisionAviso: 0, revisionConexion: 0, revisionNotificaciones: 0, revisionMesa: 0, revisionSat: 0, trabajoSat: null, revisionChat: 0, revisionPresenciaChat: 0, presenciaChat: {}, revisionConexionesUsuarios: 0 });
estado.revisionSeguimientoUsuarios = 0;
export const estadoSocket = readonly(estado);
let conexion = null;
let tokenConexion = '';
let alCerrarSesion = null;
let rutaPantalla = '';
let avisoPantalla = null;
export const registrarPantallaActual = (ruta) => {
    rutaPantalla = typeof ruta === 'string' && ruta.length <= 240 && /^\/[a-zA-Z0-9_/-]*$/.test(ruta) ? ruta : '';
    window.clearTimeout(avisoPantalla);
    const actual = conexion;
    if (!actual?.connected || !estado.autorizado) return;
    avisoPantalla = window.setTimeout(() => {
        if (conexion === actual && actual.connected && estado.autorizado) actual.emit('usuario_pantalla', { ruta: rutaPantalla });
    }, 500);
};
export const registrarCierreSesion = (handler) => {
    alCerrarSesion = handler;
    return () => { if (alCerrarSesion === handler) alCerrarSesion = null; };
};

const handleToken = () => localStorage.getItem('token')?.trim() || '';

export const desconectarSocket = (motivo = 'desconectado') => {
    window.clearTimeout(avisoPantalla);
    const anterior = conexion;
    conexion = null;
    tokenConexion = '';
    if (anterior) {
        anterior.removeAllListeners();
        anterior.disconnect();
        anterior.io.removeAllListeners();
        anterior.auth = {};
    }
    Object.assign(estado, { estado: motivo, autorizado: false, ultimoAviso: null, presenciaChat: {},
        mensaje: motivo === 'sesion_vencida' ? 'La sesión de tiempo real venció o no fue autorizada. Inicia sesión nuevamente.' : 'Sin conexión en tiempo real.' });
};

export const conectarSocket = () => {
    const token = handleToken();
    if (!token || token === 'null' || token === 'undefined') {
        desconectarSocket();
        return;
    }
    // Montar componentes o cambiar de ruta no crea otra conexion.
    if (conexion && tokenConexion === token && (conexion.connected || conexion.active)) return;
    desconectarSocket();
    let origen;
    try {
        const base = import.meta.env.VITE_API_URL?.trim();
        if (!base) throw new Error('API no configurada');
        const direccion = new URL(base, window.location.origin);
        if (!['http:', 'https:'].includes(direccion.protocol)) throw new Error('Protocolo no valido');
        origen = direccion.origin;
    } catch {
        estado.mensaje = 'No se pudo determinar la dirección de la API.';
        return;
    }
    tokenConexion = token;
    estado.estado = 'conectando';
    estado.mensaje = 'Conectando con Gekko.';
    const actual = io(origen + '/realtime', {
        path: '/socket.io', autoConnect: false, auth: { token },
        reconnection: true, reconnectionDelay: 2000, reconnectionDelayMax: 15000,
        randomizationFactor: 0.5, timeout: 10000
    });
    conexion = actual;
    const vigente = () => conexion === actual;
    actual.on('connect', () => {
        if (!vigente()) return;
        estado.estado = estado.autorizado ? 'conectado' : 'conectando';
    });
    actual.on('conexion_lista', () => {
        if (!vigente()) return;
        estado.revisionConexion += 1;
        Object.assign(estado, { estado: 'conectado', autorizado: true, mensaje: 'Conexión autenticada. Sala personal asignada por el servidor.' });
        registrarPantallaActual(rutaPantalla);
    });
    actual.on('disconnect', () => {
        if (!vigente()) return;
        estado.autorizado = false;
        estado.estado = actual.active ? 'reconectando' : 'desconectado';
        estado.mensaje = 'Se perdió la conexión en tiempo real. Puedes seguir usando la API.';
    });
    actual.io.on('reconnect_attempt', () => {
        if (!vigente()) return;
        if (handleToken() !== tokenConexion) {
            conectarSocket();
            return;
        }
        estado.estado = 'reconectando';
    });
    actual.on('connect_error', (error) => {
        if (!vigente()) return;
        if ([401, 402, 403].includes(Number(error?.data?.codigo))) {
            desconectarSocket('sesion_vencida');
            return;
        }
        estado.autorizado = false;
        estado.estado = actual.active ? 'reconectando' : 'desconectado';
        estado.mensaje = 'El servicio de tiempo real no está disponible. La API sigue siendo independiente.';
    });
    actual.on('sesion_cerrada', () => {
        if (!vigente()) return;
        desconectarSocket('sesion_cerrada');
        localStorage.clear();
        if (alCerrarSesion) alCerrarSesion();
        else window.location.replace('/acceso');
    });
    actual.on('sesion_vencida', () => { if (vigente()) desconectarSocket('sesion_vencida'); });
    actual.on('chat_presencia', (aviso) => {
        if (!vigente() || !estado.autorizado || !Array.isArray(aviso?.usuarios) || aviso.usuarios.length > 100) return;
        const cambios = {};
        aviso.usuarios.forEach(item => {
            if (typeof item?.id === 'string' && /^[a-f0-9]{24}$/.test(item.id) && typeof item.conectado === 'boolean') cambios[item.id] = item.conectado;
        });
        estado.presenciaChat = { ...estado.presenciaChat, ...cambios };
        estado.revisionPresenciaChat += 1;
    });
    actual.on('chat_actualizado', (aviso) => {
        if (vigente() && estado.autorizado && aviso?.origen === 'chat') estado.revisionChat += 1;
    });
    actual.on('usuarios_conexiones_actualizadas', (aviso) => {
        if (vigente() && estado.autorizado && aviso?.origen === 'usuarios') estado.revisionConexionesUsuarios += 1;
    });
    actual.on('usuarios_seguimiento_actualizado', (aviso) => {
        if (vigente() && estado.autorizado && aviso?.origen === 'seguimiento') estado.revisionSeguimientoUsuarios += 1;
    });
    actual.on('sat_actualizacion', (aviso) => {
        if (vigente() && estado.autorizado && /^[a-f0-9]{32}$/.test(aviso?.trabajo_id || '')) {
            estado.trabajoSat = aviso.trabajo_id; estado.revisionSat += 1;
        }
    });
    actual.on('mesa_actualizada', (aviso) => {
        if (vigente() && estado.autorizado && aviso?.origen === 'mesa_control') estado.revisionMesa += 1;
    });
    actual.on('notificaciones_actualizadas', (aviso) => {
        if (vigente() && estado.autorizado && aviso?.origen === 'mesa_control') estado.revisionNotificaciones += 1;
    });
    actual.on('aviso_privado', (aviso) => {
        if (!vigente() || !estado.autorizado || aviso?.tipo !== 'prueba') return;
        // Solo campos pequenos conocidos: no mostramos HTML ni texto arbitrario.
        estado.ultimoAviso = { mensaje: 'Conexión privada verificada.', fecha: new Date().toISOString() };
        estado.revisionAviso += 1;
    });
    actual.connect();
};

export const probarSocket = () => {
    const actual = conexion;
    if (!actual?.connected || !estado.autorizado) return Promise.resolve({ estatus: 409, mensaje: 'Espera a que la conexión esté autorizada.' });
    return new Promise((resolve) => {
        // Sin cola ni reintento: una prueba de conectividad no debe reenviarse al volver la red.
        actual.timeout(5000).emit('prueba_privada', {}, (error, respuesta) => {
            if (actual !== conexion) return resolve({ estatus: 409, mensaje: 'La conexión cambió durante la prueba.' });
            if (error) return resolve({ estatus: 408, mensaje: 'No se recibió confirmación. Puedes intentar nuevamente.' });
            resolve(respuesta || { estatus: 500, mensaje: 'No se recibió una respuesta válida.' });
        });
    });
};

if (import.meta.hot) import.meta.hot.dispose(() => desconectarSocket());
