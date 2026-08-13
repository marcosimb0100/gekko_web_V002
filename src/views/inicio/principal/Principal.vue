<template>
    <h3>Pagina Web - principal</h3>
</template>

<script>
import proceso from './js/proceso.js';
export default {
    name: 'Principal',
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