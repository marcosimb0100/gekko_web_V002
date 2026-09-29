<template>
    <Encabezado titulo="Reporte de Pagos" subtitulo="Consulta detallada de complementos de pago" icono="pi pi-wallet">
        <Button type="button" label="Exportar Excel" class="btn-excel" :disabled="!catPagosFiltrados.length" @click="handleExportarExcel">
            <template #icon>
                <font-icon icon="fa-solid fa-file-excel" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <div class="card p-0 m-0" style="height: 72vh">
        <!-- FILTROS -->

        <form class="filtros-reporte-pagos" @submit.prevent="handleConsultar">
            <div class="campo-filtro">
                <label>Empresa</label>

                <Dropdown v-model="frmFiltros.empresa" :options="catCompaniasSat" optionLabel="razon_social_nombre_completo" optionValue="rfc" placeholder="Empresa" filter class="w-full" />
            </div>

            <div class="campo-filtro">
                <label>Tipo</label>

                <Dropdown v-model="frmFiltros.tipo" :options="catTipo" optionLabel="description" optionValue="id" class="w-full" />
            </div>

            <div class="campo-filtro">
                <label>Filtrar por</label>

                <Dropdown v-model="frmFiltros.filtrarPor" :options="catFiltrarPor" optionLabel="description" optionValue="id" class="w-full" />
            </div>

            <div class="campo-filtro">
                <label>Estado SAT</label>

                <Dropdown v-model="frmFiltros.estadoSat" :options="catEstadoSat" optionLabel="description" optionValue="id" placeholder="Todos" showClear class="w-full" />
            </div>

            <div class="campo-filtro">
                <label>RFC contraparte</label>

                <InputText v-model="frmFiltros.rfcContraparte" placeholder="RFC" maxlength="13" class="w-full" @input="frmFiltros.rfcContraparte = frmFiltros.rfcContraparte.toUpperCase()" />
            </div>

            <div class="campo-filtro">
                <label>Inicial</label>

                <DatePicker v-model="frmFiltros.fechaInicial" dateFormat="yy-mm-dd" showIcon class="w-full" :maxDate="fechaActual" />
            </div>

            <div class="campo-filtro">
                <label>Final</label>

                <DatePicker v-model="frmFiltros.fechaFinal" dateFormat="yy-mm-dd" showIcon class="w-full" :maxDate="fechaActual" :minDate="frmFiltros.fechaInicial" />
            </div>

            <Button type="submit" class="btn-nuevo boton-filtro" :disabled="botonConsultarDeshabilitado" v-tooltip.top="'Consultar pagos'">
                <template #icon>
                    <font-icon icon="fa-solid fa-magnifying-glass" />
                </template>
            </Button>

            <Button type="button" class="btn-cancelar boton-filtro" @click="handleCancelar" v-tooltip.top="'Limpiar filtros'">
                <template #icon>
                    <font-icon icon="fa-solid fa-eraser" />
                </template>
            </Button>
        </form>

        <!-- BUSCADOR -->

        <div class="barra-busqueda">
            <div class="total-registros">
                {{ catPagosFiltrados.length }}
                registros
            </div>

            <IconField iconPosition="left">
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>

                <InputText v-model="ctrlBuscar" placeholder="UUID / UUID Rel / RFC / Nombre / Folio" style="width: 380px" />
            </IconField>
        </div>

        <!-- TABLA -->

        <DataTable
            :value="catPagosFiltrados"
            paginator
            :rows="100"
            :rowsPerPageOptions="[100, 250, 500, 1000]"
            scrollable
            scrollHeight="46vh"
            size="small"
            tableStyle="min-width: 235rem"
            class="tabla-encabezados tabla-reporte-pagos"
            style="font-size: 10px"
        >
            <template #empty> No se encontraron pagos. </template>

            <Column field="estadoSat" header="Estado SAT" headerClass="encabezado-columna" bodyClass="nowrap">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.estadoSat" :severity="handleSeverityEstado(slotProps.data.estadoSat)" />
                </template>
            </Column>

            <Column field="version" header="Versión" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="tipoComprobante" header="Tipo" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column header="Fecha Emisión" headerClass="encabezado-columna" bodyClass="nowrap">
                <template #body="slotProps">
                    {{ handleFormatFecha(slotProps.data.fechaEmision) }}
                </template>
            </Column>

            <Column field="serie" header="Serie" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="folio" header="Folio" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="uuid" header="UUID" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 290px" />

            <Column field="rfcEmisor" header="RFC Emisor" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="nombreEmisor" header="Nombre Emisor" headerClass="encabezado-columna" style="min-width: 220px" />

            <Column field="rfcReceptor" header="RFC Receptor" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="nombreReceptor" header="Nombre Receptor" headerClass="encabezado-columna" style="min-width: 220px" />

            <Column field="usoCFDI" header="Uso CFDI" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column header="Fecha Pago" headerClass="encabezado-columna" bodyClass="nowrap">
                <template #body="slotProps">
                    {{ handleFormatFecha(slotProps.data.fechaPago) }}
                </template>
            </Column>

            <Column field="formaDePagoP" header="Forma Pago P" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="monedaP" header="Moneda P" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column header="Monto" headerClass="encabezado-columna" bodyClass="numero">
                <template #body="slotProps">
                    $
                    {{ handleFormatMX(slotProps.data.monto) }}
                </template>
            </Column>

            <Column field="uuidRel" header="UUID Rel" headerClass="encabezado-columna" style="min-width: 290px" />

            <Column field="numOperacion" header="Num. Operación" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="cuentaDestino" header="Cuenta Destino" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="cuentaOrigen" header="Cuenta Origen" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="rfcEmisorCtaDestino" header="RFC Cta Destino" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="rfcEmisorCtaOrigen" header="RFC Cta Origen" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="nomBancoOrdExtranjero" header="Banco Ord. Extranjero" headerClass="encabezado-columna" style="min-width: 180px" />

            <Column field="tipoCadPago" header="Tipo Cad Pago" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="cadPago" header="Cadena Pago" headerClass="encabezado-columna" style="min-width: 300px" />

            <Column field="conceptos" header="Conceptos" headerClass="encabezado-columna" style="min-width: 300px" />

            <Column field="archivoXML" header="Archivo XML" headerClass="encabezado-columna" style="min-width: 280px" />

            <Column header="Total CFDI" headerClass="encabezado-columna" bodyClass="numero total-cfdi">
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
    name: 'ReportePagos',

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
