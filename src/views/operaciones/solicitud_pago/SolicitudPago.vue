<template>
    <Encabezado titulo="Generar Complemento de Pago" subtitulo="Generación de complementos de pago CFDI" icono="pi pi-file" />

    <div class="card p-0 m-0" style="height: 72vh">
        <!-- FILTROS -->
        <form @submit.prevent="handleConsultar" class="filtros-pagos">
            <!-- EMPRESA -->
            <div class="campo-filtro">
                <label>Empresa</label>

                <Dropdown v-model="frmFiltros.empresa" :options="catCompaniasSat" optionLabel="razon_social_nombre_completo" optionValue="rfc" placeholder="Empresa" filter class="w-full" @change="handleCambioEmpresa" />
            </div>

            <!-- CLIENTE -->
            <div class="campo-filtro">
                <label>Cliente</label>

                <Dropdown v-model="frmFiltros.cliente" :options="catClientesPpd" optionLabel="label" optionValue="rfc" placeholder="Cliente" filter showClear class="w-full" :disabled="!frmFiltros.empresa" />
            </div>

            <!-- TIPO -->
            <div class="campo-filtro">
                <label>Tipo</label>

                <Dropdown v-model="frmFiltros.tipo" :options="catTipo" optionLabel="description" optionValue="id" placeholder="Tipo" class="w-full" />
            </div>

            <!-- COMPROBANTE -->
            <div class="campo-filtro">
                <label>Comprobante</label>

                <MultiSelect v-model="frmFiltros.tipoComprobante" :options="catTiposComprobantes" optionLabel="description" optionValue="id" placeholder="CFDI" display="chip" class="w-full" :invalid="!tipoComprobanteValido" />
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

        <!-- DATOS DEL PAGO -->
        <div class="datos-pago">
            <div class="campo-filtro">
                <label>Monto Total</label>

                <InputText :modelValue="handleFormatMX(montoTotal)" disabled class="w-full" style="font-weight: 600" />
            </div>

            <div class="campo-filtro">
                <label>Fecha/Hora Pago</label>

                <DatePicker v-model="fechaHoraPago" showTime hourFormat="24" dateFormat="yy-mm-dd" showIcon class="w-full" :maxDate="fechaActual" :disabled="!cfdisSeleccionados.length" />
            </div>

            <div class="campo-filtro">
                <label>Forma de Pago</label>

                <Dropdown v-model="formaPago" :options="catFormaPago" optionLabel="description" optionValue="id" placeholder="Forma de pago" class="w-full" :disabled="!cfdisSeleccionados.length" />
            </div>

            <Button type="button" label="Generar Pago" class="btn-guardar btn-generar" :disabled="!pagoValido" @click="handleGenerarPago">
                <template #icon>
                    <font-icon icon="fa-solid fa-file-invoice-dollar" class="mr-2" />
                </template>
            </Button>
        </div>

        <!-- TABLA -->
        <DataTable
            v-model:selection="cfdisSeleccionados"
            :value="catCfdis"
            dataKey="uuid"
            paginator
            :rows="500"
            :rowsPerPageOptions="[500, 1000, 1500]"
            scrollable
            scrollHeight="43vh"
            size="small"
            tableStyle="min-width: 100rem"
            class="tabla-encabezados tabla-pagos"
            style="font-size: 10px"
            @update:selection="handleSeleccionCfdis"
        >
            <template #empty> No se encontraron CFDI. </template>

            <Column selectionMode="multiple" headerStyle="width: 3rem" />

            <Column field="uuid" header="UUID" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 280px" />

            <Column field="serie" header="Serie" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="folio" header="Folio" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="fecha" header="Fecha Factura" headerClass="encabezado-columna" bodyClass="nowrap">
                <template #body="slotProps">
                    {{ handleFormatFecha(slotProps.data.fecha) }}
                </template>
            </Column>

            <Column field="emisorNombre" header="Emisor" headerClass="encabezado-columna" style="min-width: 220px" />

            <Column field="receptorNombre" header="Receptor" headerClass="encabezado-columna" style="min-width: 220px" />

            <Column header="Total" headerClass="encabezado-columna" bodyClass="nowrap total-numero">
                <template #body="slotProps"> $ {{ handleFormatMX(slotProps.data.total) }} </template>
            </Column>

            <Column header="# Pagos" headerClass="encabezado-columna" bodyClass="nowrap">
                <template #body="slotProps">
                    <div class="celda-resaltada">
                        {{ slotProps.data.numeroPagos || 0 }}
                    </div>
                </template>
            </Column>

            <Column header="Restante" headerClass="encabezado-columna" bodyClass="nowrap total-numero">
                <template #body="slotProps">
                    <div class="celda-resaltada">$ {{ handleFormatMX(slotProps.data.saldoInsolutoPagos) }}</div>
                </template>
            </Column>

            <Column header="Pagado" headerClass="encabezado-columna" bodyClass="nowrap total-numero">
                <template #body="slotProps">
                    <div class="celda-resaltada">$ {{ handleFormatMX(slotProps.data.montoPagos) }}</div>
                </template>
            </Column>

            <Column header="Cantidad a abonar" headerClass="encabezado-columna" style="min-width: 150px">
                <template #body="slotProps">
                    <InputText
                        :modelValue="handleMontoAbonar(slotProps.data)"
                        :disabled="!handleEstaSeleccionado(slotProps.data)"
                        keyfilter="money"
                        placeholder="0.00"
                        style="width: 110px; text-align: right"
                        @update:modelValue="handleCambiarAbonar(slotProps.data, $event)"
                    />
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'GenerarComplementoPago',

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
