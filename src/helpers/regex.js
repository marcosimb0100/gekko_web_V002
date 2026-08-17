export const regexNombreCompleto = /^[A-Za-zÁÉÍÓÚáéíóúÑñ]{3,}(?:\s[A-Za-zÁÉÍÓÚáéíóúÑñ]{3,})+$/;
export const regexCorreoElectronico = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const regex_clave = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,}$/;
export const regex_clabe_banco = /^\d{18}$/;
export const regex_cuenta_banco = /^\d{11}$/;
