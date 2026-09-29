<template>
    <Encabezado titulo="Conciliación CFDI" subtitulo="Conciliación de facturas, pagos, notas de crédito, cancelaciones y sustituciones" icono="pi pi-check-circle">
        <Button type="button" label="Exportar Excel" class="btn-excel" :disabled="!catConciliacionFiltrada.length" @click="handleExportarExcel">
            <template #icon>
                <font-icon icon="fa-solid fa-file-excel" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <div class="card p-0 m-0 conciliacion-card">
        <!-- =========================================================
             FILTROS
        ========================================================== -->

        <form class="filtros-conciliacion" @submit.prevent="handleConsultar">
            <!-- EMPRESA -->

            <div class="campo-filtro empresa-filtro">
                <label> Empresa </label>

                <Dropdown v-model="frmFiltros.empresa" :options="catCompaniasSat" optionLabel="razon_social_nombre_completo" optionValue="rfc" placeholder="Seleccione empresa" filter class="w-full" />
            </div>

            <!-- TIPO -->

            <div class="campo-filtro">
                <label> Tipo </label>

                <Dropdown v-model="frmFiltros.tipo" :options="catTipo" optionLabel="description" optionValue="id" placeholder="Tipo" class="w-full" />
            </div>

            <!-- ESTADO SAT -->

            <div class="campo-filtro">
                <label> Estado SAT </label>

                <Dropdown v-model="frmFiltros.estadoSat" :options="catEstadoSat" optionLabel="description" optionValue="id" placeholder="Todos" showClear class="w-full" />
            </div>

            <!-- ESTADO CONCILIACION -->

            <div class="campo-filtro">
                <label> Conciliación </label>

                <Dropdown v-model="frmFiltros.estadoConciliacion" :options="catEstadoConciliacion" optionLabel="description" optionValue="id" placeholder="Todos" showClear class="w-full" />
            </div>

            <!-- RFC CONTRAPARTE -->

            <div class="campo-filtro">
                <label> RFC contraparte </label>

                <InputText v-model="frmFiltros.rfcContraparte" placeholder="RFC" maxlength="13" class="w-full" @input="handleRFC" />
            </div>

            <!-- FECHA INICIAL -->

            <div class="campo-filtro">
                <label> Inicial </label>

                <DatePicker v-model="frmFiltros.fechaInicial" dateFormat="yy-mm-dd" showIcon class="w-full" :maxDate="fechaActual" />
            </div>

            <!-- FECHA FINAL -->

            <div class="campo-filtro">
                <label> Final </label>

                <DatePicker v-model="frmFiltros.fechaFinal" dateFormat="yy-mm-dd" showIcon class="w-full" :maxDate="fechaActual" :minDate="frmFiltros.fechaInicial" />
            </div>

            <!-- CONSULTAR -->

            <Button type="submit" class="btn-nuevo boton-filtro" :disabled="botonConsultarDeshabilitado" v-tooltip.top="'Consultar conciliación'">
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
             RESUMEN
        ========================================================== -->

        <div v-if="consultaRealizada" class="resumen-conciliacion">
            <div class="resumen-card">
                <div class="resumen-icono resumen-total">
                    <font-icon icon="fa-solid fa-file-invoice-dollar" />
                </div>

                <div>
                    <span> Total neto </span>

                    <strong>
                        $
                        {{ handleFormatMX(resumen.totalNeto) }}
                    </strong>
                </div>
            </div>

            <div class="resumen-card">
                <div class="resumen-icono resumen-pagado">
                    <font-icon icon="fa-solid fa-money-check-dollar" />
                </div>

                <div>
                    <span> Pagado </span>

                    <strong>
                        $
                        {{ handleFormatMX(resumen.totalPagado) }}
                    </strong>
                </div>
            </div>

            <div class="resumen-card">
                <div class="resumen-icono resumen-saldo">
                    <font-icon icon="fa-solid fa-wallet" />
                </div>

                <div>
                    <span> Saldo </span>

                    <strong>
                        $
                        {{ handleFormatMX(resumen.totalSaldo) }}
                    </strong>
                </div>
            </div>

            <div class="resumen-card">
                <div class="resumen-icono resumen-ok">
                    <font-icon icon="fa-solid fa-circle-check" />
                </div>

                <div>
                    <span> Conciliadas </span>

                    <strong>
                        {{ resumen.conciliadas }}
                    </strong>
                </div>
            </div>

            <div class="resumen-card">
                <div class="resumen-icono resumen-parcial">
                    <font-icon icon="fa-solid fa-circle-half-stroke" />
                </div>

                <div>
                    <span> Parciales </span>

                    <strong>
                        {{ resumen.parciales }}
                    </strong>
                </div>
            </div>

            <div class="resumen-card">
                <div class="resumen-icono resumen-error">
                    <font-icon icon="fa-solid fa-triangle-exclamation" />
                </div>

                <div>
                    <span> Diferencias </span>

                    <strong>
                        {{ resumen.conDiferencia }}
                    </strong>
                </div>
            </div>
        </div>

        <!-- =========================================================
             CABECERA TABLA
        ========================================================== -->

        <div class="barra-tabla">
            <div class="titulo-tabla">
                <span> Conciliación de facturas </span>

                <small>
                    {{ catConciliacionFiltrada.length }}
                    registros
                </small>
            </div>

            <div class="acciones-tabla">
                <!-- EXPANDIR -->

                <Button type="button" icon="pi pi-plus" label="Expandir" outlined size="small" :disabled="!catConciliacionFiltrada.length" @click="handleExpandirTodo" />

                <!-- CONTRAER -->

                <Button type="button" icon="pi pi-minus" label="Contraer" outlined size="small" :disabled="!catConciliacionFiltrada.length" @click="handleContraerTodo" />

                <!-- BUSCADOR -->

                <IconField iconPosition="left">
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>

                    <InputText v-model="ctrlBuscar" placeholder="Buscar UUID, RFC, cliente, folio..." class="buscador-conciliacion" />
                </IconField>
            </div>
        </div>

        <!-- =========================================================
             TABLA PRINCIPAL
        ========================================================== -->

        <DataTable
            v-model:expandedRows="expandedRows"
            :value="catConciliacionFiltrada"
            dataKey="uuidFactura"
            paginator
            :rows="100"
            :rowsPerPageOptions="[100, 250, 500, 1000]"
            scrollable
            scrollHeight="43vh"
            size="small"
            stripedRows
            tableStyle="min-width: 150rem"
            class="tabla-encabezados tabla-conciliacion"
            style="font-size: 10px"
        >
            <!-- SIN REGISTROS -->

            <template #empty>
                <div class="tabla-vacia">
                    <font-icon icon="fa-solid fa-scale-balanced" />

                    <strong> No se encontraron registros </strong>

                    <span> Seleccione los filtros y presione consultar. </span>
                </div>
            </template>

            <!-- EXPANSION -->

            <Column expander style="width: 3rem" />

            <!-- ESTADO -->

            <Column field="estadoConciliacion" header="Conciliación" headerClass="encabezado-columna" bodyClass="nowrap">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.estadoConciliacion" :severity="handleSeverityConciliacion(slotProps.data.estadoConciliacion)" />
                </template>
            </Column>

            <!-- ESTADO SAT -->

            <Column field="estadoSat" header="Estado SAT" headerClass="encabezado-columna" bodyClass="nowrap">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.estadoSat" :severity="handleSeverityEstadoSAT(slotProps.data.estadoSat)" />
                </template>
            </Column>

            <!-- SERIE -->

            <Column field="serie" header="Serie" headerClass="encabezado-columna" bodyClass="nowrap" />

            <!-- FOLIO -->

            <Column field="folio" header="Folio" headerClass="encabezado-columna" bodyClass="nowrap" />

            <!-- UUID -->

            <Column field="uuidFactura" header="UUID Factura" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 290px" />

            <!-- FECHA -->

            <Column header="Fecha Factura" headerClass="encabezado-columna" bodyClass="nowrap">
                <template #body="slotProps">
                    {{ handleFormatFecha(slotProps.data.fechaFactura) }}
                </template>
            </Column>

            <!-- RFC RECEPTOR -->

            <Column field="rfcReceptor" header="RFC Receptor" headerClass="encabezado-columna" bodyClass="nowrap" />

            <!-- NOMBRE RECEPTOR -->

            <Column field="nombreReceptor" header="Receptor" headerClass="encabezado-columna" style="min-width: 260px" />

            <!-- METODO -->

            <Column field="metodoPago" header="Método" headerClass="encabezado-columna" bodyClass="nowrap" />

            <!-- MONEDA -->

            <Column field="moneda" header="Moneda" headerClass="encabezado-columna" bodyClass="nowrap" />

            <!-- FACTURA -->

            <Column header="Factura" headerClass="encabezado-columna" bodyClass="numero">
                <template #body="slotProps">
                    $
                    {{ handleFormatMX(slotProps.data.totalFactura) }}
                </template>
            </Column>

            <!-- NOTAS -->

            <Column header="Notas" headerClass="encabezado-columna" bodyClass="numero">
                <template #body="slotProps">
                    <span
                        :class="{
                            'texto-nota': Number(slotProps.data.totalNotasCredito || 0) > 0
                        }"
                    >
                        -$
                        {{ handleFormatMX(slotProps.data.totalNotasCredito) }}
                    </span>
                </template>
            </Column>

            <!-- NETO -->

            <Column header="Neto" headerClass="encabezado-columna" bodyClass="numero">
                <template #body="slotProps">
                    $
                    {{ handleFormatMX(slotProps.data.totalNeto) }}
                </template>
            </Column>

            <!-- PAGADO -->

            <Column header="Pagado" headerClass="encabezado-columna" bodyClass="numero">
                <template #body="slotProps">
                    <span class="texto-pagado">
                        $
                        {{ handleFormatMX(slotProps.data.totalPagado) }}
                    </span>
                </template>
            </Column>

            <!-- SALDO -->

            <Column header="Saldo" headerClass="encabezado-columna" bodyClass="numero">
                <template #body="slotProps">
                    <strong :class="handleClaseSaldo(slotProps.data.saldo)">
                        $
                        {{ handleFormatMX(slotProps.data.saldo) }}
                    </strong>
                </template>
            </Column>

            <!-- PAGOS -->

            <Column field="numeroPagos" header="Pagos" headerClass="encabezado-columna" bodyClass="numero-centro" />

            <!-- ULTIMA PARCIALIDAD -->

            <Column field="ultimaParcialidad" header="Parcialidad" headerClass="encabezado-columna" bodyClass="numero-centro" />

            <!-- DIFERENCIA -->

            <Column header="Diferencia" headerClass="encabezado-columna" bodyClass="numero">
                <template #body="slotProps">
                    <span
                        :class="{
                            'texto-diferencia': slotProps.data.tieneDiferencia
                        }"
                    >
                        $
                        {{ handleFormatMX(slotProps.data.diferencia) }}
                    </span>
                </template>
            </Column>

            <!-- BANDERAS -->

            <Column header="Alertas" headerClass="encabezado-columna" style="min-width: 230px">
                <template #body="slotProps">
                    <div class="banderas">
                        <Tag v-for="(bandera, index) in slotProps.data.banderas" :key="index" :value="bandera" severity="warn" />
                    </div>
                </template>
            </Column>

            <!-- =====================================================
                 EXPANSION DETALLE
            ====================================================== -->

            <template #expansion="slotProps">
                <div class="detalle-conciliacion">
                    <!-- =============================================
                         RESUMEN FACTURA
                    ============================================== -->

                    <div class="detalle-resumen">
                        <div>
                            <span> Factura </span>

                            <strong>
                                {{ slotProps.data.serie }}
                                {{ slotProps.data.folio }}
                            </strong>
                        </div>

                        <div>
                            <span> Total </span>

                            <strong>
                                $
                                {{ handleFormatMX(slotProps.data.totalFactura) }}
                            </strong>
                        </div>

                        <div>
                            <span> Notas </span>

                            <strong>
                                -$
                                {{ handleFormatMX(slotProps.data.totalNotasCredito) }}
                            </strong>
                        </div>

                        <div>
                            <span> Neto </span>

                            <strong>
                                $
                                {{ handleFormatMX(slotProps.data.totalNeto) }}
                            </strong>
                        </div>

                        <div>
                            <span> Pagado </span>

                            <strong>
                                $
                                {{ handleFormatMX(slotProps.data.totalPagado) }}
                            </strong>
                        </div>

                        <div>
                            <span> Saldo </span>

                            <strong>
                                $
                                {{ handleFormatMX(slotProps.data.saldo) }}
                            </strong>
                        </div>
                    </div>

                    <!-- =============================================
                         PAGOS
                    ============================================== -->

                    <div class="detalle-seccion">
                        <h4>
                            <font-icon icon="fa-solid fa-money-check-dollar" />

                            Complementos de pago

                            <span> ({{ slotProps.data.pagos?.length || 0 }}) </span>
                        </h4>

                        <DataTable :value="slotProps.data.pagos || []" size="small" stripedRows class="tabla-detalle">
                            <template #empty> Sin complementos de pago. </template>

                            <Column field="uuidPago" header="UUID Pago" />

                            <Column field="folio" header="Folio" />

                            <Column field="fechaPago" header="Fecha Pago" />

                            <Column field="formaDePagoP" header="Forma Pago" />

                            <Column field="numParcialidad" header="Parcialidad" />

                            <Column header="Saldo anterior">
                                <template #body="pago">
                                    $
                                    {{ handleFormatMX(pago.data.impSaldoAnt) }}
                                </template>
                            </Column>

                            <Column header="Pagado">
                                <template #body="pago">
                                    $
                                    {{ handleFormatMX(pago.data.impPagado) }}
                                </template>
                            </Column>

                            <Column header="Saldo insoluto">
                                <template #body="pago">
                                    $
                                    {{ handleFormatMX(pago.data.impSaldoInsoluto) }}
                                </template>
                            </Column>

                            <Column field="estadoSat" header="Estado SAT">
                                <template #body="pago">
                                    <Tag :value="pago.data.estadoSat" :severity="handleSeverityEstadoSAT(pago.data.estadoSat)" />
                                </template>
                            </Column>
                        </DataTable>
                    </div>

                    <!-- =============================================
                         NOTAS DE CREDITO
                    ============================================== -->

                    <div class="detalle-seccion">
                        <h4>
                            <font-icon icon="fa-solid fa-file-circle-minus" />

                            Notas de crédito

                            <span> ({{ slotProps.data.notasCredito?.length || 0 }}) </span>
                        </h4>

                        <DataTable :value="slotProps.data.notasCredito || []" size="small" stripedRows class="tabla-detalle">
                            <template #empty> Sin notas de crédito relacionadas. </template>

                            <Column field="uuid" header="UUID" />

                            <Column field="serie" header="Serie" />

                            <Column field="folio" header="Folio" />

                            <Column field="fecha" header="Fecha" />

                            <Column field="tipoRelacion" header="Relación" />

                            <Column field="moneda" header="Moneda" />

                            <Column header="Total">
                                <template #body="nota">
                                    $
                                    {{ handleFormatMX(nota.data.total) }}
                                </template>
                            </Column>

                            <Column field="estadoSat" header="Estado SAT">
                                <template #body="nota">
                                    <Tag :value="nota.data.estadoSat" :severity="handleSeverityEstadoSAT(nota.data.estadoSat)" />
                                </template>
                            </Column>

                            <Column header="Aplica">
                                <template #body="nota">
                                    <Tag :value="nota.data.aplicaConciliacion ? 'Sí' : 'No'" :severity="nota.data.aplicaConciliacion ? 'success' : 'secondary'" />
                                </template>
                            </Column>
                        </DataTable>
                    </div>

                    <!-- =============================================
                         SUSTITUCIONES
                    ============================================== -->

                    <div class="detalle-seccion">
                        <h4>
                            <font-icon icon="fa-solid fa-code-compare" />

                            Sustituciones

                            <span> ({{ slotProps.data.sustituciones?.length || 0 }}) </span>
                        </h4>

                        <DataTable :value="slotProps.data.sustituciones || []" size="small" stripedRows class="tabla-detalle">
                            <template #empty> Sin sustituciones. </template>

                            <Column field="uuid" header="UUID sustituto" />

                            <Column field="serie" header="Serie" />

                            <Column field="folio" header="Folio" />

                            <Column field="fecha" header="Fecha" />

                            <Column header="Total">
                                <template #body="sust">
                                    $
                                    {{ handleFormatMX(sust.data.total) }}
                                </template>
                            </Column>

                            <Column field="estadoSat" header="Estado SAT">
                                <template #body="sust">
                                    <Tag :value="sust.data.estadoSat" :severity="handleSeverityEstadoSAT(sust.data.estadoSat)" />
                                </template>
                            </Column>
                        </DataTable>
                    </div>

                    <!-- =============================================
                         RELACIONES
                    ============================================== -->

                    <div class="detalle-seccion">
                        <h4>
                            <font-icon icon="fa-solid fa-link" />

                            Relaciones CFDI

                            <span> ({{ slotProps.data.relaciones?.length || 0 }}) </span>
                        </h4>

                        <DataTable :value="slotProps.data.relaciones || []" size="small" stripedRows class="tabla-detalle">
                            <template #empty> Sin relaciones CFDI. </template>

                            <Column field="tipoRelacion" header="Tipo relación" />

                            <Column field="uuid" header="UUID origen" />

                            <Column field="uuidRelacionado" header="UUID relacionado" />
                        </DataTable>
                    </div>
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';

import proceso from './js/proceso.js';

export default {
    name: 'Conciliacion',

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
