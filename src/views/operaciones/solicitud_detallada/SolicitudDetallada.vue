<template>
    <h3>Pagina Web - SolicitudDetallada</h3>
</template>

<script>
import proceso from './js/proceso.js';
export default {
    name: 'SolicitudDetallada',
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