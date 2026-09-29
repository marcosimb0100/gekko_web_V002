<template>
    <Encabezado titulo="CFDI" subtitulo="Consulta de comprobantes fiscales" icono="pi pi-file">
        <Button type="button" label="Exportar Excel" class="btn-excel" :disabled="!catCfdisFiltrados.length" @click="handleExportarExcel">
            <template #icon>
                <font-icon icon="fa-solid fa-file-excel" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <div class="card p-0 m-0" style="height: 72vh">
        <!-- =========================================================
             FILTROS
        ========================================================== -->

        <form @submit.prevent="handleConsultar" class="filtros-cfdi">
            <!-- EMPRESA -->

            <div class="campo-filtro">
                <label> Empresa </label>

                <Dropdown v-model="frmFiltros.empresa" :options="catCompaniasSat" optionLabel="razon_social_nombre_completo" optionValue="rfc" placeholder="Empresa" filter class="w-full" />
            </div>

            <!-- TIPO -->

            <div class="campo-filtro">
                <label> Tipo </label>

                <Dropdown v-model="frmFiltros.tipo" :options="catTipo" optionLabel="description" optionValue="id" placeholder="Tipo" class="w-full" />
            </div>

            <!-- TIPO COMPROBANTE -->

            <div class="campo-filtro">
                <label> Comprobante </label>

                <MultiSelect v-model="frmFiltros.tipoComprobante" :options="catTiposComprobantes" optionLabel="description" optionValue="id" placeholder="CFDI" display="chip" class="w-full" :invalid="!tipoComprobanteValido" />
            </div>

            <!-- METODO PAGO -->

            <div class="campo-filtro">
                <label> Método </label>

                <MultiSelect v-model="frmFiltros.metodoPago" :options="catMetodoPago" optionLabel="paymentMethod" optionValue="id" placeholder="Método" display="chip" class="w-full" />
            </div>

            <!-- FECHA INICIAL -->

            <div class="campo-filtro">
                <label> Inicial </label>

                <DatePicker v-model="frmFiltros.fechaInicial" dateFormat="yy-mm-dd" showIcon class="w-full" :maxDate="fechaActual" :invalid="!fechaInicialValida" />
            </div>

            <!-- FECHA FINAL -->

            <div class="campo-filtro">
                <label> Final </label>

                <DatePicker v-model="frmFiltros.fechaFinal" dateFormat="yy-mm-dd" showIcon class="w-full" :maxDate="fechaActual" :minDate="frmFiltros.fechaInicial" :invalid="!fechaFinalValida" />
            </div>

            <!-- CONSULTAR -->

            <Button type="submit" class="btn-nuevo boton-filtro" :disabled="botonConsultarDeshabilitado" v-tooltip.top="'Consultar CFDI'">
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

        <!-- =========================================================
             DESCARGA ZIP / BUSQUEDA
        ========================================================== -->

        <div class="barra-busqueda">
            <!-- IZQUIERDA -->

            <div class="acciones-cfdi">
                <Button type="button" label="Descargar XML" class="btn-descargar-zip" :disabled="!catCfdisFiltrados.length" @click="handleDescargarZip" v-tooltip.top="'Descargar CFDI filtrados en un archivo ZIP'">
                    <template #icon>
                        <font-icon icon="fa-solid fa-file-zipper" class="mr-2" />
                    </template>
                </Button>

                <span v-if="catCfdisFiltrados.length" class="contador-descarga">
                    {{ catCfdisFiltrados.length }}
                    CFDI
                </span>
            </div>

            <!-- DERECHA -->

            <IconField iconPosition="left">
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>

                <InputText v-model="ctrlBuscar" placeholder="UUID / Receptor / Emisor / Serie / Folio" class="buscador-cfdi" />
            </IconField>
        </div>

        <!-- =========================================================
             TABLA
        ========================================================== -->

        <DataTable :value="catCfdisFiltrados" paginator :rows="500" :rowsPerPageOptions="[500, 1000, 1500]" scrollable scrollHeight="46vh" size="small" tableStyle="min-width: 115rem" class="tabla-encabezados tabla-cfdi" style="font-size: 11px">
            <template #empty> No se encontraron CFDI. </template>

            <!-- OPCIONES -->

            <Column header="Opciones" headerClass="encabezado-columna" bodyClass="nowrap" style="width: 80px">
                <template #body="slotProps">
                    <Button type="button" size="small" severity="help" v-tooltip.top="'Descargar XML'" @click="handleDescargaXml(slotProps.data)">
                        <template #icon>
                            <font-icon icon="fa-solid fa-cloud-arrow-down" />
                        </template>
                    </Button>
                </template>
            </Column>

            <!-- UUID -->

            <Column field="uuid" header="UUID" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 290px" />

            <!-- FECHA -->

            <Column header="Fecha" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 110px">
                <template #body="slotProps">
                    {{ handleFormatFecha(slotProps.data.fecha) }}
                </template>
            </Column>

            <!-- SERIE -->

            <Column field="serie" header="Serie" headerClass="encabezado-columna" bodyClass="nowrap" />

            <!-- FOLIO -->

            <Column field="folio" header="Folio" headerClass="encabezado-columna" bodyClass="nowrap" />

            <!-- TIPO -->

            <Column field="tipoDeComprobante" header="Tipo" headerClass="encabezado-columna" bodyClass="nowrap" />

            <!-- METODO PAGO -->

            <Column field="metodoPago" header="Método Pago" headerClass="encabezado-columna" bodyClass="nowrap" />

            <!-- EMISOR RFC -->

            <Column field="emisorRfc" header="Emisor RFC" headerClass="encabezado-columna" bodyClass="nowrap" />

            <!-- EMISOR NOMBRE -->

            <Column field="emisorNombre" header="Emisor Nombre" headerClass="encabezado-columna" style="min-width: 220px" />

            <!-- RECEPTOR RFC -->

            <Column field="receptorRfc" header="Receptor RFC" headerClass="encabezado-columna" bodyClass="nowrap" />

            <!-- RECEPTOR NOMBRE -->

            <Column field="receptorNombre" header="Receptor Nombre" headerClass="encabezado-columna" style="min-width: 220px" />

            <!-- ESTATUS -->

            <Column header="Estatus" headerClass="encabezado-columna" bodyClass="nowrap">
                <template #body="slotProps">
                    <span class="estatus-cfdi" :class="slotProps.data.estatusCFDI === 1 ? 'estatus-vigente' : 'estatus-cancelado'">
                        {{ slotProps.data.estatusCFDI === 1 ? 'Vigente' : 'Cancelado' }}
                    </span>
                </template>
            </Column>

            <!-- TOTAL -->

            <Column header="Total" headerClass="encabezado-columna" bodyClass="nowrap total-cfdi" style="min-width: 120px">
                <template #body="slotProps">
                    $
                    {{ handleFormatMX(slotProps.data.total) }}
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';

import proceso from './js/proceso.js';

export default {
    name: 'Cfdis',

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
