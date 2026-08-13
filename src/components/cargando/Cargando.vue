<template>
    <div class="loading" v-if="visibleCargando">
        Loading&#8230;
    </div>
</template>
  
<script>
    import proceso from './js/proceso.js';
    export default {
    name: 'cargando',
    setup(){   
            return {
                ...proceso()
            }
        }
    }
</script>
  
<style scoped>
    @import './css/estilo.css';
</style>
  