<script setup>
import cargando from './components/cargando/Cargando.vue';
</script>

<template>
    <cargando></cargando>
    <ConfirmDialog></ConfirmDialog>
    <!-- <Toast /> -->
    <router-view />
</template>

<style scoped></style>
