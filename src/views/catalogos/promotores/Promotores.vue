<template>
    <Encabezado titulo="Promotores" subtitulo="Administración de promotores del sistema" icono="pi pi-users">
        <Button type="button" label="Nuevo" class="w-full btn-nuevo" @click="handleMostrarFormulario('N')" v-if="!mostrarTablaFormulario">
            <template #icon><font-icon icon="fa-solid fa-plus" class="mr-2" /></template>
        </Button>

        <Button type="button" label="Cancelar" class="w-full btn-cancelar" @click="handleMostrarFormulario('C')" v-if="mostrarTablaFormulario">
            <template #icon><font-icon icon="fa-solid fa-xmark" class="mr-2" /></template>
        </Button>

        <Button type="submit" label="Guardar" class="w-full btn-guardar" form="formPromotor" v-if="mostrarTablaFormulario" :disabled="botonGuardarDeshabilitado">
            <template #icon><font-icon icon="fa-solid fa-floppy-disk" class="mr-2" /></template>
        </Button>
    </Encabezado>

    <div class="card p-0 m-0" style="height: 72vh">
        <!-- TABLA -->
        <ScrollPanel style="height: 65vh" v-if="!mostrarTablaFormulario">
            <DataTable
                v-model:filters="filtros"
                :value="tablaPromotores"
                :globalFilterFields="['nombre_completo', 'correo_electronico', 'celular', 'telefono']"
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

                <Column field="nombre_completo" header="Nombre Completo" headerClass="encabezado-columna" />
                <Column field="correo_electronico" header="Correo Electrónico" headerClass="encabezado-columna" />
                <Column field="celular" header="Celular" headerClass="encabezado-columna" />
                <Column field="telefono" header="Teléfono" headerClass="encabezado-columna" />

                <Column header="Activo" headerClass="encabezado-columna">
                    <template #body="slotProps">
                        <span v-if="slotProps.data.activo === false" style="font-size: 15px; color: red">
                            <font-icon :icon="['fas', 'person-circle-minus']" />
                        </span>

                        <span v-if="slotProps.data.activo === true" style="font-size: 15px; color: green">
                            <font-icon :icon="['fas', 'person-circle-check']" />
                        </span>
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
                <!-- DATOS -->
                <TabPanel value="0">
                    <ScrollPanel style="height: 60vh">
                        <form id="formPromotor" @submit.prevent="handleGuardar">
                            <div style="max-width: 1000px; margin: 0 auto; padding: 40px 20px">
                                <!-- NOMBRE / CORREO -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px">
                                    <div style="display: flex; flex-direction: column; gap: 8px">
                                        <label for="nombre_completo">Nombre Completo:</label>

                                        <InputText
                                            id="nombre_completo"
                                            v-model="frmPromotor.nombre_completo"
                                            :invalid="!nombreCompletoValido"
                                            :disabled="movimiento === 'E'"
                                            style="width: 100%; text-transform: uppercase"
                                            @update:modelValue="frmPromotor.nombre_completo = $event.toUpperCase()"
                                        />
                                    </div>

                                    <div style="display: flex; flex-direction: column; gap: 8px">
                                        <label for="correo_electronico">Correo Electrónico:</label>

                                        <InputText
                                            id="correo_electronico"
                                            v-model="frmPromotor.correo_electronico"
                                            type="email"
                                            placeholder="correo@dominio.com"
                                            :invalid="!correoElectronicoValido"
                                            style="width: 100%; text-transform: lowercase"
                                            @update:modelValue="frmPromotor.correo_electronico = $event.toLowerCase()"
                                        />
                                    </div>
                                </div>

                                <!-- CELULAR / TELEFONO -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px">
                                    <div style="display: flex; flex-direction: column; gap: 8px">
                                        <label for="celular">Celular:</label>

                                        <InputMask id="celular" v-model="frmPromotor.celular" mask="(999)-999-9999" placeholder="(###)-###-####" :invalid="!celularValido" style="width: 100%" />
                                    </div>

                                    <div style="display: flex; flex-direction: column; gap: 8px">
                                        <label for="telefono">Teléfono:</label>

                                        <InputMask id="telefono" v-model="frmPromotor.telefono" mask="(999)-999-9999" placeholder="(###)-###-####" :invalid="!telefonoValido" style="width: 100%" />
                                    </div>
                                </div>

                                <!-- ACTIVO -->
                                <div style="display: flex; align-items: center; gap: 8px">
                                    <Checkbox inputId="activo" v-model="frmPromotor.activo" binary />
                                    <label for="activo">Activo</label>
                                </div>
                            </div>
                        </form>
                    </ScrollPanel>
                </TabPanel>

                <!-- HISTORIAL -->
                <TabPanel value="1" v-if="movimiento === 'E'">
                    <p class="m-0">Aquí se mostrará el historial del promotor.</p>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'Promotores',
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
