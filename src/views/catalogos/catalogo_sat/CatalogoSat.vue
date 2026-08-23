<template>
    <Encabezado titulo="Catálogos SAT" subtitulo="Consulta de catálogos del SAT" icono="pi pi-list-check" />

    <div class="card p-0 m-0" style="height: 72vh">
        <Tabs value="0">
            <TabList>
                <Tab value="0">Régimen Fiscal</Tab>
                <Tab value="1">Banco</Tab>
                <Tab value="2">Clave Unidad</Tab>
                <Tab value="3">Exportación</Tab>
                <Tab value="4">Objeto Impuestos</Tab>
                <Tab value="5">Uso CFDI</Tab>
                <Tab value="6">Método Pago</Tab>
                <Tab value="7">Forma Pago</Tab>
            </TabList>

            <TabPanels>
                <!-- REGIMEN FISCAL -->
                <TabPanel value="0">
                    <DataTable :value="catSat.regimen_fiscal" paginator :rows="100" :rowsPerPageOptions="[100, 250, 500, 700]" scrollable scrollHeight="54vh" size="small" tableStyle="min-width: 45rem" class="tabla-encabezados">
                        <template #empty>No se encontraron registros.</template>

                        <Column field="regimen_fiscal" header="Régimen Fiscal" headerClass="encabezado-columna" />
                        <Column field="descripcion" header="Descripción" headerClass="encabezado-columna" />
                        <Column field="fisica" header="Física" headerClass="encabezado-columna" />
                        <Column field="moral" header="Moral" headerClass="encabezado-columna" />
                    </DataTable>
                </TabPanel>

                <!-- BANCO -->
                <TabPanel value="1">
                    <DataTable :value="catSat.banco" paginator :rows="100" :rowsPerPageOptions="[100, 250, 500, 700]" scrollable scrollHeight="54vh" size="small" tableStyle="min-width: 45rem" class="tabla-encabezados">
                        <template #empty>No se encontraron registros.</template>

                        <Column field="clabe_banco" header="Clabe Banco" headerClass="encabezado-columna" />
                        <Column field="descripcion" header="Descripción" headerClass="encabezado-columna" />
                        <Column field="razon_social" header="Razón Social" headerClass="encabezado-columna" />
                    </DataTable>
                </TabPanel>

                <!-- CLAVE UNIDAD -->
                <TabPanel value="2">
                    <DataTable :value="catSat.clave_unidad" paginator :rows="100" :rowsPerPageOptions="[100, 250, 500, 700]" scrollable scrollHeight="54vh" size="small" tableStyle="min-width: 45rem" class="tabla-encabezados">
                        <template #empty>No se encontraron registros.</template>

                        <Column field="clave_unidad" header="Clave Unidad" headerClass="encabezado-columna" />
                        <Column field="descripcion" header="Descripción" headerClass="encabezado-columna" />
                        <Column field="razon_social" header="Razón Social" headerClass="encabezado-columna" />
                    </DataTable>
                </TabPanel>

                <!-- EXPORTACION -->
                <TabPanel value="3">
                    <DataTable :value="catSat.exportacion" paginator :rows="100" :rowsPerPageOptions="[100, 250, 500, 700]" scrollable scrollHeight="54vh" size="small" tableStyle="min-width: 45rem" class="tabla-encabezados">
                        <template #empty>No se encontraron registros.</template>

                        <Column field="exportacion" header="Exportación" headerClass="encabezado-columna" />
                        <Column field="descripcion" header="Descripción" headerClass="encabezado-columna" />
                    </DataTable>
                </TabPanel>

                <!-- OBJETO IMPUESTOS -->
                <TabPanel value="4">
                    <DataTable :value="catSat.objeto_imp" paginator :rows="100" :rowsPerPageOptions="[100, 250, 500, 700]" scrollable scrollHeight="54vh" size="small" tableStyle="min-width: 45rem" class="tabla-encabezados">
                        <template #empty>No se encontraron registros.</template>

                        <Column field="objeto_imp" header="Objeto Impuesto" headerClass="encabezado-columna" />
                        <Column field="descripcion" header="Descripción" headerClass="encabezado-columna" />
                    </DataTable>
                </TabPanel>

                <!-- USO CFDI -->
                <TabPanel value="5">
                    <DataTable :value="catSat.uso_cfdi" paginator :rows="100" :rowsPerPageOptions="[100, 250, 500, 700]" scrollable scrollHeight="54vh" size="small" tableStyle="min-width: 45rem" class="tabla-encabezados">
                        <template #empty>No se encontraron registros.</template>

                        <Column field="uso_cfdi" header="Uso CFDI" headerClass="encabezado-columna" />
                        <Column field="descripcion" header="Descripción" headerClass="encabezado-columna" />
                        <Column field="fisica" header="Física" headerClass="encabezado-columna" />
                        <Column field="moral" header="Moral" headerClass="encabezado-columna" />
                    </DataTable>
                </TabPanel>

                <!-- METODO PAGO -->
                <TabPanel value="6">
                    <DataTable :value="catSat.metodo_pago" paginator :rows="100" :rowsPerPageOptions="[100, 250, 500, 700]" scrollable scrollHeight="54vh" size="small" tableStyle="min-width: 45rem" class="tabla-encabezados">
                        <template #empty>No se encontraron registros.</template>

                        <Column field="metodo_pago" header="Método Pago" headerClass="encabezado-columna" />
                        <Column field="descripcion" header="Descripción" headerClass="encabezado-columna" />
                    </DataTable>
                </TabPanel>

                <!-- FORMA PAGO -->
                <TabPanel value="7">
                    <DataTable :value="catSat.forma_pago" paginator :rows="100" :rowsPerPageOptions="[100, 250, 500, 700]" scrollable scrollHeight="54vh" size="small" tableStyle="min-width: 45rem" class="tabla-encabezados">
                        <template #empty>No se encontraron registros.</template>

                        <Column field="forma_pago" header="Forma Pago" headerClass="encabezado-columna" />
                        <Column field="descripcion" header="Descripción" headerClass="encabezado-columna" />
                    </DataTable>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'CatalogosSat',
    components: { Encabezado },
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
