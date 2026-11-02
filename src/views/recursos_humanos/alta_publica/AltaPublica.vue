<template>
    <main class="alta-publica">
        <div class="alta-publica-marca"><img src="@/assets/images/logo_gekko.png" alt="Gekko" /></div>
        <Toast />
        <AltaPersonal :key="$route.params.token" />
    </main>
</template>

<script>
import AltaPersonal from '../alta_personal/AltaPersonal.vue';
import proceso from './js/proceso';
export default { name: 'AltaPersonalPublica', components: { AltaPersonal }, setup() { return { ...proceso() }; } };
</script>

<style scoped>
@import './css/estilo.css';
</style>
