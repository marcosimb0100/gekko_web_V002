<template>
    <h3>Pagina Web - Usuarios</h3>
</template>

<script>
import proceso from './js/proceso.js';
export default {
    name: 'Usuarios',
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