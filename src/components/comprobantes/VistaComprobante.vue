<template>
    <Button icon="pi pi-eye" text title="Vista previa del comprobante" aria-label="Vista previa del comprobante" :disabled="disabled" @click="handleMostrar" />
    <Dialog v-model:visible="mostrar" modal header="Vista previa del comprobante" :style="{ width: '65rem', maxWidth: '96vw' }" @hide="handleCerrar">
        <div class="comprobante-nombre">{{ archivo.nombre }}</div>
        <div class="comprobante-visor" :aria-busy="cargando">
            <div v-if="cargando" class="comprobante-espera"><ProgressSpinner style="width: 3rem; height: 3rem" /><span>Cargando comprobante...</span></div>
            <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>
            <iframe v-else-if="url && tipo === 'application/pdf'" :src="url" title="Comprobante PDF" />
            <img v-else-if="url" :src="url" :alt="archivo.nombre" @error="handleError" />
        </div>
        <template #footer><Button label="Cerrar" outlined @click="mostrar = false" /></template>
    </Dialog>
</template>
<script>
import proceso from './js/proceso';
export default {
    name: 'VistaComprobante',
    props: { archivo: { type: Object, required: true }, direccion: { type: String, required: true }, disabled: Boolean },
    setup(props) {
        return { ...proceso(props) };
    }
};
</script>
<style scoped>
@import './css/estilo.css';
</style>
