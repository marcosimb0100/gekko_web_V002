// Respaldo HTTP: la sesion no depende de que Socket.IO este disponible.
export const iniciarActividadSesion = (store) => {
    let consultando = false;
    const handleActividad = async () => {
        if (consultando || !localStorage.getItem('token')) return;
        consultando = true;
        try {
            await store.dispatch('api/apiPostTokenSinCargando', { direccion: 'usuarios/sesion/actividad', datosJson: {} });
        } finally {
            consultando = false;
        }
    };
    const handleVisible = () => { if (document.visibilityState === 'visible') handleActividad(); };
    handleActividad();
    const intervalo = window.setInterval(handleActividad, 45000);
    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('online', handleActividad);
    window.addEventListener('pageshow', handleActividad);
    return () => {
        window.clearInterval(intervalo);
        document.removeEventListener('visibilitychange', handleVisible);
        window.removeEventListener('online', handleActividad);
        window.removeEventListener('pageshow', handleActividad);
    };
};
