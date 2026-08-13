import { apiGet_blob, apiGet_token, apiPost_sinToken, apiPost_token, apiPost_token_formdata, apiPut_token, apiPut_token_formdata } from '../../helpers/funcionesApi';
// import { notify } from "@kyvg/vue3-notification";
import router from '../../router/index';

export const apiPostAcceso = async({ commit }, { direccion, datosJson }) => {

    commit('visibleCargandoMutation');
    const { estatus, mensaje, datos } = await apiPost_sinToken( direccion, datosJson );
    if (estatus === 200) {
        commit('visibleCargandoMutation');
        const { nombre, apellidos, email_empresarial, username, id_profile, token } = datos;
        localStorage.setItem('nombre', nombre);
        localStorage.setItem('apellidos', apellidos);
        localStorage.setItem('email_empresarial', email_empresarial);
        localStorage.setItem('username', username);
        localStorage.setItem('id_profile', id_profile);
        localStorage.setItem('token', `Bearer ${token}`);
        router.replace({ name: 'bienvenida' });
    } else {
        commit('visibleCargandoMutation');
    }
    return {
        estatus,
        mensaje,
        datos
    };

};

export const apiGetToken = async({ commit }, { direccion }) => {
    commit('visibleCargandoMutation');
    const { estatus, mensaje, datos } = await apiGet_token( direccion );
    if (estatus === 200) {
        commit('visibleCargandoMutation');
    } else {
        commit('visibleCargandoMutation');
    }
    if( estatus === 401 ){
        localStorage.clear();
        router.replace({ name: 'acceso' });
    }
    if( estatus === 402 ){
        localStorage.clear();
        router.replace({ name: 'acceso' });
    }
    if( estatus === 403 ){
        router.replace({ name: 'notpagefound' });
    }
    return {
        estatus,
        mensaje,
        datos
    };

};


export const apiPostToken = async({ commit }, { direccion, datosJson }) => {
    commit('visibleCargandoMutation');
    const { estatus, mensaje, datos } = await apiPost_token( direccion, datosJson );
    if (estatus === 200) {
        commit('visibleCargandoMutation');
    } else {
        commit('visibleCargandoMutation');
    }
    if( estatus === 401 ){
        localStorage.clear();
        router.replace({ name: 'acceso' });
    }
    if( estatus === 402 ){
        localStorage.clear();
        router.replace({ name: 'acceso' });
    }
    if( estatus === 403 ){
        router.replace({ name: 'notpagefound' });
    }
    return {
        estatus,
        mensaje,
        datos
    };

};


export const apiPutToken = async({ commit }, { direccion, datosJson }) => {
    commit('visibleCargandoMutation');
    const { estatus, mensaje, datos } = await apiPut_token( direccion, datosJson );
    if (estatus === 200) {
        commit('visibleCargandoMutation');
    } else {
        commit('visibleCargandoMutation');
    }
    if( estatus === 401 ){
        localStorage.clear();
        router.replace({ name: 'acceso' });
    }
    if( estatus === 402 ){
        localStorage.clear();
        router.replace({ name: 'acceso' });
    }
    if( estatus === 403 ){
        router.replace({ name: 'notpagefound' });
    }
    return {
        estatus,
        mensaje,
        datos
    };

};


export const apiPutTokenFormData = async({ commit }, { direccion, formData }) => {

    commit('visibleCargandoMutation');
    const { estatus, mensaje } = await apiPut_token_formdata( direccion, formData );
    if (estatus === 200) {
        commit('visibleCargandoMutation');
    } else {
        commit('visibleCargandoMutation');
    }
    if( estatus === 401 ){
        localStorage.clear();
        router.replace({ name: 'acceso' });
    }
    if( estatus === 402 ){
        localStorage.clear();
        router.replace({ name: 'acceso' });
    }
    if( estatus === 403 ){
        router.replace({ name: 'notpagefound' });
    }
    return {
        estatus,
        mensaje
    };

};


export const apiPostTokenFormData = async({ commit }, { direccion, formData }) => {
    commit('visibleCargandoMutation');
    const { estatus, mensaje } = await apiPost_token_formdata( direccion, formData );
    if (estatus === 200) {
        commit('visibleCargandoMutation');
    } else {
        commit('visibleCargandoMutation');
    }
    if( estatus === 401 ){
        localStorage.clear();
        router.replace({ name: 'acceso' });
    }
    if( estatus === 402 ){
        localStorage.clear();
        router.replace({ name: 'acceso' });
    }
    if( estatus === 403 ){
        router.replace({ name: 'notpagefound' });
    }
    return {
        estatus,
        mensaje
    };

};



export const apiGetblob = async({ commit }, { direccion }) => {
    
    commit('visibleCargandoMutation');
    const { estatus, mensaje, data } = await apiGet_blob( direccion );
    if (estatus === 200) {
        commit('visibleCargandoMutation');
    } else {
        commit('visibleCargandoMutation');
    }
    if( estatus === 401 ){
        localStorage.clear();
        router.replace({ name: 'acceso' });
    }
    if( estatus === 402 ){
        localStorage.clear();
        router.replace({ name: 'acceso' });
    }
    if( estatus === 403 ){
        router.replace({ name: 'notpagefound' });
    }
    return {
        estatus,
        mensaje,
        data
    };

};


