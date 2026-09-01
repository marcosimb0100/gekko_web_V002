<template>
    <div class="cif-cliente">
        <div class="cif-contenedor">
            <!-- ================================================= -->
            <!-- ENCABEZADO -->
            <!-- ================================================= -->

            <div class="cif-header">
                <div class="header-izquierda">
                    <Button type="button" severity="secondary" text rounded v-tooltip.top="'Regresar al portal'" @click="handleRegresar">
                        <template #icon>
                            <font-icon icon="fa-solid fa-arrow-left" />
                        </template>
                    </Button>

                    <div class="header-icono">
                        <font-icon icon="fa-solid fa-file-pdf" />
                    </div>

                    <div>
                        <h2>Constancia de Situación Fiscal</h2>

                        <p>Consulta o actualiza tu CIF registrado.</p>
                    </div>
                </div>

                <div v-if="nombreCliente" class="cliente-nombre">
                    {{ nombreCliente }}
                </div>
            </div>

            <!-- ================================================= -->
            <!-- ACCIONES -->
            <!-- ================================================= -->

            <div class="cif-acciones">
                <div>
                    <h3>CIF actual</h3>

                    <p>El archivo debe estar en formato PDF.</p>
                </div>

                <div class="botones-cif">
                    <input ref="inputArchivo" type="file" accept=".pdf,application/pdf" class="input-archivo-oculto" @change="handleSeleccionarArchivo" />

                    <Button type="button" :label="tieneCif ? 'Seleccionar nuevo CIF' : 'Seleccionar CIF'" severity="secondary" outlined @click="handleSeleccionarCif">
                        <template #icon>
                            <font-icon icon="fa-solid fa-file-arrow-up" class="mr-2" />
                        </template>
                    </Button>
                </div>
            </div>

            <!-- ================================================= -->
            <!-- ARCHIVO SELECCIONADO -->
            <!-- ================================================= -->

            <div v-if="archivoCif" class="archivo-seleccionado">
                <div class="archivo-info">
                    <div class="archivo-icono">
                        <font-icon icon="fa-solid fa-file-pdf" />
                    </div>

                    <div>
                        <strong>
                            {{ nombreArchivo }}
                        </strong>

                        <small> Archivo seleccionado para actualizar el CIF. </small>
                    </div>
                </div>

                <div class="archivo-botones">
                    <Button type="button" severity="secondary" text label="Cancelar" @click="handleCancelarArchivo" />

                    <Button type="button" label="Guardar CIF" class="btn-guardar-cif" :loading="guardandoCif" :disabled="botonGuardarDeshabilitado" @click="handleGuardarCif">
                        <template #icon>
                            <font-icon icon="fa-solid fa-floppy-disk" class="mr-2" />
                        </template>
                    </Button>
                </div>
            </div>

            <!-- ================================================= -->
            <!-- CONTENIDO -->
            <!-- ================================================= -->

            <div class="cif-documento">
                <!-- CARGANDO -->

                <div v-if="cargandoCif" class="estado-cif">
                    <i class="pi pi-spin pi-spinner" />

                    <span> Consultando CIF... </span>
                </div>

                <!-- PDF -->

                <iframe v-else-if="tieneCif && urlCif" :src="urlCif" title="Constancia de Situación Fiscal" class="cif-iframe" />

                <!-- SIN CIF -->

                <div v-else class="estado-cif sin-cif">
                    <div class="sin-cif-icono">
                        <font-icon icon="fa-solid fa-file-circle-exclamation" />
                    </div>

                    <h3>No hay un CIF registrado</h3>

                    <p>Selecciona tu Constancia de Situación Fiscal en formato PDF para registrarla.</p>

                    <Button type="button" label="Seleccionar CIF" class="btn-seleccionar-cif" @click="handleSeleccionarCif">
                        <template #icon>
                            <font-icon icon="fa-solid fa-file-arrow-up" class="mr-2" />
                        </template>
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import proceso from './js/proceso.js';

export default {
    name: 'CifCliente',

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
