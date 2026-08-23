<template>
    <Encabezado titulo="CFDIs Cancelados" subtitulo="Consulta de comprobantes fiscales cancelados" icono="pi pi-file" />

    <div class="card p-0 m-0" style="height: 72vh">
        <!-- FILTROS -->
        <form @submit.prevent="handleConsultar" class="filtros-cancelados">
            <!-- EMPRESA -->
            <div class="campo-filtro">
                <label>Empresa</label>

                <Dropdown v-model="frmFiltros.empresa" :options="catCompaniasSat" optionLabel="razon_social_nombre_completo" optionValue="rfc" placeholder="Empresa" filter class="w-full" />
            </div>

            <!-- FECHA INICIAL -->
            <div class="campo-filtro">
                <label>Inicial</label>

                <DatePicker v-model="frmFiltros.fechaInicial" dateFormat="yy-mm-dd" showIcon class="w-full" :maxDate="fechaActual" :invalid="!fechaInicialValida" />
            </div>

            <!-- FECHA FINAL -->
            <div class="campo-filtro">
                <label>Final</label>

                <DatePicker v-model="frmFiltros.fechaFinal" dateFormat="yy-mm-dd" showIcon class="w-full" :maxDate="fechaActual" :minDate="frmFiltros.fechaInicial" :invalid="!fechaFinalValida" />
            </div>

            <!-- CONSULTAR -->
            <Button type="submit" class="btn-nuevo boton-filtro" :disabled="botonConsultarDeshabilitado" v-tooltip.top="'Consultar CFDI cancelados'">
                <template #icon>
                    <font-icon icon="fa-solid fa-magnifying-glass" />
                </template>
            </Button>

            <!-- LIMPIAR -->
            <Button type="button" class="btn-cancelar boton-filtro" @click="handleCancelar" v-tooltip.top="'Limpiar filtros'">
                <template #icon>
                    <font-icon icon="fa-solid fa-eraser" />
                </template>
            </Button>
        </form>

        <!-- BUSQUEDA -->
        <div class="barra-busqueda">
            <IconField iconPosition="left">
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>

                <InputText v-model="ctrlBuscar" placeholder="UUID / Emisor / Receptor / Serie / Folio" style="width: 360px" />
            </IconField>
        </div>

        <!-- TABLA -->
        <DataTable :value="catCfdisFiltrados" paginator :rows="500" :rowsPerPageOptions="[500, 1000, 1500]" scrollable scrollHeight="46vh" size="small" tableStyle="min-width: 110rem" class="tabla-encabezados tabla-cancelados" style="font-size: 11px">
            <template #empty> No se encontraron CFDIs cancelados. </template>

            <Column field="uuid" header="UUID" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 290px" />

            <Column field="fecha" header="Fecha Emisión" headerClass="encabezado-columna" bodyClass="nowrap">
                <template #body="slotProps">
                    {{ handleFormatFecha(slotProps.data.fecha) }}
                </template>
            </Column>

            <Column field="fechaCancelacion" header="Fecha Cancelación" headerClass="encabezado-columna" bodyClass="nowrap">
                <template #body="slotProps">
                    {{ handleFormatFecha(slotProps.data.fechaCancelacion) }}
                </template>
            </Column>

            <Column field="serie" header="Serie" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="folio" header="Folio" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="tipoDeComprobante" header="Comprobante" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="emisorRfc" header="Emisor RFC" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="emisorNombre" header="Emisor Nombre" headerClass="encabezado-columna" style="min-width: 220px" />

            <Column field="receptorRfc" header="Receptor RFC" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="receptorNombre" header="Receptor Nombre" headerClass="encabezado-columna" style="min-width: 220px" />

            <Column header="Total" headerClass="encabezado-columna" bodyClass="nowrap total-numero" style="min-width: 120px">
                <template #body="slotProps"> $ {{ handleFormatMX(slotProps.data.monto) }} </template>
            </Column>

            <Column header="Estatus" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 110px">
                <template #body>
                    <span class="estatus-cancelado"> Cancelado </span>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'CfdisCancelados',

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
