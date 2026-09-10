<template>
    <!-- ========================================================= -->
    <!-- ENCABEZADO -->
    <!-- ========================================================= -->

    <Encabezado titulo="Historial de Cargas" subtitulo="Consulta y administración de estados de cuenta cargados" icono="pi pi-history">
        <Button type="button" label="Actualizar" class="btn-nuevo" :loading="cargando" @click="handleCargarHistorial">
            <template #icon>
                <font-icon icon="fa-solid fa-rotate" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <!-- ========================================================= -->
    <!-- CONTENIDO -->
    <!-- ========================================================= -->

    <div class="card card-historial">
        <!-- ===================================================== -->
        <!-- FILTROS -->
        <!-- ===================================================== -->

        <div class="contenedor-filtros">
            <div class="encabezado-filtros">
                <div class="icono-filtros">
                    <font-icon icon="fa-solid fa-clock-rotate-left" />
                </div>

                <div>
                    <div class="titulo-filtros">Historial de Estados de Cuenta</div>

                    <div class="subtitulo-filtros">Consulta los archivos guardados y revierte cargas incorrectas.</div>
                </div>
            </div>

            <div class="separador"></div>

            <!-- ================================================= -->
            <!-- CAMPOS -->
            <!-- ================================================= -->

            <div class="grid-filtros">
                <!-- EMPRESA -->

                <div class="campo-filtro">
                    <label> Empresa </label>

                    <Dropdown v-model="empresaFiltro" :options="empresas" optionLabel="nombre" placeholder="Todas las empresas" filter showClear class="w-full">
                        <template #option="slotProps">
                            <div class="opcion-empresa">
                                <strong>
                                    {{ slotProps.option.nombre }}
                                </strong>

                                <small>
                                    {{ slotProps.option.rfc || 'Sin RFC' }}
                                </small>
                            </div>
                        </template>
                    </Dropdown>
                </div>

                <!-- BANCO -->

                <div class="campo-filtro">
                    <label> Banco </label>

                    <Dropdown v-model="bancoFiltro" :options="bancos" optionLabel="label" placeholder="Todos los bancos" filter showClear class="w-full" />
                </div>

                <!-- AÑO -->

                <div class="campo-filtro">
                    <label> Año </label>

                    <Dropdown v-model="anioFiltro" :options="anios" optionLabel="label" optionValue="value" placeholder="Todos" showClear class="w-full" />
                </div>
            </div>
        </div>

        <!-- ===================================================== -->
        <!-- RESUMEN -->
        <!-- ===================================================== -->

        <div class="grid-resumen">
            <!-- CARGAS -->

            <div class="tarjeta-resumen">
                <div class="tarjeta-icono">
                    <font-icon icon="fa-solid fa-file-arrow-up" />
                </div>

                <div>
                    <span> Cargas </span>

                    <strong>
                        {{ totalCargas }}
                    </strong>
                </div>
            </div>

            <!-- MOVIMIENTOS -->

            <div class="tarjeta-resumen">
                <div class="tarjeta-icono">
                    <font-icon icon="fa-solid fa-list" />
                </div>

                <div>
                    <span> Movimientos procesados </span>

                    <strong>
                        {{ totalMovimientos }}
                    </strong>
                </div>
            </div>

            <!-- NUEVOS -->

            <div class="tarjeta-resumen">
                <div class="tarjeta-icono">
                    <font-icon icon="fa-solid fa-circle-check" />
                </div>

                <div>
                    <span> Movimientos nuevos </span>

                    <strong class="texto-correcto">
                        {{ totalInsertados }}
                    </strong>
                </div>
            </div>

            <!-- DUPLICADOS -->

            <div class="tarjeta-resumen">
                <div class="tarjeta-icono">
                    <font-icon icon="fa-solid fa-clone" />
                </div>

                <div>
                    <span> Duplicados detectados </span>

                    <strong class="texto-observacion">
                        {{ totalDuplicados }}
                    </strong>
                </div>
            </div>
        </div>

        <!-- ===================================================== -->
        <!-- TABLA -->
        <!-- ===================================================== -->

        <div class="contenedor-tabla">
            <!-- ================================================= -->
            <!-- BARRA -->
            <!-- ================================================= -->

            <div class="barra-tabla">
                <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined @click="handleLimpiarFiltros" />

                <IconField iconPosition="left">
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>

                    <InputText v-model="filtros.global.value" placeholder="Buscar..." class="buscador" />
                </IconField>

                <div class="contador-registros">
                    {{ cargasFiltradas.length }}

                    carga(s)
                </div>
            </div>

            <!-- ================================================= -->
            <!-- DATATABLE -->
            <!-- ================================================= -->

            <DataTable
                v-model:filters="filtros"
                :value="cargasFiltradas"
                :loading="cargando"
                :globalFilterFields="['empresa.razon_social', 'empresa.rfc', 'banco.descripcion', 'banco.clabe_banco', 'cuenta_banco', 'clabe_cuenta', 'layout.nombre', 'archivo.nombre_original', 'archivo.anio', 'fecha_carga']"
                paginator
                :rows="50"
                :rowsPerPageOptions="[20, 50, 100, 250]"
                scrollable
                scrollHeight="55vh"
                size="small"
                class="tabla-encabezados"
            >
                <!-- ============================================= -->
                <!-- VACIO -->
                <!-- ============================================= -->

                <template #empty> No existen cargas de estados de cuenta. </template>

                <!-- ============================================= -->
                <!-- EMPRESA -->
                <!-- ============================================= -->

                <Column field="empresa.razon_social" header="Empresa" headerClass="encabezado-columna" style="min-width: 220px">
                    <template #body="slotProps">
                        <div class="celda-empresa">
                            <strong>
                                {{ slotProps.data?.empresa?.razon_social || '-' }}
                            </strong>

                            <small>
                                {{ slotProps.data?.empresa?.rfc || '' }}
                            </small>
                        </div>
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- BANCO -->
                <!-- ============================================= -->

                <Column field="banco.descripcion" header="Banco" headerClass="encabezado-columna" style="min-width: 150px">
                    <template #body="slotProps">
                        <div class="celda-banco">
                            <span class="badge-banco">
                                {{ slotProps.data?.banco?.clabe_banco || slotProps.data?.clabe_banco || '-' }}
                            </span>

                            <span>
                                {{ slotProps.data?.banco?.descripcion || '-' }}
                            </span>
                        </div>
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- CUENTA -->
                <!-- ============================================= -->

                <Column header="Cuenta" headerClass="encabezado-columna" style="min-width: 140px">
                    <template #body="slotProps">
                        <div class="celda-cuenta">
                            <strong>
                                {{ slotProps.data?.cuenta_banco || '-' }}
                            </strong>

                            <small>
                                {{ handleCuentaEnmascarada(slotProps.data?.clabe_cuenta) }}
                            </small>
                        </div>
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- ARCHIVO -->
                <!-- ============================================= -->

                <Column field="archivo.nombre_original" header="Archivo" headerClass="encabezado-columna" style="min-width: 250px">
                    <template #body="slotProps">
                        <div class="celda-archivo">
                            <div class="archivo-icono">
                                <font-icon icon="fa-solid fa-file-excel" />
                            </div>

                            <div>
                                <strong>
                                    {{ slotProps.data?.archivo?.nombre_original || '-' }}
                                </strong>

                                <small>
                                    {{ slotProps.data?.archivo?.tipo_real || '' }}
                                </small>
                            </div>
                        </div>
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- LAYOUT -->
                <!-- ============================================= -->

                <Column field="layout.nombre" header="Layout" headerClass="encabezado-columna" style="min-width: 180px" />

                <!-- ============================================= -->
                <!-- AÑO -->
                <!-- ============================================= -->

                <Column field="archivo.anio" header="Año" headerClass="encabezado-columna" style="min-width: 70px" />

                <!-- ============================================= -->
                <!-- MOVIMIENTOS -->
                <!-- ============================================= -->

                <Column field="total_movimientos_archivo" header="Movimientos" headerClass="encabezado-columna" style="min-width: 95px">
                    <template #body="slotProps">
                        <span class="numero-movimientos">
                            {{ slotProps.data?.total_movimientos_archivo ?? 0 }}
                        </span>
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- NUEVOS -->
                <!-- ============================================= -->

                <Column field="movimientos_insertados" header="Nuevos" headerClass="encabezado-columna" style="min-width: 80px">
                    <template #body="slotProps">
                        <span class="badge-nuevos">
                            {{ slotProps.data?.movimientos_insertados ?? 0 }}
                        </span>
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- DUPLICADOS -->
                <!-- ============================================= -->

                <Column field="movimientos_duplicados" header="Duplicados" headerClass="encabezado-columna" style="min-width: 90px">
                    <template #body="slotProps">
                        <span
                            :class="[
                                'badge-duplicados',
                                {
                                    'badge-duplicados-activo': Number(slotProps.data?.movimientos_duplicados ?? 0) > 0
                                }
                            ]"
                        >
                            {{ slotProps.data?.movimientos_duplicados ?? 0 }}
                        </span>
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- SALDO FINAL -->
                <!-- ============================================= -->

                <Column header="Saldo Final" headerClass="encabezado-columna" style="min-width: 120px">
                    <template #body="slotProps">
                        <strong>
                            {{ handleFormatoMoneda(slotProps.data?.resumen?.saldo_final) }}
                        </strong>
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- FECHA CARGA -->
                <!-- ============================================= -->

                <Column field="fecha_carga" header="Fecha Carga" headerClass="encabezado-columna" style="min-width: 150px">
                    <template #body="slotProps">
                        {{ handleFormatoFechaHora(slotProps.data?.fecha_carga) }}
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- OPCIONES -->
                <!-- ============================================= -->

                <Column header="Opciones" headerClass="encabezado-columna" style="width: 85px" frozen alignFrozen="right">
                    <template #body="slotProps">
                        <div class="acciones-tabla">
                            <Button
                                type="button"
                                icon="pi pi-trash"
                                class="btn-eliminar-carga"
                                :loading="eliminando && cargaEliminandoId === slotProps.data._id"
                                :disabled="eliminando && cargaEliminandoId !== slotProps.data._id"
                                v-tooltip.top="'Eliminar / Revertir carga'"
                                @click="handleEliminarCarga(slotProps.data)"
                            />
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
    name: 'HistorialCargasEstadoCuenta',

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
