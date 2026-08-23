<template>
    <Encabezado titulo="Impuestos" subtitulo="Administración de impuestos del sistema" icono="pi pi-percentage">
        <Button type="button" label="Nuevo" class="w-full btn-nuevo" @click="handleMostrarFormulario('N')" v-if="!mostrarTablaFormulario">
            <template #icon><font-icon icon="fa-solid fa-plus" class="mr-2" /></template>
        </Button>

        <Button type="button" label="Cancelar" class="w-full btn-cancelar" @click="handleMostrarFormulario('C')" v-if="mostrarTablaFormulario">
            <template #icon><font-icon icon="fa-solid fa-xmark" class="mr-2" /></template>
        </Button>

        <Button type="submit" label="Guardar" class="w-full btn-guardar" form="formImpuesto" v-if="mostrarTablaFormulario" :disabled="botonGuardarDeshabilitado">
            <template #icon><font-icon icon="fa-solid fa-floppy-disk" class="mr-2" /></template>
        </Button>
    </Encabezado>

    <div class="card p-0 m-0" style="height: 72vh">
        <!-- TABLA -->
        <ScrollPanel style="height: 65vh" v-if="!mostrarTablaFormulario">
            <DataTable
                v-model:filters="filtros"
                :value="tablaImpuestos"
                :globalFilterFields="['etiqueta_tipo', 'etiqueta_codigo_fiscal', 'descripcion', 'tipo_factor', 'tasa']"
                paginator
                :rows="100"
                :rowsPerPageOptions="[100, 125, 150, 200]"
                scrollable
                scrollHeight="54vh"
                size="small"
                tableStyle="min-width: 50rem"
                class="tabla-encabezados"
            >
                <template #header>
                    <div class="flex justify-content-between">
                        <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined style="margin-right: 5px" @click="handleLimpiarFiltro" />

                        <IconField iconPosition="left">
                            <InputIcon><i class="pi pi-search" /></InputIcon>
                            <InputText v-model="filtros.global.value" placeholder="Buscar..." />
                        </IconField>
                    </div>
                </template>

                <template #empty>No se encontraron registros.</template>

                <Column field="etiqueta_tipo" header="Tipo" headerClass="encabezado-columna" />
                <Column field="etiqueta_codigo_fiscal" header="Impuesto" headerClass="encabezado-columna" />
                <Column field="descripcion" header="Descripción" headerClass="encabezado-columna" />
                <Column field="tipo_factor" header="Tipo Factor" headerClass="encabezado-columna" />
                <Column field="tasa" header="Tasa/Cuota" headerClass="encabezado-columna" />

                <Column header="Activo" headerClass="encabezado-columna">
                    <template #body="slotProps">
                        <span v-if="slotProps.data.activo === false" style="font-size: 15px; color: red"><font-icon :icon="['fas', 'circle-minus']" /></span>
                        <span v-if="slotProps.data.activo === true" style="font-size: 15px; color: green"><font-icon :icon="['fas', 'circle-check']" /></span>
                    </template>
                </Column>

                <Column header="Opciones" headerClass="encabezado-columna">
                    <template #body="slotProps">
                        <Button class="btn-nuevo" style="margin: 5px" @click="handleMostrarFormulario('E', slotProps.data)">
                            <font-icon :icon="['fas', 'pen-to-square']" />
                        </Button>
                    </template>
                </Column>
            </DataTable>
        </ScrollPanel>

        <!-- FORMULARIO -->
        <Tabs value="0" v-if="mostrarTablaFormulario">
            <TabList>
                <Tab value="0">Datos</Tab>
                <Tab value="1" v-if="movimiento === 'E'">Historial</Tab>
            </TabList>

            <TabPanels>
                <TabPanel value="0">
                    <ScrollPanel style="height: 60vh">
                        <form id="formImpuesto" @submit.prevent="handleGuardar">
                            <div style="max-width: 1000px; margin: 0 auto; padding: 40px 20px">
                                <!-- TIPO / CODIGO -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px">
                                    <div style="display: flex; flex-direction: column; gap: 8px">
                                        <label for="tipo">Tipo:</label>

                                        <Dropdown
                                            id="tipo"
                                            v-model="frmImpuesto.tipo"
                                            :options="tiposImpuesto"
                                            optionLabel="label"
                                            optionValue="value"
                                            placeholder="Selecciona una opción"
                                            :invalid="!tipoValido"
                                            class="w-full"
                                            @change="handleCambioTipo"
                                        />
                                    </div>

                                    <div style="display: flex; flex-direction: column; gap: 8px">
                                        <label for="codigo_fiscal">Impuesto:</label>

                                        <Dropdown
                                            id="codigo_fiscal"
                                            v-model="frmImpuesto.codigo_fiscal"
                                            :options="codigosFiscales"
                                            optionLabel="label"
                                            optionValue="value"
                                            placeholder="Selecciona una opción"
                                            :invalid="!codigoFiscalValido"
                                            class="w-full"
                                            :disabled="!frmImpuesto.tipo"
                                        />
                                    </div>
                                </div>

                                <!-- FACTOR / TASA -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px">
                                    <div style="display: flex; flex-direction: column; gap: 8px">
                                        <label for="tipo_factor">Tipo Factor:</label>

                                        <Dropdown
                                            id="tipo_factor"
                                            v-model="frmImpuesto.tipo_factor"
                                            :options="tiposFactor"
                                            optionLabel="label"
                                            optionValue="value"
                                            placeholder="Selecciona una opción"
                                            :invalid="!tipoFactorValido"
                                            class="w-full"
                                            @change="handleCambioTipoFactor"
                                        />
                                    </div>

                                    <div style="display: flex; flex-direction: column; gap: 8px">
                                        <label for="tasa">Tasa/Cuota:</label>

                                        <InputText id="tasa" v-model="frmImpuesto.tasa" placeholder="0.000000" maxlength="8" :disabled="frmImpuesto.tipo_factor === 'Exento'" :invalid="!tasaValida" style="width: 100%" />
                                    </div>
                                </div>

                                <!-- DESCRIPCION -->
                                <div style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 30px">
                                    <div style="display: flex; flex-direction: column; gap: 8px">
                                        <label for="descripcion">Descripción:</label>

                                        <InputText id="descripcion" v-model="frmImpuesto.descripcion" :invalid="!descripcionValida" style="width: 100%; text-transform: uppercase" @update:modelValue="frmImpuesto.descripcion = $event.toUpperCase()" />
                                    </div>
                                </div>

                                <!-- ACTIVO -->
                                <div style="display: flex; align-items: center; gap: 8px">
                                    <Checkbox inputId="activo" v-model="frmImpuesto.activo" binary />
                                    <label for="activo">Activo</label>
                                </div>
                            </div>
                        </form>
                    </ScrollPanel>
                </TabPanel>

                <TabPanel value="1" v-if="movimiento === 'E'">
                    <p class="m-0">Aquí se mostrará el historial del impuesto.</p>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'Impuestos',
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
