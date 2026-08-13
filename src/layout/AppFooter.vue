<script setup>
    const appCliente = import.meta.env.VITE_APP_CLIENT;
    const appVersion = import.meta.env.VITE_APP_VERSION;
</script>

<template>
    <div class="layout-footer">
        <img
            src="@/assets/images/logo_gekko.png"
            alt="Logo Sociedad Ballfudr"
            width="40"
        />
        by
        <!-- <a href="https://primevue.org" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">{{appCliente}}</a> -->
        <label class="text-primary font-bold">{{appCliente}}</label>
    </div>
</template>
