<template>
    <div class="reporte-cfdi">
        <!-- ================================================= -->
        <!-- ENCABEZADO -->
        <!-- ================================================= -->

        <div class="reporte-header">
            <div class="header-info">
                <div class="header-icon">
                    <font-icon :icon="['fas', 'file-invoice-dollar']" />
                </div>

                <div>
                    <h2>Reporte CFDI</h2>

                    <p>Consulta CFDI por empresa, periodo y estatus de pago.</p>
                </div>
            </div>

            <Button type="button" label="Descargar Excel" severity="success" outlined :loading="exportando" :disabled="registrosFiltrados.length === 0" @click="handleExportarExcel">
                <template #icon>
                    <font-icon :icon="['fas', 'file-excel']" class="mr-2" />
                </template>
            </Button>
        </div>

        <!-- ================================================= -->
        <!-- FILTROS -->
        <!-- ================================================= -->

        <div class="card filtros">
            <!-- EMPRESA -->

            <div class="campo empresa">
                <label> Empresa </label>

                <Dropdown v-model="frmFiltros.empresa" :options="empresas" optionLabel="nombre" placeholder="Selecciona empresa" filter class="w-full" />
            </div>

            <!-- FECHA INICIAL -->

            <div class="campo">
                <label> Fecha inicial </label>

                <Calendar v-model="frmFiltros.fechaInicial" dateFormat="yy-mm-dd" showIcon :maxDate="fechaActual" class="w-full" />
            </div>

            <!-- FECHA FINAL -->

            <div class="campo">
                <label> Fecha final </label>

                <Calendar v-model="frmFiltros.fechaFinal" dateFormat="yy-mm-dd" showIcon :minDate="frmFiltros.fechaInicial" :maxDate="fechaActual" class="w-full" />
            </div>

            <!-- BOTONES -->

            <div class="filtro-acciones">
                <Button type="button" label="Consultar" :loading="cargando" @click="handleConsultar">
                    <template #icon>
                        <font-icon :icon="['fas', 'magnifying-glass']" class="mr-2" />
                    </template>
                </Button>

                <Button type="button" label="Limpiar" severity="secondary" outlined @click="handleLimpiar">
                    <template #icon>
                        <font-icon :icon="['fas', 'eraser']" class="mr-2" />
                    </template>
                </Button>
            </div>
        </div>

        <!-- ================================================= -->
        <!-- RESUMEN -->
        <!-- ================================================= -->

        <div class="resumen-grid">
            <div class="resumen-card">
                <span> CFDI </span>

                <strong>
                    {{ registrosFiltrados.length }}
                </strong>
            </div>

            <div class="resumen-card">
                <span> Facturado </span>

                <strong>
                    {{ formatoMoneda(totalFiltrado) }}
                </strong>
            </div>

            <div class="resumen-card resumen-pagado">
                <span> Pagado </span>

                <strong>
                    {{ formatoMoneda(pagadoFiltrado) }}
                </strong>
            </div>

            <div class="resumen-card resumen-restante">
                <span> Saldo pendiente </span>

                <strong>
                    {{ formatoMoneda(restanteFiltrado) }}
                </strong>
            </div>

            <div class="resumen-card resumen-pagadas">
                <span> Pagadas </span>

                <strong>
                    {{ resumen.pagadas }}
                </strong>
            </div>

            <div class="resumen-card resumen-parciales">
                <span> Parciales </span>

                <strong>
                    {{ resumen.parciales }}
                </strong>
            </div>

            <div class="resumen-card resumen-sin-pago">
                <span> Sin pago </span>

                <strong>
                    {{ resumen.sinPago }}
                </strong>
            </div>
        </div>

        <!-- ================================================= -->
        <!-- BUSCADOR -->
        <!-- ================================================= -->

        <div class="card buscador-card">
            <div class="campo-busqueda">
                <label> Buscar </label>

                <span class="p-input-icon-left w-full">
                    <i class="pi pi-search" />

                    <InputText v-model="buscar" class="w-full" placeholder="UUID, RFC, empresa, estado, pago..." />
                </span>
            </div>
        </div>

        <!-- ================================================= -->
        <!-- TABLA -->
        <!-- ================================================= -->

        <div class="card tabla-card">
            <DataTable :value="registrosFiltrados" :loading="cargando" paginator :rows="100" :rowsPerPageOptions="[100, 200, 500, 1000]" scrollable scrollHeight="55vh" stripedRows size="small" class="tabla-reporte">
                <template #empty>
                    <div class="tabla-vacia">No se encontraron CFDI.</div>
                </template>

                <!-- FOLIO FISCAL -->

                <Column field="uuid" header="Folio Fiscal" style="min-width: 280px" />

                <!-- RFC EMISOR -->

                <Column field="emisorRfc" header="RFC Emisor" style="min-width: 145px" />

                <!-- NOMBRE EMISOR -->

                <Column field="emisorNombre" header="Nombre Emisor" style="min-width: 250px" />

                <!-- RFC RECEPTOR -->

                <Column field="receptorRfc" header="RFC Receptor" style="min-width: 145px" />

                <!-- NOMBRE RECEPTOR -->

                <Column field="receptorNombre" header="Nombre Receptor" style="min-width: 250px" />

                <!-- FECHA EMISION -->

                <Column header="Fecha de Emisión" style="min-width: 170px">
                    <template #body="{ data }">
                        {{ formatoFecha(data.fechaEmision) }}
                    </template>
                </Column>

                <!-- FECHA CERTIFICACION -->

                <Column header="Fecha de Certificación" style="min-width: 180px">
                    <template #body="{ data }">
                        {{ formatoFecha(data.fechaCertificacion) }}
                    </template>
                </Column>

                <!-- PAC -->

                <Column field="pacCertifico" header="PAC que Certificó" style="min-width: 160px">
                    <template #body="{ data }">
                        {{ data.pacCertifico || '-' }}
                    </template>
                </Column>

                <!-- TOTAL -->

                <Column header="Total" style="min-width: 140px">
                    <template #body="{ data }">
                        {{ formatoMoneda(data.total) }}
                    </template>
                </Column>

                <!-- EFECTO -->

                <Column field="efecto" header="Efecto" style="min-width: 110px" />

                <!-- CANCELACION -->

                <Column field="estatusCancelacion" header="Estatus de cancelación" style="min-width: 220px">
                    <template #body="{ data }">
                        {{ data.estatusCancelacion || '-' }}
                    </template>
                </Column>

                <!-- ESTADO -->

                <Column header="Estado" style="min-width: 115px">
                    <template #body="{ data }">
                        <Tag :value="data.estado" :severity="severityEstado(data.estado)" />
                    </template>
                </Column>

                <!-- NUMERO PAGOS -->

                <Column field="numeroPagos" header="Pagos" style="min-width: 85px" />

                <!-- MONTO PAGADO -->

                <Column header="Monto pagado" style="min-width: 145px">
                    <template #body="{ data }">
                        {{ formatoMoneda(data.montoPagado) }}
                    </template>
                </Column>

                <!-- MONTO RESTANTE -->

                <Column header="Saldo pendiente" style="min-width: 145px">
                    <template #body="{ data }">
                        {{ formatoMoneda(data.montoRestante) }}
                    </template>
                </Column>

                <!-- ESTATUS PAGO -->

                <Column header="Estatus pago" style="min-width: 130px" frozen alignFrozen="right">
                    <template #body="{ data }">
                        <Tag :value="data.estatusPago" :severity="severityPago(data.estatusPago)" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<script>
import proceso from './js/proceso.js';

export default {
    name: 'ReporteCfdi',

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
