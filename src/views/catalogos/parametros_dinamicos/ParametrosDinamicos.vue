<template>
    <!-- ========================================================= -->
    <!-- ENCABEZADO -->
    <!-- ========================================================= -->

    <Encabezado titulo="Parámetros Dinámicos" subtitulo="Catálogo de parámetros disponibles para conceptos" icono="pi pi-code" />

    <!-- ========================================================= -->
    <!-- CONTENIDO -->
    <!-- ========================================================= -->

    <div class="card p-0 m-0" style="height: 72vh">
        <ScrollPanel style="height: 65vh">
            <DataTable
                v-model:filters="filtros"
                :value="tablaParametros"
                :globalFilterFields="['parametro', 'nombre', 'descripcion', 'tipo', 'origen', 'formato', 'ejemplo']"
                paginator
                :rows="100"
                :rowsPerPageOptions="[100, 125, 150, 200]"
                scrollable
                scrollHeight="54vh"
                size="small"
                tableStyle="min-width: 70rem"
                class="tabla-encabezados tabla-parametros"
                :loading="cargando"
            >
                <!-- ================================================= -->
                <!-- HEADER -->
                <!-- ================================================= -->

                <template #header>
                    <div class="flex justify-content-between align-items-center">
                        <!-- LIMPIAR -->

                        <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined style="margin-right: 5px" @click="handleLimpiarFiltro" />

                        <!-- BUSCADOR -->

                        <IconField iconPosition="left">
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>

                            <InputText v-model="filtros.global.value" placeholder="Buscar..." />
                        </IconField>
                    </div>
                </template>

                <!-- ================================================= -->
                <!-- VACÍO -->
                <!-- ================================================= -->

                <template #empty> No se encontraron parámetros dinámicos. </template>

                <!-- ================================================= -->
                <!-- PARÁMETRO -->
                <!-- ================================================= -->

                <Column field="parametro" header="Parámetro" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 180px">
                    <template #body="slotProps">
                        <span class="parametro-codigo" title="Clic para copiar" @click="handleCopiarParametro(slotProps.data.parametro)">
                            {{ slotProps.data.parametro }}

                            <i class="pi pi-copy icono-copiar" />
                        </span>
                    </template>
                </Column>

                <!-- ================================================= -->
                <!-- NOMBRE -->
                <!-- ================================================= -->

                <Column field="nombre" header="Nombre" headerClass="encabezado-columna" style="min-width: 210px" />

                <!-- ================================================= -->
                <!-- DESCRIPCIÓN -->
                <!-- ================================================= -->

                <Column field="descripcion" header="Descripción" headerClass="encabezado-columna" style="min-width: 340px" />

                <!-- ================================================= -->
                <!-- TIPO -->
                <!-- ================================================= -->

                <Column field="tipo" header="Tipo" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 140px" />

                <!-- ================================================= -->
                <!-- ORIGEN -->
                <!-- ================================================= -->

                <Column field="origen" header="Origen" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 150px" />

                <!-- ================================================= -->
                <!-- FORMATO -->
                <!-- ================================================= -->

                <Column field="formato" header="Formato" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 130px" />

                <!-- ================================================= -->
                <!-- EJEMPLO -->
                <!-- ================================================= -->

                <Column field="ejemplo" header="Ejemplo" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 130px">
                    <template #body="slotProps">
                        <span class="parametro-ejemplo">
                            {{ slotProps.data.ejemplo }}
                        </span>
                    </template>
                </Column>

                <!-- ================================================= -->
                <!-- ACTIVO -->
                <!-- ================================================= -->

                <Column header="Activo" headerClass="encabezado-columna" style="width: 90px; text-align: center">
                    <template #body="slotProps">
                        <span v-if="slotProps.data.activo === true" class="estado-activo">
                            <font-icon :icon="['fas', 'circle-check']" />
                        </span>

                        <span v-else class="estado-inactivo">
                            <font-icon :icon="['fas', 'circle-minus']" />
                        </span>
                    </template>
                </Column>
            </DataTable>
        </ScrollPanel>
    </div>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';

import proceso from './js/proceso.js';

export default {
    name: 'ParametrosDinamicos',

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
