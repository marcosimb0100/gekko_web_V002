<template>
    <div class="archivos-portal">
        <Toast />
        <header class="archivos-portal-cabecera">
            <div class="archivos-portal-marca"><i class="pi pi-cloud" aria-hidden="true" /><div><strong>Gekko Archivos</strong><span>Tu espacio de documentos</span></div></div>
            <div class="archivos-portal-usuario"><i class="pi pi-user" aria-hidden="true" /><span>{{ nombre }}</span><Button type="button" label="Cerrar sesión" icon="pi pi-sign-out" text size="small" :loading="cerrando" @click="cerrarSesion" /></div>
        </header>
        <main class="archivos-portal-principal"><Kiosco :key="claveUbicacion" portal /></main>
        <footer><i class="pi pi-shield" aria-hidden="true" /> Acceso según los permisos de tu cuenta <span>Gekko Sync</span></footer>
    </div>
</template>
<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import { desconectarSocket, registrarCierreSesion } from '../../../helpers/socket';
import { destinoAccesoArchivos } from '../../../helpers/archivosPortal';
import Kiosco from '../kiosco/Kiosco.vue';
const route = useRoute(), router = useRouter(), store = useStore(), toast = useToast();
const nombre = localStorage.getItem('nombre_completo') || 'Mi cuenta';
const cerrando = ref(false);
const claveUbicacion = computed(() => `${route.query.espacio || ''}:${route.query.carpeta || ''}`);
const salir = motivo => {
    const destino = destinoAccesoArchivos(route.query, motivo);
    desconectarSocket(); localStorage.clear(); router.replace(destino);
};
const quitarCierre = registrarCierreSesion(() => salir('sesion'));
onBeforeUnmount(quitarCierre);
const cerrarSesion = async () => {
    if (cerrando.value) return;
    cerrando.value = true;
    try {
        const respuesta = await store.dispatch('api/apiCerrarSesionWeb');
        if (![200, 401].includes(respuesta.estatus)) throw new Error(respuesta.mensaje || 'No fue posible cerrar la sesión. Intenta nuevamente.');
        salir();
    } catch (e) { toast.add({ severity: 'error', summary: 'Sesión', detail: e.message, life: 5000 }); }
    finally { cerrando.value = false; }
};
</script>
<style scoped>
.archivos-portal { min-height: 100dvh; background: var(--surface-ground, #eef3f8); display: flex; flex-direction: column; }
.archivos-portal-cabecera { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; padding: .9rem 2rem; background: var(--surface-card, white); border-bottom: 1px solid var(--surface-border, #e1e8ef); box-shadow: 0 2px 12px #18344a08; }
.archivos-portal-marca, .archivos-portal-usuario { display: flex; align-items: center; gap: .8rem; }.archivos-portal-marca > i { color: #078bc2; font-size: 2rem; }.archivos-portal-marca > div { display: flex; flex-direction: column; gap: .2rem; }.archivos-portal-marca strong { font-size: 1.15rem; }.archivos-portal-marca span, .archivos-portal-usuario { font-size: .8rem; color: var(--text-color-secondary); }
.archivos-portal-principal { flex: 1; padding: 1.5rem 2rem 0; min-width: 0; }.archivos-portal-principal :deep(.sync-explorador) { height: 62vh; }.archivos-portal-principal :deep(.card) { border: 1px solid var(--surface-border); border-radius: .75rem; padding: 1rem; }
footer { display: flex; align-items: center; gap: .5rem; padding: .75rem 2rem 1.25rem; color: var(--text-color-secondary); font-size: .75rem; }footer > span { margin-left: auto; }
@media(max-width: 900px) { .archivos-portal-principal :deep(.sync-explorador) { height: 85vh; } }
@media(max-width: 600px) { .archivos-portal-cabecera, footer { padding-left: 1rem; padding-right: 1rem; }.archivos-portal-principal { padding: 1rem .5rem 0; }.archivos-portal-usuario { width: 100%; justify-content: flex-end; } }
</style>
