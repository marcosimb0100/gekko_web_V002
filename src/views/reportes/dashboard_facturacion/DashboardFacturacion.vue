<template>
    <!-- ========================================================= -->
    <!-- ENCABEZADO -->
    <!-- ========================================================= -->

    <Encabezado titulo="Dashboard de Facturación" subtitulo="Seguimiento mensual de facturación, cobranza y solicitudes por empresa" icono="pi pi-chart-bar">
        <Button type="button" label="Exportar Excel" class="btn-exportar" :loading="exportando" :disabled="registrosFiltrados.length === 0" @click="handleExportarExcel">
            <template #icon>
                <font-icon icon="fa-solid fa-file-excel" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <!-- ========================================================= -->
    <!-- FILTROS -->
    <!-- ========================================================= -->

    <div class="card card-dashboard">
        <div class="contenedor-filtros">
            <!-- ================================================= -->
            <!-- TITULO -->
            <!-- ================================================= -->

            <div class="encabezado-filtros">
                <div class="icono-filtros">
                    <font-icon icon="fa-solid fa-chart-column" />
                </div>

                <div>
                    <div class="titulo-filtros">Resumen de Facturación</div>

                    <small> Consulta el avance por empresa en el periodo seleccionado. </small>
                </div>
            </div>

            <div class="separador"></div>

            <!-- ================================================= -->
            <!-- FILTROS -->
            <!-- ================================================= -->

            <div class="grid-filtros">
                <!-- EMPRESA -->

                <div class="campo-filtro">
                    <label> Empresa </label>

                    <Dropdown v-model="frmFiltros.empresa" :options="empresas" optionLabel="nombre" placeholder="Todas las empresas" filter showClear class="w-full" />
                </div>

                <!-- FECHA INICIAL -->

                <div class="campo-filtro">
                    <label> Fecha inicial </label>

                    <Calendar v-model="frmFiltros.fechaInicial" dateFormat="yy-mm-dd" showIcon :maxDate="fechaActual" class="w-full" />
                </div>

                <!-- FECHA FINAL -->

                <div class="campo-filtro">
                    <label> Fecha final </label>

                    <Calendar v-model="frmFiltros.fechaFinal" dateFormat="yy-mm-dd" showIcon :maxDate="fechaActual" class="w-full" />
                </div>

                <!-- BOTONES -->

                <div class="acciones-filtros">
                    <Button type="button" label="Limpiar" class="btn-limpiar" :disabled="cargando" @click="handleLimpiar">
                        <template #icon>
                            <font-icon icon="fa-solid fa-eraser" class="mr-2" />
                        </template>
                    </Button>

                    <Button type="button" label="Consultar" class="btn-consultar" :loading="cargando" @click="handleConsultar">
                        <template #icon>
                            <font-icon icon="fa-solid fa-magnifying-glass" class="mr-2" />
                        </template>
                    </Button>
                </div>
            </div>
        </div>

        <!-- ===================================================== -->
        <!-- TARJETAS FINANCIERAS -->
        <!-- ===================================================== -->

        <div class="grid-resumen-financiero">
            <!-- FACTURADO -->

            <div class="tarjeta-dashboard tarjeta-facturado">
                <div class="tarjeta-label">Facturado</div>

                <div class="tarjeta-valor">
                    {{ formatoMoneda(resumen.facturado) }}
                </div>

                <small>
                    {{ resumen.cantidadCfdi }}

                    CFDI emitido(s)
                </small>
            </div>

            <!-- PAGADO -->

            <div class="tarjeta-dashboard tarjeta-pagado">
                <div class="tarjeta-label">Pagado</div>

                <div class="tarjeta-valor">
                    {{ formatoMoneda(resumen.pagado) }}
                </div>

                <small> Cobranza aplicada a CFDI del periodo </small>
            </div>

            <!-- PENDIENTE -->

            <div class="tarjeta-dashboard tarjeta-saldo">
                <div class="tarjeta-label">Saldo pendiente</div>

                <div class="tarjeta-valor">
                    {{ formatoMoneda(resumen.saldoPendiente) }}
                </div>

                <small> Facturado pendiente de cobro </small>
            </div>

            <!-- PORCENTAJE -->

            <div class="tarjeta-dashboard tarjeta-avance">
                <div class="tarjeta-label">Avance de pago</div>

                <div class="tarjeta-valor">
                    {{ formatoPorcentaje(resumen.porcentajePagado) }}
                </div>

                <div class="barra-avance">
                    <div
                        class="barra-avance-contenido"
                        :class="clasePorcentaje(resumen.porcentajePagado)"
                        :style="{
                            width: Math.min(Number(resumen.porcentajePagado || 0), 100) + '%'
                        }"
                    ></div>
                </div>
            </div>
        </div>

        <!-- ===================================================== -->
        <!-- SOLICITUDES -->
        <!-- ===================================================== -->

        <div class="grid-resumen-solicitudes">
            <!-- PENDIENTES -->

            <div class="tarjeta-solicitud solicitud-pendiente">
                <div class="tarjeta-solicitud-icono">
                    <font-icon icon="fa-solid fa-clock" />
                </div>

                <div>
                    <span> Solicitudes Pendientes </span>

                    <strong>
                        {{ resumen.solicitudesPendientes }}
                    </strong>
                </div>
            </div>

            <!-- RECHAZADAS -->

            <div class="tarjeta-solicitud solicitud-rechazada">
                <div class="tarjeta-solicitud-icono">
                    <font-icon icon="fa-solid fa-circle-xmark" />
                </div>

                <div>
                    <span> Solicitudes Rechazadas </span>

                    <strong>
                        {{ resumen.solicitudesRechazadas }}
                    </strong>
                </div>
            </div>

            <!-- TIMBRADAS -->

            <div class="tarjeta-solicitud solicitud-timbrada">
                <div class="tarjeta-solicitud-icono">
                    <font-icon icon="fa-solid fa-circle-check" />
                </div>

                <div>
                    <span> Solicitudes Timbradas </span>

                    <strong>
                        {{ resumen.solicitudesTimbradas }}
                    </strong>
                </div>
            </div>
        </div>

        <!-- ===================================================== -->
        <!-- TABLA POR EMPRESA -->
        <!-- ===================================================== -->

        <div class="seccion-empresas">
            <div class="titulo-seccion">
                <div>
                    <h3>Facturación por Empresa</h3>

                    <small> Facturación, cobranza y solicitudes del periodo. </small>
                </div>
            </div>

            <!-- ================================================= -->
            <!-- BUSCADOR -->
            <!-- ================================================= -->

            <div class="barra-tabla">
                <Button type="button" label="Limpiar" icon="pi pi-filter-slash" outlined @click="buscar = ''" />

                <IconField iconPosition="left">
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>

                    <InputText v-model="buscar" placeholder="Buscar empresa, RFC..." class="buscador" />
                </IconField>

                <div class="contador">
                    {{ registrosFiltrados.length }}

                    empresa(s)
                </div>
            </div>

            <!-- ================================================= -->
            <!-- TABLA -->
            <!-- ================================================= -->

            <DataTable :value="registrosFiltrados" :loading="cargando" paginator :rows="50" :rowsPerPageOptions="[20, 50, 100]" scrollable scrollHeight="50vh" size="small" class="tabla-dashboard">
                <template #empty> No se encontró información para el periodo. </template>

                <!-- EMPRESA -->

                <Column field="empresa" header="Empresa" style="min-width: 260px">
                    <template #body="slotProps">
                        <div class="celda-empresa">
                            <strong>
                                {{ slotProps.data.empresa }}
                            </strong>

                            <small>
                                {{ slotProps.data.rfc }}
                            </small>
                        </div>
                    </template>
                </Column>

                <!-- CFDI -->

                <Column field="cantidadCfdi" header="CFDI" style="min-width: 75px" />

                <!-- FACTURADO -->

                <Column field="facturado" header="Facturado" style="min-width: 135px">
                    <template #body="slotProps">
                        <strong>
                            {{ formatoMoneda(slotProps.data.facturado) }}
                        </strong>
                    </template>
                </Column>

                <!-- PAGADO -->

                <Column field="pagado" header="Pagado" style="min-width: 135px">
                    <template #body="slotProps">
                        <span class="importe-pagado">
                            {{ formatoMoneda(slotProps.data.pagado) }}
                        </span>
                    </template>
                </Column>

                <!-- SALDO -->

                <Column field="saldoPendiente" header="Saldo Pendiente" style="min-width: 145px">
                    <template #body="slotProps">
                        <span
                            :class="{
                                'importe-pendiente': Number(slotProps.data.saldoPendiente) > 0
                            }"
                        >
                            {{ formatoMoneda(slotProps.data.saldoPendiente) }}
                        </span>
                    </template>
                </Column>

                <!-- SOLICITUDES PENDIENTES -->

                <Column field="solicitudesPendientes" header="Sol. Pendientes" style="min-width: 115px">
                    <template #body="slotProps">
                        <span class="badge-dashboard badge-pendiente">
                            {{ slotProps.data.solicitudesPendientes }}
                        </span>
                    </template>
                </Column>

                <!-- RECHAZADAS -->

                <Column field="solicitudesRechazadas" header="Rechazadas" style="min-width: 100px">
                    <template #body="slotProps">
                        <span class="badge-dashboard badge-rechazada">
                            {{ slotProps.data.solicitudesRechazadas }}
                        </span>
                    </template>
                </Column>

                <!-- TIMBRADAS -->

                <Column field="solicitudesTimbradas" header="Timbradas" style="min-width: 95px">
                    <template #body="slotProps">
                        <span class="badge-dashboard badge-timbrada">
                            {{ slotProps.data.solicitudesTimbradas }}
                        </span>
                    </template>
                </Column>

                <!-- AVANCE -->

                <Column field="porcentajePagado" header="% Pagado" style="min-width: 180px">
                    <template #body="slotProps">
                        <div class="avance-tabla">
                            <div class="avance-tabla-superior">
                                <span>
                                    {{ formatoPorcentaje(slotProps.data.porcentajePagado) }}
                                </span>
                            </div>

                            <div class="barra-avance-tabla">
                                <div
                                    class="barra-avance-contenido"
                                    :class="clasePorcentaje(slotProps.data.porcentajePagado)"
                                    :style="{
                                        width: Math.min(Number(slotProps.data.porcentajePagado || 0), 100) + '%'
                                    }"
                                ></div>
                            </div>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';

import proceso from './js/proceso.js';

export default {
    name: 'DashboardFacturacion',

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
