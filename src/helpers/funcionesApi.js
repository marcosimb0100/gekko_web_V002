import axios from 'axios';

const url = import.meta.env.VITE_API_URL;

export const apiPost_sinToken = async (direccion, datos) => {
    const consumir = axios.create({ baseURL: url, headers: { 'Access-Control-Allow-Origin': '*' } });
    return await consumir
        .post(direccion, datos)
        .then((response) => {
            const { status, data } = response;
            return {
                estatus: status,
                mensaje: data.mensaje,
                datos: data.datos
            };
        })
        .catch((error) => {
            const { response } = error;
            return {
                estatus: response.status === 0 ? 500 : response.status,
                mensaje: response.status === 0 ? `[Api] Error ${error}` : response.data.mensaje,
                datos: {}
            };
        });
};

export const apiGet_token = async (direccion) => {
    const Authorization = localStorage.getItem('token') === null && localStorage.getItem('token') === '' ? '' : localStorage.getItem('token');
    const rutaActual = localStorage.getItem('rutaActual') === null && localStorage.getItem('rutaActual') === '' ? '' : localStorage.getItem('rutaActual');
    const consumir = axios.create({ baseURL: url, headers: { Authorization: Authorization, rutaActual: rutaActual } });
    return await consumir
        .get(direccion)
        .then((response) => {
            const { status, data } = response;
            return {
                estatus: status,
                mensaje: data.mensaje,
                datos: data.datos
            };
        })
        .catch((error) => {
            const { response } = error;
            return {
                estatus: response.status === 0 ? 500 : response.status,
                mensaje: response.status === 0 ? `[Api] Error ${error}` : response.data.mensaje,
                datos: {}
            };
        });
};

export const apiPost_token = async (direccion, datos) => {
    const Authorization = localStorage.getItem('token') === null && localStorage.getItem('token') === '' ? '' : localStorage.getItem('token');
    const rutaActual = localStorage.getItem('rutaActual') === null && localStorage.getItem('rutaActual') === '' ? '' : localStorage.getItem('rutaActual');
    const consumir = axios.create({ baseURL: url, headers: { Authorization: Authorization, rutaActual: rutaActual } });
    return await consumir
        .post(direccion, datos)
        .then((response) => {
            const { status, data } = response;
            return {
                estatus: status,
                mensaje: data.mensaje,
                datos: data.datos
            };
        })
        .catch((error) => {
            const { response } = error;
            return {
                estatus: response.status === 0 ? 500 : response.status,
                mensaje: response.status === 0 ? `[Api] Error ${error}` : response.data.mensaje,
                datos: {}
            };
        });
};

export const apiPut_token = async (direccion, datos) => {
    const Authorization = localStorage.getItem('token') === null && localStorage.getItem('token') === '' ? '' : localStorage.getItem('token');
    const rutaActual = localStorage.getItem('rutaActual') === null && localStorage.getItem('rutaActual') === '' ? '' : localStorage.getItem('rutaActual');
    const consumir = axios.create({ baseURL: url, headers: { Authorization: Authorization, rutaActual: rutaActual } });
    return await consumir
        .put(direccion, datos)
        .then((response) => {
            const { status, data } = response;
            return {
                estatus: status,
                mensaje: data.mensaje,
                datos: data.datos
            };
        })
        .catch((error) => {
            const { response } = error;
            return {
                estatus: response.status === 0 ? 500 : response.status,
                mensaje: response.status === 0 ? `[Api] Error ${error}` : response.data.mensaje,
                datos: {}
            };
        });
};

export const apiPost_token_formdata = async (direccion, datos) => {
    const Authorization = localStorage.getItem('token') === null && localStorage.getItem('token') === '' ? '' : localStorage.getItem('token');
    const rutaActual = localStorage.getItem('rutaActual') === null && localStorage.getItem('rutaActual') === '' ? '' : localStorage.getItem('rutaActual');
    const consumir = axios.create({ baseURL: url, headers: { Authorization: Authorization, rutaActual: rutaActual, 'Content-Type': 'multipart/form-data' } });

    return await consumir
        .post(direccion, datos)
        .then((response) => {
            const { status, data } = response;
            return {
                estatus: status,
                mensaje: data.mensaje
            };
        })
        .catch((error) => {
            const { response } = error;
            return {
                estatus: response.status === 0 ? 500 : response.status,
                mensaje: response.status === 0 ? `[Api] Error ${error}` : response.data.mensaje
            };
        });
};

export const apiPut_token_formdata = async (direccion, datos) => {
    const Authorization = localStorage.getItem('token') === null && localStorage.getItem('token') === '' ? '' : localStorage.getItem('token');
    const rutaActual = localStorage.getItem('rutaActual') === null && localStorage.getItem('rutaActual') === '' ? '' : localStorage.getItem('rutaActual');
    const consumir = axios.create({ baseURL: url, headers: { Authorization: Authorization, rutaActual: rutaActual, 'Content-Type': 'multipart/form-data' } });

    return await consumir
        .put(direccion, datos)
        .then((response) => {
            const { status, data } = response;
            return {
                estatus: status,
                mensaje: data.mensaje
            };
        })
        .catch((error) => {
            const { response } = error;
            return {
                estatus: response.status === 0 ? 500 : response.status,
                mensaje: response.status === 0 ? `[Api] Error ${error}` : response.data.mensaje
            };
        });
};

export const apiGet_blob = async (direccion) => {
    const Authorization = localStorage.getItem('token') || '';
    const rutaActual = localStorage.getItem('rutaActual') || '';

    const consumir = axios.create({
        baseURL: url,

        headers: {
            Authorization: Authorization,
            rutaActual: rutaActual
        },

        responseType: 'blob'
    });

    return await consumir
        .get(direccion)
        .then((response) => {
            const { status, data } = response;

            return {
                estatus: status,
                mensaje: '',
                data: data
            };
        })
        .catch((error) => {
            const { response } = error;

            return {
                estatus: response?.status ?? 500,
                mensaje: `Error al obtener la imagen`,
                data: null
            };
        });
};
