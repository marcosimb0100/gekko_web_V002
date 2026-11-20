<template>
    <Fieldset v-if="pago" legend="Pago registrado" class="respaldo-pago">
        <div class="respaldo-rejilla">
            <div>
                <small>Origen</small><strong>{{ pago.origen === 'efectivo' ? 'Efectivo' : 'Banco' }}</strong
                ><span>{{ pago.cuenta_caja }}</span>
            </div>
            <div>
                <small>Fecha del pago</small><strong>{{ pago.fecha }}</strong>
            </div>
            <div>
                <small>Concepto de salida</small><strong>{{ pago.concepto }}</strong>
            </div>
            <div><small>Factura</small><Tag :value="pago.estado_factura" :severity="pago.requiere_factura ? 'warn' : 'secondary'" /></div>
            <div v-if="pago.motivo_sin_factura">
                <small>Motivo sin factura</small><span>{{ pago.motivo_sin_factura }}</span>
            </div>
            <div v-if="pago.origen === 'efectivo'">
                <small>Recepcion del efectivo</small><Tag :value="pago.recepcion" severity="warn" /><small>La firma desde la app y el recibo firmado se integraran despues. No se ha confirmado una firma.</small>
            </div>
        </div>
    </Fieldset>
</template>
<script>
export default { name: 'ResumenPagoSolicitud', props: { pago: { type: Object, default: null } } };
</script>
<style scoped>
@import './css/resumen.css';
</style>
