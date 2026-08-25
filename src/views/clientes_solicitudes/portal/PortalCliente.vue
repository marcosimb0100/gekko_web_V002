<template>
    <div class="portal-cliente">
        <div class="portal-contenedor">
            <!-- ENCABEZADO -->
            <div class="portal-header">
                <div class="portal-logo">
                    <img v-if="logoUrl" :src="logoUrl" alt="Logo cliente" />

                    <div v-else class="portal-logo-placeholder">
                        <font-icon icon="fa-solid fa-building" />
                    </div>
                </div>

                <div>
                    <h2>Portal de Clientes</h2>

                    <p v-if="nombreCliente">
                        {{ nombreCliente }}
                    </p>
                </div>
            </div>

            <!-- OPCIONES -->
            <div class="portal-opciones">
                <!-- CONCEPTOS -->
                <div class="portal-card" @click="handleIrConceptos">
                    <div class="portal-card-icon">
                        <font-icon icon="fa-solid fa-list-check" />
                    </div>

                    <div class="portal-card-content">
                        <h3>Conceptos facturables</h3>

                        <p>Consulta los conceptos disponibles para facturación.</p>
                    </div>

                    <font-icon icon="fa-solid fa-chevron-right" class="portal-card-arrow" />
                </div>

                <!-- CIF -->
                <div class="portal-card" @click="handleIrCif">
                    <div class="portal-card-icon">
                        <font-icon icon="fa-solid fa-file-lines" />
                    </div>

                    <div class="portal-card-content">
                        <h3>CIF actual</h3>

                        <p>Consulta o descarga tu Constancia de Situación Fiscal actual.</p>
                    </div>

                    <font-icon icon="fa-solid fa-chevron-right" class="portal-card-arrow" />
                </div>

                <!-- SOLICITUD -->
                <div class="portal-card" @click="handleIrSolicitud">
                    <div class="portal-card-icon">
                        <font-icon icon="fa-solid fa-file-circle-plus" />
                    </div>

                    <div class="portal-card-content">
                        <h3>Solicitud</h3>

                        <p>Genera una nueva solicitud de facturación.</p>
                    </div>

                    <font-icon icon="fa-solid fa-chevron-right" class="portal-card-arrow" />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import proceso from './js/proceso.js';

export default {
    name: 'PortalCliente',

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
