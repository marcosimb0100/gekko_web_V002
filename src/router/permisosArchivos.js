import { apiGet_token } from '../helpers/funcionesApi';
import { consultaCarpeta, destinoAccesoArchivos, RUTA_PERMISO_ARCHIVOS } from '../helpers/archivosPortal';

export default async function permisosArchivos(to) {
    if (!localStorage.getItem('token')) return destinoAccesoArchivos(to.query);
    // This is another entrance to the existing kiosk, with the same profile permission.
    localStorage.setItem('rutaActual', RUTA_PERMISO_ARCHIVOS);
    const respuesta = await apiGet_token('/sync/espacios?limite=1&offset=0');
    if (respuesta.estatus === 200) return true;
    if ([401, 402].includes(respuesta.estatus)) return destinoAccesoArchivos(consultaCarpeta(to.query), 'sesion');
    return destinoAccesoArchivos(to.query, respuesta.estatus === 403 ? 'sin_acceso' : 'conexion');
}
