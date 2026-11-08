<template>
    <Button icon="pi pi-bell" text rounded class="campana-notificaciones" :badge="sinLeer ? (sinLeer > 99 ? '99+' : String(sinLeer)) : undefined" badgeSeverity="danger" :aria-label="'Notificaciones: ' + sinLeer + ' sin leer'" title="Notificaciones" @click="handleMostrar" />
    <Dialog v-model:visible="mostrar" modal header="Notificaciones" :style="{ width: '34rem' }" :breakpoints="{ '640px': '95vw' }">
        <div class="notificaciones-cabecera">
            <Tag :value="sinLeer + ' sin leer'" :severity="sinLeer ? 'info' : 'secondary'" />
            <Button label="Limpiar leidas" icon="pi pi-trash" text :loading="archivando === 'leidas'" :disabled="total <= sinLeer || !!archivando || !!leyendo || cargando" @click="handleQuitar()" />
            <Button :label="etiquetaAvisos" :icon="avisosActivos ? 'pi pi-bell' : 'pi pi-bell-slash'" text :disabled="!soportaAvisos" :loading="solicitandoAvisos" title="Avisos del navegador para solicitudes y cancelaciones" @click="handleActivarAvisos" />
            <Button label="Actualizar" icon="pi pi-refresh" text :loading="cargando" @click="handleActualizar()" />
        </div>
        <Message v-if="ayudaAvisos" severity="info" :closable="false">{{ ayudaAvisos }}</Message>
        <Message v-if="error" severity="warn" :closable="false">{{ error }}</Message>
        <div v-if="!notificaciones.length && !cargando && !error" class="notificaciones-vacio">
            <i class="pi pi-bell" aria-hidden="true" /><span>No tienes notificaciones.</span>
        </div>
        <ul class="notificaciones-lista" :aria-busy="cargando">
            <li v-for="item in notificaciones" :key="item._id" :class="{ 'notificacion-nueva': !item.leida }">
                <div class="notificacion-titulo"><strong>{{ item.titulo }}</strong><Tag v-if="!item.leida" value="Nueva" severity="info" /></div>
                <p>{{ item.mensaje }}</p>
                <small>{{ handleFecha(item.fecha) }}</small>
                <div class="notificacion-acciones">
                    <Button v-if="!item.leida" icon="pi pi-check" label="Marcar leida" text size="small" :loading="leyendo === item._id" :disabled="!!leyendo || !!archivando" @click="handleLeer(item)" />
                    <Button :label="item.ruta === '/operaciones/cancelaciones' ? 'Ver cancelaciones' : 'Ver en Mesa'" icon="pi pi-arrow-right" text size="small" :disabled="!!leyendo || !!archivando" @click="handleLeer(item, true)" />
                    <Button label="Quitar" icon="pi pi-times" severity="secondary" text size="small" title="Quitar de mi campana" :loading="archivando === item._id" :disabled="!!leyendo || !!archivando" @click="handleQuitar(item)" />
                </div>
            </li>
        </ul>
        <template #footer>
            <div class="notificaciones-paginacion">
                <Button label="Anterior" icon="pi pi-angle-left" outlined :disabled="offset === 0 || cargando" @click="handlePagina(-1)" />
                <span>{{ total }} aviso(s)</span>
                <Button label="Siguiente" icon="pi pi-angle-right" outlined :disabled="offset + 20 >= total || cargando" @click="handlePagina(1)" />
                <Button label="Cerrar" text @click="handleCerrar" />
            </div>
        </template>
    </Dialog>
</template>
<script>
import proceso from './js/proceso.js';
export default { name: 'CampanaNotificaciones', setup() { return { ...proceso() }; } };
</script>
<style scoped>
@import './css/estilo.css';
</style>
