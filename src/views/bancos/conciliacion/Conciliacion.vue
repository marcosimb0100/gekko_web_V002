<template>
    <!-- ========================================================= -->
    <!-- ENCABEZADO -->
    <!-- ========================================================= -->

    <Encabezado titulo="Exportar Conciliación" subtitulo="Generación consolidada de movimientos bancarios por empresa y cuenta" icono="pi pi-file-excel" />

    <!-- ========================================================= -->
    <!-- CONTENIDO -->
    <!-- ========================================================= -->

    <div class="card card-conciliacion">
        <!-- ===================================================== -->
        <!-- PANEL SUPERIOR -->
        <!-- ===================================================== -->

        <div class="panel-conciliacion">
            <div class="encabezado-panel">
                <div class="icono-panel">
                    <font-icon icon="fa-solid fa-scale-balanced" />
                </div>

                <div>
                    <div class="titulo-panel">Conciliación Bancaria</div>

                    <div class="subtitulo-panel">Selecciona el periodo y las empresas que deseas incluir en el archivo.</div>
                </div>
            </div>

            <div class="separador"></div>

            <!-- ================================================= -->
            <!-- FECHAS -->
            <!-- ================================================= -->

            <div class="grid-filtros">
                <!-- ============================================= -->
                <!-- FECHA INICIAL -->
                <!-- ============================================= -->

                <div class="campo-filtro">
                    <label> Fecha Inicial </label>

                    <Calendar v-model="fechaInicial" dateFormat="yy-mm-dd" showIcon :maxDate="fechaActual" :disabled="exportando" class="w-full" />
                </div>

                <!-- ============================================= -->
                <!-- FECHA FINAL -->
                <!-- ============================================= -->

                <div class="campo-filtro">
                    <label> Fecha Final </label>

                    <Calendar v-model="fechaFinal" dateFormat="yy-mm-dd" showIcon :maxDate="fechaActual" :disabled="exportando" class="w-full" />
                </div>

                <!-- ============================================= -->
                <!-- ACCIONES -->
                <!-- ============================================= -->

                <div class="acciones-filtros">
                    <Button type="button" label="Restablecer" class="btn-limpiar" :disabled="exportando" @click="handleRestablecer">
                        <template #icon>
                            <font-icon icon="fa-solid fa-eraser" class="mr-2" />
                        </template>
                    </Button>

                    <Button type="button" label="Exportar Excel" class="btn-exportar-principal" :loading="exportando" :disabled="empresasSeleccionadas.length === 0" @click="handleExportar">
                        <template #icon>
                            <font-icon icon="fa-solid fa-file-excel" class="mr-2" />
                        </template>
                    </Button>
                </div>
            </div>
        </div>

        <!-- ===================================================== -->
        <!-- RESUMEN -->
        <!-- ===================================================== -->

        <div class="grid-resumen">
            <!-- ================================================= -->
            <!-- EMPRESAS -->
            <!-- ================================================= -->

            <div class="tarjeta-resumen">
                <div class="tarjeta-icono">
                    <font-icon icon="fa-solid fa-building" />
                </div>

                <div>
                    <span> Empresas </span>

                    <strong>
                        {{ empresasSeleccionadas.length }}
                    </strong>
                </div>
            </div>

            <!-- ================================================= -->
            <!-- CUENTAS -->
            <!-- ================================================= -->

            <div class="tarjeta-resumen">
                <div class="tarjeta-icono">
                    <font-icon icon="fa-solid fa-building-columns" />
                </div>

                <div>
                    <span> Cuentas / Hojas </span>

                    <strong>
                        {{ totalCuentasSeleccionadas }}
                    </strong>
                </div>
            </div>

            <!-- ================================================= -->
            <!-- ARCHIVO -->
            <!-- ================================================= -->

            <div class="tarjeta-resumen">
                <div class="tarjeta-icono">
                    <font-icon icon="fa-solid fa-file-excel" />
                </div>

                <div>
                    <span> Archivo </span>

                    <strong class="texto-archivo"> 1 Excel consolidado </strong>
                </div>
            </div>
        </div>

        <!-- ===================================================== -->
        <!-- EMPRESAS -->
        <!-- ===================================================== -->

        <div class="panel-empresas">
            <!-- ================================================= -->
            <!-- TITULO -->
            <!-- ================================================= -->

            <div class="encabezado-listado">
                <div>
                    <h3>Empresas a Exportar</h3>

                    <small> Solo aparecen empresas con cuentas activas que tienen nombre de hoja Excel configurado. </small>
                </div>

                <div class="contador">
                    {{ empresasSeleccionadas.length }}

                    de

                    {{ empresas.length }}

                    empresa(s)
                </div>
            </div>

            <!-- ================================================= -->
            <!-- BUSCADOR / TODAS -->
            <!-- ================================================= -->

            <div class="barra-empresas">
                <!-- ============================================= -->
                <!-- SELECCIONAR TODAS -->
                <!-- ============================================= -->

                <div class="seleccionar-todas">
                    <Checkbox inputId="seleccionar_todas" :modelValue="todasSeleccionadas" binary :disabled="exportando" @update:modelValue="handleSeleccionarTodas" />

                    <label for="seleccionar_todas" class="ml-2 cursor-pointer"> Seleccionar todas </label>
                </div>

                <!-- ============================================= -->
                <!-- BUSQUEDA -->
                <!-- ============================================= -->

                <IconField iconPosition="left" class="campo-busqueda">
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>

                    <InputText v-model="buscar" placeholder="Buscar empresa, RFC, banco, cuenta o nombre de hoja..." :disabled="exportando" />
                </IconField>

                <!-- ============================================= -->
                <!-- LIMPIAR BUSQUEDA -->
                <!-- ============================================= -->

                <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined :disabled="exportando" @click="handleLimpiarBusqueda" />
            </div>

            <!-- ================================================= -->
            <!-- LOADING -->
            <!-- ================================================= -->

            <div v-if="cargando" class="estado-listado">
                <i class="pi pi-spin pi-spinner"></i>

                Consultando empresas...
            </div>

            <!-- ================================================= -->
            <!-- VACIO -->
            <!-- ================================================= -->

            <div v-else-if="empresasFiltradas.length === 0" class="estado-listado">No se encontraron empresas disponibles para conciliación.</div>

            <!-- ================================================= -->
            <!-- LISTADO -->
            <!-- ================================================= -->

            <div v-else class="lista-empresas">
                <div
                    v-for="empresa in empresasFiltradas"
                    :key="empresa._id"
                    class="empresa-item"
                    :class="{
                        'empresa-seleccionada': handleEmpresaSeleccionada(empresa)
                    }"
                >
                    <!-- ========================================== -->
                    <!-- CABECERA EMPRESA -->
                    <!-- ========================================== -->

                    <div class="empresa-cabecera">
                        <!-- ====================================== -->
                        <!-- CHECK -->
                        <!-- ====================================== -->

                        <div class="empresa-check">
                            <Checkbox :inputId="`empresa_${empresa._id}`" :modelValue="handleEmpresaSeleccionada(empresa)" binary :disabled="exportando" @update:modelValue="handleCambiarEmpresa(empresa)" />
                        </div>

                        <!-- ====================================== -->
                        <!-- DATOS EMPRESA -->
                        <!-- ====================================== -->

                        <label class="empresa-datos" :for="`empresa_${empresa._id}`">
                            <strong>
                                {{ empresa.razon_social }}
                            </strong>

                            <small>
                                RFC:

                                {{ empresa.rfc || 'Sin RFC' }}
                            </small>
                        </label>

                        <!-- ====================================== -->
                        <!-- TOTAL CUENTAS -->
                        <!-- ====================================== -->

                        <div class="empresa-cuentas-contador">
                            {{ empresa.total_cuentas }}

                            cuenta(s)
                        </div>
                    </div>

                    <!-- ========================================== -->
                    <!-- CUENTAS -->
                    <!-- ========================================== -->

                    <div class="cuentas-grid">
                        <div v-for="cuenta in empresa.cuentas" :key="cuenta._id" class="cuenta-item">
                            <!-- ================================== -->
                            <!-- ICONO -->
                            <!-- ================================== -->

                            <div class="cuenta-icono">
                                <font-icon icon="fa-solid fa-building-columns" />
                            </div>

                            <!-- ================================== -->
                            <!-- DATOS -->
                            <!-- ================================== -->

                            <div class="cuenta-datos">
                                <div class="cuenta-banco">
                                    {{ cuenta.clave_banco }}

                                    -

                                    {{ cuenta.banco }}
                                </div>

                                <div class="cuenta-numero">
                                    Cuenta:

                                    {{ cuenta.cuenta_banco || 'Sin cuenta' }}
                                </div>

                                <div class="cuenta-hoja">
                                    <font-icon icon="fa-solid fa-file-excel" />

                                    <span>
                                        {{ cuenta.nombre_hoja }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';

import proceso from './js/proceso.js';

export default {
    name: 'ConciliacionBancaria',

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
