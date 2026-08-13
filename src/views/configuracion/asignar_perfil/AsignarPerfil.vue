<template>
    <h3>Pagina Web - AsignarPerfil</h3>
</template>

<script>
import proceso from './js/proceso.js';
export default {
    name: 'AsignarPerfil',
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