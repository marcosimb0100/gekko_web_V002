<template>
    <!-- ENCABEZADO -->
    <div class="sc-encabezado">
        <Encabezado titulo="Captura de sueldos" subtitulo="Registro de sueldos por empleado y periodo de pago" icono="pi pi-wallet" />
    </div>

    <!-- CONTENEDOR PRINCIPAL -->
    <div class="sc-contenedor">
        <section class="sc-card">
            <!-- BARRA DE HERRAMIENTAS -->
            <div class="sc-barra">
                <strong>Sueldos por periodo</strong>

                <div class="sc-herramientas">
                    <!-- SELECCIÓN DE PERIODO -->
                    <Select v-model="periodoSeleccionado" :options="opcionesPeriodos" optionLabel="label" optionValue="value" placeholder="Seleccionar periodo" class="sc-periodos" />

                    <!-- ESTATUS DEL PERIODO -->
                    <Tag v-if="periodoActual" :value="periodoActual.capturable ? 'CAPTURABLE' : 'CONSULTA'" :severity="periodoActual.capturable ? 'success' : 'secondary'" />

                    <!-- BUSCADOR -->
                    <InputText v-model="busqueda" placeholder="Buscar empleado, área o puesto" class="sc-busqueda" />

                    <!-- ACTUALIZAR -->
                    <Button icon="pi pi-refresh" severity="secondary" outlined aria-label="Actualizar" :loading="cargando" @click="cargarDatos" />

                    <!-- EXPORTAR EXCEL -->
                    <Button label="Exportar Excel" icon="pi pi-file-excel" class="sc-exportar" :disabled="cargando || exportando || !filtrados.length" :loading="exportando" @click="exportarExcel" />
                </div>
            </div>

            <!-- INFORMACIÓN DEL PERIODO -->
            <p class="sc-nota" v-if="periodoActual">
                Periodo seleccionado:
                {{ periodoActual.fecha_inicial }}
                al
                {{ periodoActual.fecha_final }}.

                <span v-if="periodoActual.capturable"> Puedes capturar y guardar sueldos. </span>

                <span v-else> Este periodo es solo de consulta. No permite modificar los importes. </span>
            </p>

            <p class="sc-nota" v-else>Selecciona un periodo para consultar o capturar sueldos.</p>

            <!-- TABLA DE SUELDOS -->
            <DataTable :value="filtrados" paginator :rows="20" :rowsPerPageOptions="[20, 50, 100]" size="small" scrollable stripedRows :loading="cargando" class="sc-tabla">
                <template #empty>
                    <div class="sc-vacio">No hay empleados para mostrar.</div>
                </template>

                <!-- NOMBRE DEL EMPLEADO -->
                <Column header="Nombre" headerStyle="width: 25%; min-width: 230px;" bodyStyle="width: 25%; min-width: 230px;">
                    <template #body="{ data }">
                        {{ nombre(data) }}
                    </template>

                    <template #footer>
                        <span class="sc-etiqueta-total"> TOTALES </span>
                    </template>
                </Column>

                <!-- ÁREA Y PUESTO -->
                <Column header="Área / Puesto" headerStyle="width: 22%; min-width: 180px;" bodyStyle="width: 22%; min-width: 180px;">
                    <template #body="{ data }">
                        {{ data.area_nombre || '—' }}
                        /
                        {{ data.puesto_nombre || '—' }}
                    </template>
                </Column>

                <!-- SUELDO 1 -->
                <Column header="Sueldo 1" headerClass="sc-columna-moneda" bodyClass="sc-columna-moneda" footerClass="sc-columna-moneda" headerStyle="width: 16%; min-width: 180px;" bodyStyle="width: 16%; min-width: 180px;">
                    <template #body="{ data }">
                        <div class="sc-celda-moneda">
                            <InputNumber v-model="data.sueldo_1" mode="currency" currency="MXN" locale="es-MX" :min="0" :minFractionDigits="2" :maxFractionDigits="2" :disabled="!periodoActual?.capturable" class="sc-moneda" />
                        </div>
                    </template>

                    <template #footer>
                        <div class="sc-importe-total">
                            {{ moneda(totalSueldo1) }}
                        </div>
                    </template>
                </Column>

                <!-- SUELDO 2 -->
                <Column header="Sueldo 2" headerClass="sc-columna-moneda" bodyClass="sc-columna-moneda" footerClass="sc-columna-moneda" headerStyle="width: 16%; min-width: 180px;" bodyStyle="width: 16%; min-width: 180px;">
                    <template #body="{ data }">
                        <div class="sc-celda-moneda">
                            <InputNumber v-model="data.sueldo_2" mode="currency" currency="MXN" locale="es-MX" :min="0" :minFractionDigits="2" :maxFractionDigits="2" :disabled="!periodoActual?.capturable" class="sc-moneda" />
                        </div>
                    </template>

                    <template #footer>
                        <div class="sc-importe-total">
                            {{ moneda(totalSueldo2) }}
                        </div>
                    </template>
                </Column>

                <!-- TOTAL POR EMPLEADO -->
                <Column header="Total" headerClass="sc-columna-moneda" bodyClass="sc-columna-moneda" footerClass="sc-columna-moneda" headerStyle="width: 13%; min-width: 145px;" bodyStyle="width: 13%; min-width: 145px;">
                    <template #body="{ data }">
                        <div class="sc-total-empleado">
                            {{ moneda(Number(data.sueldo_1 || 0) + Number(data.sueldo_2 || 0)) }}
                        </div>
                    </template>

                    <template #footer>
                        <div class="sc-importe-total sc-total-general">
                            {{ moneda(totalGeneral) }}
                        </div>
                    </template>
                </Column>

                <!-- ACCIONES -->
                <Column header="Acciones" headerClass="sc-columna-acciones" bodyClass="sc-columna-acciones" headerStyle="width: 8%; min-width: 130px;" bodyStyle="width: 8%; min-width: 130px;">
                    <template #body="{ data }">
                        <Button v-if="periodoActual?.capturable" label="Guardar" icon="pi pi-save" size="small" :loading="data.guardando" @click="guardarSueldo(data)" />

                        <span v-else class="sc-solo-consulta"> Solo consulta </span>
                    </template>
                </Column>
            </DataTable>
        </section>
    </div>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'CapturaSueldos',

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
