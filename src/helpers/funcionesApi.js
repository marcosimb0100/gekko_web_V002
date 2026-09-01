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

export const apiGet_tokenCliente = async (direccion) => {
    const token = localStorage.getItem('token_cliente') || '';

    const Authorization = token ? `Bearer ${token}` : '';

    const consumir = axios.create({
        baseURL: url,

        headers: {
            Authorization: Authorization
        }
    });

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
            return {
                estatus: error.response?.status ?? 500,

                mensaje: error.response?.data?.mensaje ?? error.message ?? 'No se pudo conectar con el servidor.',

                datos: {}
            };
        });
};

export const apiGet_blobTokenCliente = async (direccion) => {
    const token = localStorage.getItem('token_cliente') || '';

    const consumir = axios.create({
        baseURL: url,

        headers: {
            Authorization: token ? `Bearer ${token}` : ''
        },

        responseType: 'blob'
    });

    try {
        const response = await consumir.get(direccion);

        return {
            estatus: response.status,

            datos: response.data,

            mensaje: ''
        };
    } catch (error) {
        let mensaje = 'No fue posible consultar el archivo.';

        const data = error.response?.data;

        // ---------------------------------------------
        // CUANDO EL BACKEND REGRESA JSON PERO AXIOS
        // LO RECIBE COMO BLOB
        // ---------------------------------------------

        if (data instanceof Blob) {
            try {
                const texto = await data.text();

                const json = JSON.parse(texto);

                mensaje = json.mensaje || mensaje;
            } catch {
                mensaje = error.message || mensaje;
            }
        } else {
            mensaje = data?.mensaje || error.message || mensaje;
        }

        return {
            estatus: error.response?.status ?? 500,

            mensaje: mensaje,

            datos: null
        };
    }
};

export const apiPut_tokenCliente_formdata = async (direccion, datosFormData) => {
    const token = localStorage.getItem('token_cliente') || '';

    const consumir = axios.create({
        baseURL: url,

        headers: {
            Authorization: token ? `Bearer ${token}` : ''
        }
    });

    try {
        const response = await consumir.put(direccion, datosFormData);

        const { status, data } = response;

        return {
            estatus: status,

            mensaje: data.mensaje,

            datos: data.datos
        };
    } catch (error) {
        return {
            estatus: error.response?.status ?? 500,

            mensaje: error.response?.data?.mensaje ?? error.message ?? 'No fue posible actualizar el CIF.',

            datos: {}
        };
    }
};

export const apiPost_tokenCliente_formdata = async (direccion, formData) => {
    const token = localStorage.getItem('token_cliente') || '';

    const consumir = axios.create({
        baseURL: url,
        headers: {
            Authorization: token ? `Bearer ${token}` : ''
        }
    });

    try {
        const response = await consumir.post(direccion, formData);

        return {
            estatus: response.status,
            mensaje: response.data?.mensaje ?? '',
            datos: response.data?.datos ?? {}
        };
    } catch (error) {
        return {
            estatus: error.response?.status ?? 500,
            mensaje: error.response?.data?.mensaje ?? error.message ?? 'No fue posible guardar la solicitud.',
            datos: {}
        };
    }
};
