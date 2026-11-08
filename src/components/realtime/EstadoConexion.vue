<template>
    <Button class="estado-tiempo-real" :class="'estado-' + estadoSocket.estado" :icon="icono" text size="small" :title="'Tiempo real: ' + etiqueta" :aria-label="'Estado de tiempo real: ' + etiqueta" @click="handleMostrarDetalle" />
    <Dialog v-model:visible="mostrarDetalle" modal header="Conexión en tiempo real" :style="{ width: '30rem' }" :breakpoints="{ '640px': '95vw' }">
        <div class="conexion-detalle">
            <Tag :value="etiqueta" :severity="severidad" />
            <p>{{ estadoSocket.mensaje }}</p>
            <small>Una interrupción del socket no cierra tu sesión de Gekko.</small>
            <div v-if="estadoSocket.ultimoAviso" class="conexion-prueba" role="status">
                <i class="pi pi-check-circle" aria-hidden="true" />
                <span>{{ estadoSocket.ultimoAviso.mensaje }}</span>
            </div>
        </div>
        <template #footer>
            <Button v-if="!estadoSocket.autorizado && estadoSocket.estado !== 'sesion_vencida'" label="Reconectar" icon="pi pi-refresh" outlined :disabled="['conectando', 'reconectando'].includes(estadoSocket.estado)" @click="handleReconectar" />
            <Button label="Probar aviso privado" icon="pi pi-send" :loading="probando" :disabled="!estadoSocket.autorizado || probando" @click="handleProbarAviso" />
            <Button label="Cerrar" outlined @click="handleCerrarDetalle" />
        </template>
    </Dialog>
</template>

<script>
import proceso from './js/proceso.js';
export default {
    name: 'EstadoConexion',
    setup() { return { ...proceso() }; }
};
</script>

<style scoped>
@import './css/estilo.css';
</style>
