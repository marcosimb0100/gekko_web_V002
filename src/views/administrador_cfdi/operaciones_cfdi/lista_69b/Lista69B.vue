<template>
    <Encabezado titulo="Lista SAT 69-B" subtitulo="Consulta y actualización del listado de contribuyentes publicado por el SAT" icono="pi pi-list">
        <Button type="button" label="Actualizar SAT" class="btn-nuevo" :loading="sincronizando" :disabled="sincronizando" @click="handleConfirmarSincronizacion">
            <template #icon>
                <font-icon icon="fa-solid fa-cloud-arrow-down" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <div class="contenedor-lista-69b">
        <!-- =====================================================
             RESUMEN
        ====================================================== -->

        <div class="resumen-lista">
            <!-- TOTAL -->

            <div class="resumen-card">
                <div class="resumen-icono">
                    <i class="pi pi-database"></i>
                </div>

                <div>
                    <span>Registros en base</span>

                    <strong>
                        {{ handleNumero(totalRegistros) }}
                    </strong>
                </div>
            </div>

            <!-- PRESUNTOS -->

            <div class="resumen-card resumen-presunto">
                <div class="resumen-icono">
                    <i class="pi pi-exclamation-circle"></i>
                </div>

                <div>
                    <span>Presuntos</span>

                    <strong>
                        {{ handleNumero(resumen.presuntos) }}
                    </strong>
                </div>
            </div>

            <!-- DEFINITIVOS -->

            <div class="resumen-card resumen-definitivo">
                <div class="resumen-icono">
                    <i class="pi pi-times-circle"></i>
                </div>

                <div>
                    <span>Definitivos</span>

                    <strong>
                        {{ handleNumero(resumen.definitivos) }}
                    </strong>
                </div>
            </div>

            <!-- DESVIRTUADOS -->

            <div class="resumen-card resumen-desvirtuado">
                <div class="resumen-icono">
                    <i class="pi pi-check-circle"></i>
                </div>

                <div>
                    <span>Desvirtuados</span>

                    <strong>
                        {{ handleNumero(resumen.desvirtuados) }}
                    </strong>
                </div>
            </div>

            <!-- SENTENCIA FAVORABLE -->

            <div class="resumen-card resumen-sentencia">
                <div class="resumen-icono">
                    <i class="pi pi-verified"></i>
                </div>

                <div>
                    <span>Sentencia favorable</span>

                    <strong>
                        {{ handleNumero(resumen.sentenciasFavorables) }}
                    </strong>
                </div>
            </div>
        </div>

        <!-- =====================================================
             INFORMACION DE ACTUALIZACION
        ====================================================== -->

        <div class="panel-informacion">
            <div class="informacion-item">
                <div class="informacion-icono">
                    <i class="pi pi-calendar"></i>
                </div>

                <div>
                    <span> Información SAT </span>

                    <strong>
                        {{ ultimaSincronizacion?.fecha_informacion_sat || 'Sin información' }}
                    </strong>
                </div>
            </div>

            <div class="informacion-item">
                <div class="informacion-icono">
                    <i class="pi pi-clock"></i>
                </div>

                <div>
                    <span> Última actualización </span>

                    <strong>
                        {{ handleFecha(ultimaSincronizacion?.fecha) }}
                    </strong>
                </div>
            </div>

            <div class="informacion-item">
                <div class="informacion-icono">
                    <i class="pi pi-cloud-download"></i>
                </div>

                <div>
                    <span> Fuente </span>

                    <strong> SAT - Artículo 69-B </strong>
                </div>
            </div>
        </div>

        <!-- =====================================================
             TABLA
        ====================================================== -->

        <div class="panel-tabla">
            <!-- CABECERA -->

            <div class="cabecera-tabla">
                <div>
                    <h3>Contribuyentes SAT 69-B</h3>

                    <span>
                        {{ handleNumero(totalRegistros) }}
                        registros encontrados
                    </span>
                </div>

                <div class="acciones-tabla">
                    <!-- SITUACION -->

                    <Dropdown v-model="situacionSeleccionada" :options="situaciones" optionLabel="nombre" optionValue="valor" placeholder="Situación" showClear class="filtro-situacion" @change="handleCambiarSituacion" />

                    <!-- ACTUALIZAR TABLA -->

                    <Button type="button" icon="pi pi-refresh" label="Actualizar" outlined :loading="cargando" @click="handleConsultar" />

                    <!-- LIMPIAR -->

                    <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined @click="handleLimpiarFiltros" />

                    <!-- BUSCADOR -->

                    <IconField iconPosition="left">
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>

                        <InputText v-model="busqueda" placeholder="Buscar RFC o razón social..." class="buscador-tabla" @input="handleBuscar" />
                    </IconField>
                </div>
            </div>

            <!-- TABLA -->

            <DataTable
                :value="registros"
                lazy
                paginator
                :first="first"
                :rows="filas"
                :totalRecords="totalRegistros"
                :rowsPerPageOptions="[20, 50, 100]"
                dataKey="rfc"
                scrollable
                scrollHeight="52vh"
                size="small"
                stripedRows
                :loading="cargando"
                tableStyle="min-width: 90rem"
                class="tabla-encabezados tabla-lista-69b"
                @page="handlePagina"
            >
                <!-- VACIO -->

                <template #empty>
                    <div class="tabla-vacia">
                        <i class="pi pi-database"></i>

                        <strong> No se encontraron registros </strong>

                        <span> Actualiza el listado del SAT o modifica los filtros. </span>
                    </div>
                </template>

                <!-- NUMERO -->

                <Column field="numero" header="No." headerClass="encabezado-columna" style="width: 75px" />

                <!-- RFC -->

                <Column field="rfc" header="RFC" headerClass="encabezado-columna" frozen style="min-width: 150px">
                    <template #body="slotProps">
                        <strong class="rfc-tabla">
                            {{ slotProps.data.rfc || '-' }}
                        </strong>
                    </template>
                </Column>

                <!-- NOMBRE -->

                <Column field="nombre_contribuyente" header="Razón Social / Nombre" headerClass="encabezado-columna" style="min-width: 360px">
                    <template #body="slotProps">
                        <span class="nombre-contribuyente" :title="slotProps.data.nombre_contribuyente">
                            {{ slotProps.data.nombre_contribuyente || '-' }}
                        </span>
                    </template>
                </Column>

                <!-- SITUACION -->

                <Column field="situacion" header="Situación" headerClass="encabezado-columna" style="min-width: 170px">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.situacion || '-'" :severity="handleSeveridad(slotProps.data.situacion)" />
                    </template>
                </Column>

                <!-- INFORMACION SAT -->

                <Column field="fecha_informacion_sat" header="Información SAT" headerClass="encabezado-columna" style="min-width: 180px">
                    <template #body="slotProps">
                        {{ slotProps.data.fecha_informacion_sat || '-' }}
                    </template>
                </Column>

                <!-- FECHA SINCRONIZACION -->

                <Column field="fecha_sincronizacion" header="Fecha actualización" headerClass="encabezado-columna" style="min-width: 175px">
                    <template #body="slotProps">
                        {{ handleFecha(slotProps.data.fecha_sincronizacion) }}
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<script>
import Encabezado from '@/components/encabezado/Encabezado.vue';

import useProceso from './js/proceso.js';

export default {
    name: 'Lista69B',

    components: {
        Encabezado
    },

    setup() {
        return {
            ...useProceso()
        };
    }
};
</script>

<style scoped>
@import './css/estilo.css';
</style>
