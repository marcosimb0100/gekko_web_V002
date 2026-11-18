<template>
    <Encabezado :titulo="titulo" :subtitulo="subtitulo" :icono="icono"><Tag value="En preparación" severity="secondary" /></Encabezado>
    <div class="card contabilidad-pantalla"><div class="contabilidad-inicio"><i :class="icono" aria-hidden="true" /><h3>{{ titulo }}</h3><p>{{ descripcion }}</p><small>La operación contable se integrará en la siguiente etapa.</small></div></div>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
export default { name: 'Periodos', components: { Encabezado }, setup() { return { ...proceso() }; } };
</script>
<style scoped>
@import './css/estilo.css';
</style>
