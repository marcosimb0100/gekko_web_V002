<template>
    <div class="acceso-cliente-page">
        <div class="acceso-cliente-card">
            <!-- LOGO -->
            <div class="logo-cliente">
                <img v-if="logoUrl" :src="logoUrl" alt="Logo cliente" />

                <div v-else class="logo-placeholder">
                    <font-icon icon="fa-solid fa-building" />
                </div>
            </div>

            <!-- TITULO -->
            <div class="titulo-acceso">
                <h2>Portal de Clientes</h2>

                <p v-if="nombreCliente">
                    {{ nombreCliente }}
                </p>
            </div>

            <!-- FORM -->
            <form @submit.prevent="handleAcceso" class="form-acceso">
                <div class="campo-acceso">
                    <label for="usuario"> Usuario </label>

                    <InputText id="usuario" v-model="frmAcceso.usuario" class="w-full" autocomplete="username" />
                </div>

                <div class="campo-acceso">
                    <label for="password"> Contraseña </label>

                    <Password id="password" v-model="frmAcceso.password" :feedback="false" toggleMask class="w-full" inputClass="w-full" autocomplete="current-password" />
                </div>

                <Button type="submit" label="Ingresar" class="btn-ingresar w-full" :disabled="botonAccesoDeshabilitado">
                    <template #icon>
                        <font-icon icon="fa-solid fa-right-to-bracket" class="mr-2" />
                    </template>
                </Button>
            </form>
        </div>
    </div>
</template>

<script>
import proceso from './js/proceso.js';

export default {
    name: 'AccesoCliente',

    setup() {
        return {
            ...proceso()
        };
    }
};
</script>

<style scoped>
@import './css/estilo.css';
</style>
