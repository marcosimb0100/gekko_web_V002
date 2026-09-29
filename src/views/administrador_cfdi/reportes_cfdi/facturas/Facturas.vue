<template>
    <Encabezado titulo="Reporte de Facturas" subtitulo="Consulta detallada de facturas emitidas y recibidas" icono="pi pi-file">
        <Button type="button" label="Exportar Excel" class="btn-excel" :disabled="!catFacturasFiltradas.length" @click="handleExportarExcel">
            <template #icon>
                <font-icon icon="fa-solid fa-file-excel" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <div class="card p-0 m-0" style="height: 72vh">
        <!-- =========================================================
             FILTROS
        ========================================================== -->

        <form class="filtros-facturas" @submit.prevent="handleConsultar">
            <!-- EMPRESA -->

            <div class="campo-filtro">
                <label>Empresa</label>

                <Dropdown v-model="frmFiltros.empresa" :options="catCompaniasSat" optionLabel="razon_social_nombre_completo" optionValue="rfc" placeholder="Empresa" filter class="w-full" />
            </div>

            <!-- TIPO -->

            <div class="campo-filtro">
                <label>Tipo</label>

                <Dropdown v-model="frmFiltros.tipo" :options="catTipo" optionLabel="description" optionValue="id" placeholder="Tipo" class="w-full" />
            </div>

            <!-- ESTADO SAT -->

            <div class="campo-filtro">
                <label>Estado SAT</label>

                <Dropdown v-model="frmFiltros.estadoSat" :options="catEstadoSat" optionLabel="description" optionValue="id" placeholder="Todos" showClear class="w-full" />
            </div>

            <!-- RFC CONTRAPARTE -->

            <div class="campo-filtro">
                <label>RFC contraparte</label>

                <InputText v-model="frmFiltros.rfcContraparte" placeholder="RFC" maxlength="13" class="w-full" @input="frmFiltros.rfcContraparte = frmFiltros.rfcContraparte.toUpperCase()" />
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

            <Button type="submit" class="btn-nuevo boton-filtro" :disabled="botonConsultarDeshabilitado" v-tooltip.top="'Consultar facturas'">
                <template #icon>
                    <font-icon icon="fa-solid fa-magnifying-glass" />
                </template>
            </Button>

            <!-- LIMPIAR -->

            <Button type="button" class="btn-cancelar boton-filtro" v-tooltip.top="'Limpiar filtros'" @click="handleCancelar">
                <template #icon>
                    <font-icon icon="fa-solid fa-eraser" />
                </template>
            </Button>
        </form>

        <!-- =========================================================
             BUSQUEDA
        ========================================================== -->

        <div class="barra-busqueda">
            <div class="total-registros">
                {{ catFacturasFiltradas.length }}
                registros
            </div>

            <IconField iconPosition="left">
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>

                <InputText v-model="ctrlBuscar" placeholder="UUID / RFC / Nombre / Serie / Folio" style="width: 360px" />
            </IconField>
        </div>

        <!-- =========================================================
             TABLA
        ========================================================== -->

        <DataTable
            :value="catFacturasFiltradas"
            paginator
            :rows="100"
            :rowsPerPageOptions="[100, 250, 500, 1000]"
            scrollable
            scrollHeight="46vh"
            size="small"
            tableStyle="min-width: 260rem"
            class="tabla-encabezados tabla-facturas"
            style="font-size: 10px"
        >
            <template #empty> No se encontraron facturas. </template>

            <Column field="estadoSat" header="Estado SAT" headerClass="encabezado-columna" bodyClass="nowrap">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.estadoSat" :severity="handleSeverityEstado(slotProps.data.estadoSat)" />
                </template>
            </Column>

            <Column field="version" header="Versión" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="tipo" header="Tipo" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column header="Fecha Emisión" headerClass="encabezado-columna" bodyClass="nowrap">
                <template #body="slotProps">
                    {{ handleFormatFecha(slotProps.data.fechaEmision) }}
                </template>
            </Column>

            <Column header="Fecha Timbrado" headerClass="encabezado-columna" bodyClass="nowrap">
                <template #body="slotProps">
                    {{ handleFormatFecha(slotProps.data.fechaTimbrado) }}
                </template>
            </Column>

            <Column field="estadoPago" header="Estado Pago" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column header="Fecha Pago" headerClass="encabezado-columna" bodyClass="nowrap">
                <template #body="slotProps">
                    {{ handleFormatFecha(slotProps.data.fechaPago) }}
                </template>
            </Column>

            <Column field="serie" header="Serie" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="folio" header="Folio" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="uuid" header="UUID" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 290px" />

            <Column field="uuidRelacion" header="UUID Relación" headerClass="encabezado-columna" style="min-width: 290px" />

            <Column field="rfcEmisor" header="RFC Emisor" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="nombreEmisor" header="Nombre Emisor" headerClass="encabezado-columna" style="min-width: 220px" />

            <Column field="lugarDeExpedicion" header="Lugar Expedición" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="rfcReceptor" header="RFC Receptor" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="nombreReceptor" header="Nombre Receptor" headerClass="encabezado-columna" style="min-width: 220px" />

            <Column field="usoCFDI" header="Uso CFDI" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column header="Subtotal" headerClass="encabezado-columna" bodyClass="numero">
                <template #body="slotProps">
                    $
                    {{ handleFormatMX(slotProps.data.subTotal) }}
                </template>
            </Column>

            <Column header="Descuento" headerClass="encabezado-columna" bodyClass="numero">
                <template #body="slotProps">
                    $
                    {{ handleFormatMX(slotProps.data.descuento) }}
                </template>
            </Column>

            <Column header="IVA 16%" headerClass="encabezado-columna" bodyClass="numero">
                <template #body="slotProps">
                    $
                    {{ handleFormatMX(slotProps.data.iva16) }}
                </template>
            </Column>

            <Column header="IVA 8%" headerClass="encabezado-columna" bodyClass="numero">
                <template #body="slotProps">
                    $
                    {{ handleFormatMX(slotProps.data.iva8) }}
                </template>
            </Column>

            <Column header="Ret. IVA" headerClass="encabezado-columna" bodyClass="numero">
                <template #body="slotProps">
                    $
                    {{ handleFormatMX(slotProps.data.retenidoIVA) }}
                </template>
            </Column>

            <Column header="Ret. ISR" headerClass="encabezado-columna" bodyClass="numero">
                <template #body="slotProps">
                    $
                    {{ handleFormatMX(slotProps.data.retenidoISR) }}
                </template>
            </Column>

            <Column header="Total" headerClass="encabezado-columna" bodyClass="numero total-cfdi">
                <template #body="slotProps">
                    $
                    {{ handleFormatMX(slotProps.data.total) }}
                </template>
            </Column>

            <Column field="moneda" header="Moneda" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="tipoDeCambio" header="Tipo Cambio" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="formaDePago" header="Forma Pago" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="metodoDePago" header="Método Pago" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="condicionDePago" header="Condición Pago" headerClass="encabezado-columna" style="min-width: 180px" />

            <Column field="conceptos" header="Conceptos" headerClass="encabezado-columna" style="min-width: 400px" />

            <Column field="complemento" header="Complemento" headerClass="encabezado-columna" style="min-width: 180px" />

            <Column field="regimenFiscalReceptor" header="Régimen Receptor" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="domicilioFiscalReceptor" header="CP Receptor" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="archivoXML" header="Archivo XML" headerClass="encabezado-columna" style="min-width: 280px" />
        </DataTable>
    </div>
</template>

<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'ReporteFacturas',

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
