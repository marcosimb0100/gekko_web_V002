<template>
    <Button v-if="actualizandoSat" type="button" class="layout-topbar-action sat-nube" text :title="'Actualizando SAT: ' + porcentaje + '%'" aria-label="Ver avance de actualizacion SAT" @click="handleMostrarDetalle">
        <font-icon icon="fa-solid fa-cloud-arrow-down" :class="{ 'sat-descargando': actualizandoSat }" />
        <span v-if="actualizandoSat" class="sat-porcentaje">{{ porcentaje }}%</span>
    </Button>
    <Dialog v-model:visible="mostrarDetalle" header="Actualizacion de CFDI" modal :style="{ width: '30rem' }" :breakpoints="{ '640px': '94vw' }">
        <div class="sat-avance">
            <div class="sat-resumen"><font-icon icon="fa-solid fa-cloud-arrow-down" /><div><strong>{{ avanceSat.empresa || 'Portal SAT' }}</strong><small>{{ avanceSat.tipo === 'recibidos' ? 'CFDI recibidos' : avanceSat.tipo === 'emitidos' ? 'CFDI emitidos' : 'Actualizacion de base' }}</small></div></div>
            <Tag :severity="actualizandoSat ? 'info' : avanceSat.estado === 'finalizado' ? 'success' : 'danger'" :value="actualizandoSat ? 'En proceso' : avanceSat.estado === 'finalizado' ? 'Finalizada' : 'Interrumpida'" />
            <p v-if="actualizandoSat">{{ descripcionSat }}</p>
            <ProgressBar :value="porcentaje" />
            <small v-if="actualizandoSat">Puedes continuar trabajando en Gekko. La actualizacion sigue en el servidor.</small>
            <div v-else-if="avanceSat.resultado" class="sat-totales"><span>CFDI procesados <strong>{{ resumen.procesados || 0 }}</strong></span><span>Proveedores nuevos <strong>{{ resumen.proveedores?.creados || 0 }}</strong></span><span>Actualizaciones de proveedores <strong>{{ resumen.proveedores?.actualizados || 0 }}</strong></span><span>Errores <strong>{{ resumen.errores || 0 }}</strong></span></div>
            <Message v-if="avanceSat.mensaje" severity="warn" :closable="false">{{ avanceSat.mensaje }}</Message>
            <Message v-if="resumen.detalle_errores?.length" severity="warn" :closable="false">{{ resumen.detalle_errores.length }} incidencias durante la actualizacion.</Message>
        </div>
        <template #footer><Button label="Cerrar" outlined @click="handleCerrarDetalle" /></template>
    </Dialog>
</template>
<script>
import proceso from './js/proceso';
export default { name: 'ActualizacionSat', setup() { return { ...proceso() }; } };
</script>
<style scoped>
@import './css/estilo.css';
</style>
