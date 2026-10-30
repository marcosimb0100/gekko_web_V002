<template>
    <div class="sc-encabezado">
        <Encabezado titulo="Captura de sueldos" subtitulo="Registro de sueldos por empleado y periodo de pago" icono="pi pi-wallet" />
    </div>
    <div class="sc-contenedor">
        <section class="sc-card">
            <div class="sc-barra">
                <strong>Sueldos por periodo</strong>
                <div class="sc-herramientas">
                    <Select v-model="periodoId" :options="opcionesPeriodos" optionLabel="label" optionValue="value" placeholder="Selecciona un periodo" class="sc-periodos" :loading="cargandoPeriodos" @update:modelValue="cargarEmpleados" />
                    <Tag v-if="puedeCapturar" value="CAPTURABLE" severity="success" />
                    <Tag v-else-if="periodoSeleccionado" value="SOLO CONSULTA" severity="secondary" />
                    <InputText v-model="busqueda" placeholder="Buscar empleado, área o puesto" />
                    <Button icon="pi pi-refresh" outlined severity="secondary" :loading="cargando || cargandoPeriodos" @click="actualizar" aria-label="Actualizar" />
                    <Button label="Exportar Excel" icon="pi pi-file-excel" class="suel-exportar" :disabled="exportando || !filtrados.length" :loading="exportando" @click="exportarExcel" />
                </div>
            </div>
            <p class="sc-nota">
                <template v-if="periodoSeleccionado">
                    <strong>Periodo seleccionado:</strong> {{ periodoSeleccionado.fecha_inicial }} al {{ periodoSeleccionado.fecha_final }}.
                    <span v-if="puedeCapturar"> Puedes capturar y guardar sueldos.</span>
                    <span v-else> Periodo de solo consulta.</span>
                </template>
                <template v-else>Selecciona un periodo de pago.</template>
            </p>
            <DataTable :value="filtrados" paginator :rows="20" :rowsPerPageOptions="[20, 50, 100]" size="small" stripedRows scrollable :loading="cargando" class="sc-tabla">
                <template #empty><div class="sc-vacio">No hay empleados con estatus ALTA o REINGRESO para mostrar.</div></template>
                <Column header="Nombre" style="min-width: 240px"
                    ><template #body="{ data }">{{ nombre(data) }}</template></Column
                >
                <Column header="Área / Puesto" style="min-width: 220px"
                    ><template #body="{ data }">{{ data.area_nombre || '—' }} / {{ data.puesto_nombre || '—' }}</template></Column
                >
                <Column header="Sueldo 1" headerClass="sc-columna-moneda" bodyClass="sc-columna-moneda" style="min-width: 180px"
                    ><template #body="{ data }"
                        ><div class="sc-celda-moneda">
                            <InputNumber
                                v-model="data.sueldo_1"
                                mode="currency"
                                currency="MXN"
                                locale="es-MX"
                                :min="0"
                                :max="999999999.99"
                                :minFractionDigits="2"
                                :maxFractionDigits="2"
                                :disabled="!puedeCapturar || guardandoId === data._id"
                                class="sc-moneda"
                            /></div></template
                ></Column>
                <Column header="Sueldo 2" headerClass="sc-columna-moneda" bodyClass="sc-columna-moneda" style="min-width: 180px"
                    ><template #body="{ data }"
                        ><div class="sc-celda-moneda">
                            <InputNumber
                                v-model="data.sueldo_2"
                                mode="currency"
                                currency="MXN"
                                locale="es-MX"
                                :min="0"
                                :max="999999999.99"
                                :minFractionDigits="2"
                                :maxFractionDigits="2"
                                :disabled="!puedeCapturar || guardandoId === data._id"
                                class="sc-moneda"
                            /></div></template
                ></Column>
                <Column header="Total" headerClass="sc-columna-moneda" bodyClass="sc-columna-moneda" style="min-width: 160px"
                    ><template #body="{ data }"
                        ><strong class="sc-total-empleado">{{ moneda(totalEmpleado(data)) }}</strong></template
                    ></Column
                >
                <Column header="Acciones" style="min-width: 125px"
                    ><template #body="{ data }"
                        ><Button
                            label="Guardar"
                            icon="pi pi-save"
                            size="small"
                            :loading="guardandoId === data._id"
                            :disabled="!puedeCapturar || data.sueldo_1 == null || data.sueldo_2 == null || Boolean(guardandoId)"
                            @click="guardar(data)" /></template
                ></Column>
                <ColumnGroup type="footer"
                    ><Row>
                        <Column footer="TOTALES" :colspan="2" footerStyle="text-align: right;" />
                        <Column :footer="moneda(totales.sueldo1)" footerStyle="text-align: right;" />
                        <Column :footer="moneda(totales.sueldo2)" footerStyle="text-align: right;" />
                        <Column :footer="moneda(totales.general)" footerStyle="text-align: right;" />
                        <Column footer="" /> </Row
                ></ColumnGroup>
            </DataTable>
        </section>
    </div>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'CapturaSueldos',
    components: { Encabezado },
    setup() {
        return { ...proceso() };
    }
};
</script>
<style scoped>
@import './css/estilo.css';
</style>
