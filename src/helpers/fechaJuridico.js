export const handleFechaJuridico = (valor, incluirHora = true, vacio = 'Sin fecha') => {
    if (!valor) return vacio;
    const texto = String(valor);
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return vacio;
    const completar = numero => String(numero).padStart(2, '0');
    const dia = `${fecha.getFullYear()}-${completar(fecha.getMonth() + 1)}-${completar(fecha.getDate())}`;
    return incluirHora ? `${dia} ${completar(fecha.getHours())}:${completar(fecha.getMinutes())}` : dia;
};
