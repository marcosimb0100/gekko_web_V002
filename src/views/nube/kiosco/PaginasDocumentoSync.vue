<template>
    <div class="sync-documento" :aria-busy="cargando">
        <div class="sync-documento-barra">
            <Button type="button" icon="pi pi-angle-left" text aria-label="Página anterior" :disabled="pagina <= 1 || cargando" @click="pagina--" />
            <span>Página {{ pagina }} de {{ recurso.paginas }}</span>
            <Button type="button" icon="pi pi-angle-right" text aria-label="Página siguiente" :disabled="pagina >= recurso.paginas || cargando" @click="pagina++" />
            <Button type="button" icon="pi pi-minus" text aria-label="Reducir zoom" :disabled="zoom <= 50" @click="zoom -= 25" />
            <span>{{ zoom }}%</span>
            <Button type="button" icon="pi pi-plus" text aria-label="Aumentar zoom" :disabled="zoom >= 250" @click="zoom += 25" />
        </div>
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div v-if="cargando" role="status">Cargando página...</div>
        <div class="sync-documento-pagina"><img v-if="url" :src="url" :style="{ width: `${zoom}%` }" :alt="`Página ${pagina}`" draggable="false" @error="error = 'No fue posible mostrar esta página.'" /></div>
    </div>
</template>
<script setup>
import { ref, watch, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
const props = defineProps({ recurso: { type: Object, required: true } });
const store = useStore();
const pagina = ref(1), zoom = ref(100), url = ref(''), error = ref(''), cargando = ref(false);
let solicitud = 0;
const limpiar = () => { if (url.value) URL.revokeObjectURL(url.value); url.value = ''; };
watch(() => props.recurso, () => { pagina.value = 1; zoom.value = 100; });
watch([() => props.recurso, pagina], async () => {
    const actual = ++solicitud;
    limpiar(); error.value = ''; cargando.value = true;
    try {
        const parametros = new URLSearchParams({ revision: props.recurso.revision });
        const respuesta = await store.dispatch('api/apiGetblobSinCargando', { direccion: `/sync/archivos/${props.recurso.id}/visualizacion/paginas/${pagina.value}?${parametros}` });
        if (actual !== solicitud) return;
        if (respuesta.estatus !== 200 || !(respuesta.data instanceof Blob)) throw new Error(respuesta.mensaje || 'No fue posible cargar esta página.');
        url.value = URL.createObjectURL(respuesta.data);
    } catch (e) { if (actual === solicitud) error.value = e.message; }
    finally { if (actual === solicitud) cargando.value = false; }
}, { immediate: true });
onBeforeUnmount(() => { solicitud++; limpiar(); });
</script>
<style scoped>
.sync-documento { display: flex; flex-direction: column; flex: 1; min-height: 0; gap: .5rem; }
.sync-documento-barra { display: flex; align-items: center; gap: .2rem; flex-wrap: wrap; font-size: .75rem; }
.sync-documento-barra :deep(.p-button) { width: 1.8rem; height: 1.8rem; padding: 0; }
.sync-documento-pagina { flex: 1; min-height: 0; overflow: auto; background: #e5e7eb; padding: .5rem; }
.sync-documento-pagina img { max-width: none; display: block; height: auto; background: white; }
</style>
