<template>
    <div class="encabezado">
        <div class="encabezado-contenido">

            <div class="encabezado-icono" v-if="icono">
                <i :class="icono"></i>
            </div>

            <div class="encabezado-texto">
                <h1>{{ titulo }}</h1>

                <p v-if="subtitulo">
                    {{ subtitulo }}
                </p>
            </div>

        </div>

        <div class="encabezado-acciones">
            <slot></slot>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Encabezado',

    props: {
        titulo: {
            type: String,
            required: true
        },

        subtitulo: {
            type: String,
            default: ''
        },

        icono: {
            type: String,
            default: ''
        }
    }
}
</script>

<style>
    @import './css/estilo.css';
</style>