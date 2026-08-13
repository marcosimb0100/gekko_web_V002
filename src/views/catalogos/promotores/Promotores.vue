<template>
    <h3>Pagina Web - Promotores</h3>
</template>

<script>
import proceso from './js/proceso.js';
export default {
    name: 'Promotores',
    // components: {AppFooter, cargando},
    setup(){
      return{
        ...proceso()
      }
    }
}
</script>

<style scoped>
    @import './css/estilo.css';
</style>