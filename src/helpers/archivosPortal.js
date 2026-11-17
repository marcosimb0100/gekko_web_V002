export const RUTA_PERMISO_ARCHIVOS = '/nube/kiosco';

// Copy only location IDs. A URL never grants permissions or supplies an arbitrary redirect.
export function consultaCarpeta(query = {}) {
    const salida = {};
    for (const campo of ['espacio', 'carpeta']) {
        if (typeof query[campo] === 'string' && /^[a-f0-9]{24}$/i.test(query[campo])) salida[campo] = query[campo];
    }
    if (!salida.espacio) delete salida.carpeta;
    return salida;
}

export function destinoAccesoArchivos(query = {}, motivo) {
    return { name: 'archivos_acceso', query: { ...consultaCarpeta(query), ...(motivo ? { motivo } : {}) } };
}
