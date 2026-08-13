<template>
    <h3>Pagina Web - CargaMasivaCfdi</h3>
</template>

<script>
import proceso from './js/proceso.js';
export default {
    name: 'CargaMasivaCfdi',
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