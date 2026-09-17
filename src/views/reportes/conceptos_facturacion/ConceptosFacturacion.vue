<template>
    <!-- ========================================================= -->
    <!-- ENCABEZADO -->
    <!-- ========================================================= -->

    <Encabezado titulo="Uso de Conceptos" subtitulo="Ranking de conceptos de facturación utilizados por empresa" icono="pi pi-chart-bar">
        <Button type="button" label="Exportar Excel" class="btn-exportar" :loading="exportando" :disabled="registrosFiltrados.length === 0" @click="handleExportarExcel">
            <template #icon>
                <font-icon icon="fa-solid fa-file-excel" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <!-- ========================================================= -->
    <!-- CARD PRINCIPAL -->
    <!-- ========================================================= -->

    <div class="card card-reporte-conceptos">
        <!-- ===================================================== -->
        <!-- FILTROS -->
        <!-- ===================================================== -->

        <div class="contenedor-filtros">
            <!-- ================================================= -->
            <!-- ENCABEZADO FILTROS -->
            <!-- ================================================= -->

            <div class="encabezado-filtros">
                <div class="icono-filtros">
                    <font-icon icon="fa-solid fa-ranking-star" />
                </div>

                <div>
                    <div class="titulo-filtros">Uso de Conceptos</div>

                    <small> Consulta cuáles conceptos se utilizan más y cuáles menos en el periodo seleccionado. </small>
                </div>
            </div>

            <div class="separador"></div>

            <!-- ================================================= -->
            <!-- GRID FILTROS -->
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
        <!-- RESUMEN -->
        <!-- ===================================================== -->

        <div class="grid-resumen">
            <!-- EMPRESAS -->

            <div class="tarjeta-resumen tarjeta-empresas">
                <div class="tarjeta-label">Empresas</div>

                <div class="tarjeta-valor">
                    {{ resumen.empresas }}
                </div>

                <small> Empresa(s) consultada(s) </small>
            </div>

            <!-- CONCEPTOS -->

            <div class="tarjeta-resumen tarjeta-conceptos">
                <div class="tarjeta-label">Conceptos</div>

                <div class="tarjeta-valor">
                    {{ resumen.conceptos }}
                </div>

                <small> Conceptos configurados </small>
            </div>

            <!-- UTILIZADOS -->

            <div class="tarjeta-resumen tarjeta-utilizados">
                <div class="tarjeta-label">Conceptos utilizados</div>

                <div class="tarjeta-valor">
                    {{ resumen.conceptosUtilizados }}
                </div>

                <small> Con al menos una factura </small>
            </div>

            <!-- SIN USO -->

            <div class="tarjeta-resumen tarjeta-sin-uso">
                <div class="tarjeta-label">Sin uso</div>

                <div class="tarjeta-valor">
                    {{ resumen.conceptosSinUso }}
                </div>

                <small> Sin facturación en el periodo </small>
            </div>

            <!-- TOTAL USOS -->

            <div class="tarjeta-resumen tarjeta-total-usos">
                <div class="tarjeta-label">Total usos</div>

                <div class="tarjeta-valor">
                    {{ resumen.totalUsos }}
                </div>

                <small> Facturas relacionadas </small>
            </div>
        </div>

        <!-- ===================================================== -->
        <!-- MÁS / MENOS UTILIZADO -->
        <!-- ===================================================== -->

        <div class="grid-destacados">
            <!-- MÁS UTILIZADO -->

            <div class="tarjeta-destacada destacado-mayor">
                <div class="destacado-icono">
                    <font-icon icon="fa-solid fa-arrow-trend-up" />
                </div>

                <div class="destacado-info">
                    <span> Concepto más utilizado </span>

                    <strong>
                        {{ textoMasUtilizado }}
                    </strong>

                    <small v-if="resumen.masUtilizado">
                        {{ resumen.masUtilizado.empresa }}
                        ·
                        {{ resumen.masUtilizado.numeroFacturado }}
                        factura(s)
                    </small>
                </div>
            </div>

            <!-- MENOS UTILIZADO -->

            <div class="tarjeta-destacada destacado-menor">
                <div class="destacado-icono">
                    <font-icon icon="fa-solid fa-arrow-trend-down" />
                </div>

                <div class="destacado-info">
                    <span> Concepto menos utilizado </span>

                    <strong>
                        {{ textoMenosUtilizado }}
                    </strong>

                    <small v-if="resumen.menosUtilizado">
                        {{ resumen.menosUtilizado.empresa }}
                        ·
                        {{ resumen.menosUtilizado.numeroFacturado }}
                        factura(s)
                    </small>
                </div>
            </div>
        </div>

        <!-- ===================================================== -->
        <!-- TABLA -->
        <!-- ===================================================== -->

        <div class="seccion-conceptos">
            <!-- ================================================= -->
            <!-- TITULO -->
            <!-- ================================================= -->

            <div class="titulo-seccion">
                <div>
                    <h3>Conceptos por Empresa</h3>

                    <small> Ordenados del concepto más utilizado al menos utilizado. </small>
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

                    <InputText v-model="buscar" placeholder="Buscar empresa, RFC, concepto..." class="buscador" />
                </IconField>

                <div class="contador">
                    {{ registrosFiltrados.length }}
                    concepto(s)
                </div>
            </div>

            <!-- ================================================= -->
            <!-- DATATABLE -->
            <!-- ================================================= -->

            <DataTable :value="registrosFiltrados" :loading="cargando" paginator :rows="50" :rowsPerPageOptions="[20, 50, 100, 200]" scrollable scrollHeight="50vh" size="small" class="tabla-conceptos">
                <template #empty> No se encontró información para el periodo. </template>

                <!-- RANKING -->

                <Column field="ranking" header="#" style="min-width: 60px">
                    <template #body="slotProps">
                        <span
                            class="ranking"
                            :class="{
                                'ranking-primero': slotProps.data.ranking === 1,

                                'ranking-segundo': slotProps.data.ranking === 2,

                                'ranking-tercero': slotProps.data.ranking === 3
                            }"
                        >
                            {{ slotProps.data.ranking }}
                        </span>
                    </template>
                </Column>

                <!-- EMPRESA -->

                <Column field="empresa" header="Empresa" style="min-width: 220px">
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

                <!-- PRODSERV -->

                <Column field="prod_serv" header="ProdServ" style="min-width: 100px" />

                <!-- DESCRIPCION -->

                <Column field="descripcion" header="Descripción" style="min-width: 330px" />

                <!-- CLAVE UNIDAD -->

                <Column field="clave_unidad" header="Clave Unidad" style="min-width: 100px" />

                <!-- UNIDAD -->

                <Column field="unidad" header="Unidad" style="min-width: 160px" />

                <!-- OBJETO IMP -->

                <Column field="objeto_imp" header="Objeto Imp." style="min-width: 95px" />

                <!-- NUMERO FACTURADO -->

                <Column field="numeroFacturado" header="Número Facturado" style="min-width: 125px">
                    <template #body="slotProps">
                        <span
                            class="badge-uso"
                            :class="{
                                'badge-sin-uso': Number(slotProps.data.numeroFacturado) === 0
                            }"
                        >
                            {{ slotProps.data.numeroFacturado }}
                        </span>
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
    name: 'UsoConceptos',

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
