<template>
    <div class="carga-masiva">
        <!-- ================================================= -->
        <!-- ENCABEZADO -->
        <!-- ================================================= -->

        <div class="carga-header">
            <div class="carga-header-info">
                <div class="header-icono">
                    <font-icon :icon="['fas', 'file-excel']" />
                </div>

                <div>
                    <h2>Carga masiva de solicitudes</h2>

                    <p>Valida y registra múltiples solicitudes desde un archivo Excel.</p>
                </div>
            </div>

            <Button type="button" label="Descargar plantilla" severity="secondary" outlined @click="handleDescargarPlantilla">
                <template #icon>
                    <font-icon :icon="['fas', 'download']" class="mr-2" />
                </template>
            </Button>
        </div>

        <!-- ================================================= -->
        <!-- CARGAR ARCHIVO -->
        <!-- ================================================= -->

        <div class="card-carga">
            <div class="card-titulo">
                <div>
                    <h3>Archivo Excel</h3>

                    <p>Selecciona la plantilla de carga masiva en formato .xlsx.</p>
                </div>
            </div>

            <input ref="inputArchivo" type="file" accept=".xlsx" class="input-archivo" @change="handleSeleccionarArchivo" />

            <!-- SIN ARCHIVO -->

            <div v-if="!archivoExcel" class="zona-carga" @click="handleAbrirArchivo">
                <div class="zona-icono">
                    <font-icon :icon="['fas', 'file-arrow-up']" />
                </div>

                <strong> Seleccionar archivo Excel </strong>

                <span> Haz clic para buscar la plantilla en tu equipo. </span>
            </div>

            <!-- ARCHIVO -->

            <div v-else class="archivo-seleccionado">
                <div class="archivo-info">
                    <div class="archivo-excel-icono">
                        <font-icon :icon="['fas', 'file-excel']" />
                    </div>

                    <div class="archivo-texto">
                        <strong>
                            {{ nombreArchivo }}
                        </strong>

                        <span> Archivo listo para validar </span>
                    </div>
                </div>

                <div class="archivo-acciones">
                    <Button type="button" label="Cambiar" severity="secondary" outlined @click="handleAbrirArchivo" />

                    <Button type="button" severity="danger" text rounded v-tooltip.top="'Quitar archivo'" @click="handleQuitarArchivo">
                        <template #icon>
                            <font-icon :icon="['fas', 'trash']" />
                        </template>
                    </Button>
                </div>
            </div>

            <!-- BOTON VALIDAR -->

            <div class="acciones-validacion">
                <Button type="button" label="Validar archivo" :loading="procesando" :disabled="!puedeValidar" @click="handleValidarArchivo">
                    <template #icon>
                        <font-icon :icon="['fas', 'list-check']" class="mr-2" />
                    </template>
                </Button>
            </div>
        </div>

        <!-- ================================================= -->
        <!-- RESULTADOS -->
        <!-- ================================================= -->

        <template v-if="tieneResultados">
            <!-- RESUMEN -->

            <div class="resumen-grid">
                <div class="resumen-card">
                    <span class="resumen-label"> Filas procesadas </span>

                    <strong>
                        {{ totalFilas }}
                    </strong>
                </div>

                <div class="resumen-card">
                    <span class="resumen-label"> Solicitudes </span>

                    <strong>
                        {{ totalSolicitudes }}
                    </strong>
                </div>

                <div class="resumen-card resumen-correcto">
                    <span class="resumen-label"> Correctas </span>

                    <strong>
                        {{ correctas }}
                    </strong>
                </div>

                <div class="resumen-card resumen-error">
                    <span class="resumen-label"> Con error </span>

                    <strong>
                        {{ conError }}
                    </strong>
                </div>
            </div>

            <!-- ================================================= -->
            <!-- SOLICITUDES CORRECTAS -->
            <!-- ================================================= -->

            <div v-if="solicitudes.length" class="resultado-card">
                <div class="resultado-header">
                    <div>
                        <h3>Solicitudes correctas</h3>

                        <p>Estas solicitudes están listas para ser registradas.</p>
                    </div>

                    <Tag :value="`${solicitudes.length} correctas`" severity="success" />
                </div>

                <DataTable :value="solicitudes" paginator :rows="10" :rowsPerPageOptions="[10, 25, 50]" size="small" stripedRows scrollable class="tabla-carga">
                    <template #empty> No existen solicitudes correctas. </template>

                    <Column field="solicitud_ref" header="Referencia" style="min-width: 130px" />

                    <Column field="compania" header="Empresa" style="min-width: 220px" />

                    <Column field="cliente" header="Cliente" style="min-width: 220px" />

                    <Column field="rfc_cliente" header="RFC" style="min-width: 140px" />

                    <Column field="banco" header="Banco" style="min-width: 140px" />

                    <Column header="Conceptos" style="width: 100px">
                        <template #body="slotProps">
                            {{ slotProps.data.conceptos?.length ?? 0 }}
                        </template>
                    </Column>

                    <Column field="uso_cfdi" header="Uso CFDI" style="width: 100px" />

                    <Column field="metodo_pago" header="Método" style="width: 100px" />

                    <Column field="forma_pago" header="Forma" style="width: 100px" />

                    <Column header="Subtotal" style="min-width: 130px">
                        <template #body="slotProps">
                            {{ handleMoney(slotProps.data.subtotal) }}
                        </template>
                    </Column>

                    <Column header="Total" style="min-width: 130px">
                        <template #body="slotProps">
                            <strong>
                                {{ handleMoney(slotProps.data.total) }}
                            </strong>
                        </template>
                    </Column>
                </DataTable>
            </div>

            <!-- ================================================= -->
            <!-- ERRORES -->
            <!-- ================================================= -->

            <div v-if="errores.length" class="resultado-card resultado-error">
                <div class="resultado-header">
                    <div>
                        <h3>Solicitudes con error</h3>

                        <p>Corrige estas filas en Excel y vuelve a procesar el archivo.</p>
                    </div>

                    <Tag :value="`${errores.length} errores`" severity="danger" />
                </div>

                <DataTable :value="errores" paginator :rows="10" :rowsPerPageOptions="[10, 25, 50]" size="small" stripedRows class="tabla-errores">
                    <template #empty> No existen errores. </template>

                    <Column field="solicitud_ref" header="Referencia" style="min-width: 140px">
                        <template #body="slotProps">
                            {{ slotProps.data.solicitud_ref || 'Sin referencia' }}
                        </template>
                    </Column>

                    <Column header="Fila(s)" style="min-width: 100px">
                        <template #body="slotProps">
                            {{ Array.isArray(slotProps.data.filas) ? slotProps.data.filas.join(', ') : (slotProps.data.fila ?? '-') }}
                        </template>
                    </Column>

                    <Column header="Error" style="min-width: 450px">
                        <template #body="slotProps">
                            <div class="mensaje-error">
                                <font-icon :icon="['fas', 'triangle-exclamation']" />

                                <span>
                                    {{ handleErroresTexto(slotProps.data) }}
                                </span>
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>

            <!-- ================================================= -->
            <!-- GUARDAR -->
            <!-- ================================================= -->

            <div v-if="solicitudes.length" class="footer-carga">
                <div class="footer-info">
                    <font-icon :icon="['fas', 'circle-info']" />

                    <span>
                        Se crearán
                        <strong>
                            {{ solicitudes.length }}
                        </strong>
                        solicitudes en estatus pendiente.
                    </span>
                </div>

                <Button type="button" :label="`Guardar ${solicitudes.length} solicitudes`" severity="success" :loading="guardando" :disabled="!puedeGuardar" @click="handleConfirmarGuardar">
                    <template #icon>
                        <font-icon :icon="['fas', 'floppy-disk']" class="mr-2" />
                    </template>
                </Button>
            </div>
        </template>
    </div>
</template>

<script>
import proceso from './js/proceso.js';

export default {
    name: 'CargaMasivaSolicitudes',

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
