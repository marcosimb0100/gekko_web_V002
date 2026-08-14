const permisoRutas = (to, from, next) => {

    // if (localStorage.getItem('token') === null || localStorage.getItem('token') === '') {
    //     next({ path: '/acceso' });
    // } else {
    //     localStorage.setItem('rutaActual', to.path);
    //     localStorage.setItem('rutaAnterior', from.path);
    //     next();
    // }

    localStorage.setItem('rutaActual', to.path);
    localStorage.setItem('rutaAnterior', from.path);
    next();

};

export default permisoRutas;