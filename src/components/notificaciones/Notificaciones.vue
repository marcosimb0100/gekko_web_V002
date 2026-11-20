<template>
    <Button icon="pi pi-bell" text rounded class="campana-notificaciones" :badge="sinLeer ? (sinLeer > 99 ? '99+' : String(sinLeer)) : undefined" badgeSeverity="danger" :aria-label="'Notificaciones: ' + sinLeer + ' sin leer'" title="Notificaciones" @click="handleMostrar" />
    <Dialog v-model:visible="mostrar" modal header="Notificaciones" :style="{ width: '56rem', height: 'min(42rem, 85vh)' }" :breakpoints="{ '900px': '95vw' }" :contentStyle="{ display: 'flex', flexDirection: 'column', minHeight: '0' }">
        <div class="notificaciones-cabecera">
            <Tag :value="sinLeer + ' sin leer'" :severity="sinLeer ? 'info' : 'secondary'" />
            <Button label="Limpiar leidas" icon="pi pi-trash" text :loading="archivando === 'leidas'" :disabled="total <= sinLeer || !!archivando || !!leyendo || cargando" @click="handleQuitar()" />
            <Button label="Limpiar todas" icon="pi pi-trash" text severity="danger" :loading="archivando === 'todas'" :disabled="!total || !!archivando || !!leyendo || cargando" @click="handleConfirmarLimpieza" />
            <Button :label="etiquetaAvisos" :icon="avisosActivos ? 'pi pi-bell' : 'pi pi-bell-slash'" text :disabled="!soportaAvisos" :loading="solicitandoAvisos" title="Avisos del navegador para solicitudes, cancelaciones, pagos y agenda" @click="handleActivarAvisos" />
            <Button label="Actualizar" icon="pi pi-refresh" text :loading="cargando" :disabled="cargando || !!leyendo || !!archivando" @click="handleActualizar()" />
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
                    <Button v-if="!item.leida" icon="pi pi-check" label="Marcar leida" text size="small" :loading="leyendo === item._id" :disabled="cargando || !!leyendo || !!archivando" @click="handleLeer(item)" />
                    <Button v-if="item.ruta" :label="item.ruta === '/juridico/agenda' ? 'Ver Agenda' : item.ruta === '/finanzas/pagos_programados' ? 'Ver pagos' : item.ruta === '/operaciones/cancelaciones' ? 'Ver cancelaciones' : 'Ver en Mesa'" icon="pi pi-arrow-right" text size="small" :disabled="cargando || !!leyendo || !!archivando" @click="handleLeer(item, true)" />
                    <Button label="Quitar" icon="pi pi-times" severity="secondary" text size="small" title="Quitar de mi campana" :loading="archivando === item._id" :disabled="cargando || !!leyendo || !!archivando" @click="handleQuitar(item)" />
                </div>
            </li>
        </ul>
        <template #footer>
            <div class="notificaciones-paginacion">
                <Button label="Anterior" icon="pi pi-angle-left" outlined :disabled="offset === 0 || cargando || !!leyendo || !!archivando" @click="handlePagina(-1)" />
                <span>{{ total }} aviso(s)</span>
                <Button label="Siguiente" icon="pi pi-angle-right" outlined :disabled="offset + 20 >= total || cargando || !!leyendo || !!archivando" @click="handlePagina(1)" />
                <Button label="Cerrar" text @click="handleCerrar" />
            </div>
        </template>
    </Dialog>
    <Dialog v-model:visible="confirmarLimpieza" modal header="Limpiar notificaciones" :style="{ width: '28rem' }" :breakpoints="{ '640px': '95vw' }" :closable="!archivando">
        <p>Se quitar&aacute;n todas tus notificaciones, incluidas las que no has le&iacute;do y las de otras p&aacute;ginas de esta lista.</p>
        <p>Esto solo limpia tu campana. No afecta las notificaciones de otros usuarios ni las solicitudes o tareas relacionadas. Los nuevos avisos seguir&aacute;n llegando.</p>
        <template #footer>
            <Button label="Cancelar" outlined :disabled="!!archivando" @click="confirmarLimpieza = false" />
            <Button label="Limpiar todas" icon="pi pi-trash" severity="danger" :loading="archivando === 'todas'" :disabled="cargando || !!archivando || !!leyendo" @click="handleQuitar(null, true)" />
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
