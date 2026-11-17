<template>
    <div class="sync-vista-contenido" :aria-busy="cargando">
        <div v-if="cargando" class="sync-vista-espera" role="status">
            <i class="pi pi-spin pi-spinner" aria-hidden="true" />
            <p>{{ office ? 'Preparando vista previa. La primera apertura puede tardar unos minutos...' : 'Cargando vista previa...' }}</p>
            <ProgressBar mode="indeterminate" aria-label="Cargando vista previa" />
        </div>
        <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>
        <HojaCalculoSync v-else-if="libro" :archivo="libro" />
        <PaginasDocumentoSync v-else-if="documento" :recurso="documento" />
        <template v-else-if="url">
            <div class="sync-vista-imagen"><img :src="url" :alt="nombre" @error="$emit('error')" /></div>
            <small v-if="office">Vista de lectura en PDF. El formato puede variar; PowerPoint se muestra sin animaciones.</small>
        </template>
        <div v-else class="sync-vista-vacia">
            <i class="pi pi-eye" aria-hidden="true" />
            <strong>Vista previa</strong>
            <span>{{ vacio }}</span>
        </div>
    </div>
</template>

<script setup>
import HojaCalculoSync from './HojaCalculoSync.vue';
import PaginasDocumentoSync from './PaginasDocumentoSync.vue';
defineProps({
    cargando: Boolean, office: Boolean, error: String, url: String, tipo: String, nombre: String,
    libro: Object, documento: Object,
    vacio: { type: String, default: 'Selecciona un archivo para visualizar su contenido.' }
});
defineEmits(['error']);
</script>

<style scoped>
.sync-vista-contenido { display: flex; flex-direction: column; gap: .65rem; height: 100%; min-height: 0; padding: .75rem; }
.sync-vista-pdf { width: 100%; flex: 1; min-height: 15rem; border: 0; background: var(--surface-ground); }
.sync-vista-imagen { display: flex; flex: 1; min-height: 0; overflow: auto; align-items: center; justify-content: center; }
.sync-vista-imagen img { max-width: 100%; max-height: 100%; object-fit: contain; }
.sync-vista-vacia, .sync-vista-espera { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; gap: .85rem; text-align: center; padding: 1rem; color: var(--text-color-secondary); }
.sync-vista-vacia i, .sync-vista-espera i { font-size: 2rem; color: var(--primary-color); }
.sync-vista-espera :deep(.p-progressbar) { width: min(18rem, 100%); height: .3rem; }
small { color: var(--text-color-secondary); font-size: .75rem; }
</style>
