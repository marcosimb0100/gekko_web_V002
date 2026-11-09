const DIA = 86400000;
const fechaUTC = (valor) => {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
    const fecha = new Date(`${valor}T00:00:00Z`);
    return Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor ? null : fecha;
};

// Las fechas del acuerdo son días civiles: UTC evita saltos por horario de verano.
export function pagosDelMes(programaciones, anio, mes) {
    const resultado = {};
    const ultimo = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
    const pasos = { Mensual: 1, Bimestral: 2, Trimestral: 3, Semestral: 6, Anual: 12 };
    for (const pago of programaciones) {
        if (pago.activo !== true) continue;
        const inicio = fechaUTC(pago.inicio);
        if (!inicio) continue;
        const meses = (anio - inicio.getUTCFullYear()) * 12 + mes - inicio.getUTCMonth();
        for (let dia = 1; dia <= ultimo; dia++) {
            const fecha = new Date(Date.UTC(anio, mes, dia));
            const diferencia = Math.round((fecha - inicio) / DIA);
            if (diferencia < 0) continue;
            let coincide = false;
            if (pago.periodicidad === 'Sin recurrencia') coincide = diferencia === 0;
            else if (pago.periodicidad === 'Quincenal') coincide = dia === 15 || dia === ultimo;
            else if (['Semanal', 'Cada 14 dias', 'Personalizada'].includes(pago.periodicidad)) {
                const intervalo = pago.periodicidad === 'Semanal' ? 7 : pago.periodicidad === 'Cada 14 dias' ? 14 : pago.intervalo;
                coincide = Number.isInteger(intervalo) && intervalo > 0 && diferencia % intervalo === 0;
            } else if (pasos[pago.periodicidad]) {
                const diaAcuerdo = pago.periodicidad === 'Mensual' ? pago.dia : inicio.getUTCDate();
                coincide = meses >= 0 && meses % pasos[pago.periodicidad] === 0 && dia === Math.min(diaAcuerdo, ultimo);
            }
            if (coincide) {
                const clave = fecha.toISOString().slice(0, 10);
                (resultado[clave] ??= []).push(pago);
            }
        }
    }
    return resultado;
}
