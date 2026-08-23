<template>
    <Encabezado titulo="Carga Masiva CFDI" subtitulo="Carga masiva de archivos CFDI" icono="pi pi-upload" />

    <div class="card p-0 m-0" style="height: 72vh">
        <ScrollPanel style="height: 65vh">
            <div class="contenedor-carga">
                <div class="card-carga">
                    <div class="titulo-carga">
                        <font-icon icon="fa-solid fa-file-zipper" />
                        <span>Carga Masiva CFDI</span>
                    </div>

                    <FileUpload ref="fileUploadRef" name="archivo_zip" accept=".zip" :maxFileSize="100000000" customUpload chooseLabel="Seleccionar archivo" uploadLabel="Cargar CFDI" cancelLabel="Cancelar" @uploader="handleCargaMasiva">
                        <template #empty>
                            <div class="zona-vacia">
                                <font-icon icon="fa-solid fa-cloud-arrow-up" class="icono-carga" />

                                <span> Arrastra aquí tu archivo ZIP de CFDI. </span>

                                <small> Tamaño máximo: 100 MB </small>
                            </div>
                        </template>
                    </FileUpload>
                </div>
            </div>
        </ScrollPanel>
    </div>
</template>

<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'CargaMasivaCfdi',

    components: {
        Encabezado
    },

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
