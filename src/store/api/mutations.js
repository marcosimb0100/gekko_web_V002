export const visibleCargandoMutation = (state) => {
    if (state.visibleCargando) {
        // console.log('cargando: false');
        state.visibleCargando = false;
    } else {
        // console.log('cargando: true');
        state.visibleCargando = true;
    }
};