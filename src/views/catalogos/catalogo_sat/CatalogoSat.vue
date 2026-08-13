<template>
    <h3>Pagina Web - CatalogoSat</h3>
</template>

<script>
import proceso from './js/proceso.js';
export default {
    name: 'CatalogoSat',
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