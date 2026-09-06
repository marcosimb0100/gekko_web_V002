<template>
    <Encabezado titulo="Consultas SAT" subtitulo="Seguimiento de solicitudes, descargas y procesamiento de CFDI" icono="pi pi-cloud-download">
        <Button type="button" label="Verificar SAT" class="btn-nuevo btn-consulta" :loading="cargandoVerificacion" @click="handleVerificarConsultas">
            <template #icon>
                <font-icon icon="fa-solid fa-rotate" class="mr-2" />
            </template>
        </Button>

        <Button type="button" label="Descargar" class="btn-guardar btn-consulta" :loading="cargandoDescarga" @click="handleDescargarConsultas">
            <template #icon>
                <font-icon icon="fa-solid fa-cloud-arrow-down" class="mr-2" />
            </template>
        </Button>

        <Button type="button" label="Procesar CFDI" class="btn-procesar btn-consulta" :loading="cargandoProceso" @click="handleProcesarConsultas">
            <template #icon>
                <font-icon icon="fa-solid fa-gears" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <div class="contenedor-consultas">
        <!-- =====================================================
             FILTROS
        ====================================================== -->

        <div class="panel-filtros">
            <form class="filtros-consultas" @submit.prevent="handleConsultar">
                <div class="campo-filtro campo-empresa">
                    <label>Empresa</label>

                    <Dropdown v-model="empresaFiltro" :options="empresas" optionLabel="nombre" optionValue="rfc" placeholder="Seleccione una empresa" filter class="w-full" />
                </div>

                <div class="campo-filtro">
                    <label>Fecha inicial</label>

                    <DatePicker v-model="fechaInicial" dateFormat="yy-mm-dd" showIcon class="w-full" :maxDate="fechaFinal" />
                </div>

                <div class="campo-filtro">
                    <label>Fecha final</label>

                    <DatePicker v-model="fechaFinal" dateFormat="yy-mm-dd" showIcon class="w-full" :minDate="fechaInicial" :maxDate="hoy" />
                </div>

                <div class="campo-boton">
                    <Button type="submit" label="Consultar" class="btn-nuevo" :disabled="botonConsultarDeshabilitado">
                        <template #icon>
                            <font-icon icon="fa-solid fa-magnifying-glass" class="mr-2" />
                        </template>
                    </Button>
                </div>
            </form>
        </div>

        <!-- =====================================================
             RESUMEN
        ====================================================== -->

        <div class="resumen-consultas">
            <div class="resumen-card">
                <div class="resumen-icono">
                    <i class="pi pi-database"></i>
                </div>

                <div>
                    <span>Consultas</span>
                    <strong>
                        {{ resumen.total }}
                    </strong>
                </div>
            </div>

            <div class="resumen-card resumen-proceso">
                <div class="resumen-icono">
                    <i class="pi pi-spin pi-spinner"></i>
                </div>

                <div>
                    <span>En proceso</span>
                    <strong>
                        {{ resumen.proceso }}
                    </strong>
                </div>
            </div>

            <div class="resumen-card resumen-descargadas">
                <div class="resumen-icono">
                    <i class="pi pi-cloud-download"></i>
                </div>

                <div>
                    <span>Descargadas</span>
                    <strong>
                        {{ resumen.descargadas }}
                    </strong>
                </div>
            </div>

            <div class="resumen-card resumen-procesadas">
                <div class="resumen-icono">
                    <i class="pi pi-check-circle"></i>
                </div>

                <div>
                    <span>Procesadas</span>
                    <strong>
                        {{ resumen.procesadas }}
                    </strong>
                </div>
            </div>

            <div class="resumen-card resumen-error">
                <div class="resumen-icono">
                    <i class="pi pi-exclamation-triangle"></i>
                </div>

                <div>
                    <span>Con error</span>
                    <strong>
                        {{ resumen.errores }}
                    </strong>
                </div>
            </div>
        </div>

        <!-- =====================================================
             TABLA
        ====================================================== -->

        <div class="panel-tabla">
            <div class="cabecera-tabla">
                <div>
                    <h3>Historial SAT</h3>

                    <span>
                        {{ tablaConsultasFiltradas.length }}
                        registros encontrados
                    </span>
                </div>

                <div class="acciones-tabla">
                    <Button type="button" icon="pi pi-refresh" label="Actualizar" outlined @click="handleCargarConsultas" />

                    <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined @click="handleLimpiarFiltro" />

                    <IconField iconPosition="left">
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>

                        <InputText v-model="filtros.global.value" placeholder="Buscar consulta..." class="buscador-tabla" />
                    </IconField>
                </div>
            </div>

            <DataTable
                v-model:filters="filtros"
                :value="tablaConsultasFiltradas"
                :globalFilterFields="['razon_social_nombre_completo', 'rfc', 'tipo_descarga', 'estatus_aplicacion', 'estatus_sat_mensaje', 'id_respuesta_sat']"
                paginator
                :rows="100"
                :rowsPerPageOptions="[100, 250, 500, 700]"
                scrollable
                scrollHeight="48vh"
                size="small"
                stripedRows
                tableStyle="min-width: 110rem"
                class="tabla-encabezados tabla-consultas"
            >
                <template #empty>
                    <div class="tabla-vacia">
                        <i class="pi pi-cloud"></i>

                        <strong> No se encontraron consultas SAT </strong>

                        <span> Cambia los filtros o actualiza la información. </span>
                    </div>
                </template>

                <!-- EMPRESA -->

                <Column header="Empresa" headerClass="encabezado-columna" frozen style="min-width: 190px">
                    <template #body="slotProps">
                        <div class="empresa-tabla">
                            <strong>
                                {{ slotProps.data.razon_social_nombre_completo || '-' }}
                            </strong>

                            <small>
                                {{ slotProps.data.rfc }}
                            </small>
                        </div>
                    </template>
                </Column>

                <!-- TIPO -->

                <Column field="tipo_descarga" header="Tipo" headerClass="encabezado-columna" style="min-width: 150px">
                    <template #body="slotProps">
                        <span class="tipo-descarga" :class="handleClaseTipoDescarga(slotProps.data)">
                            {{ slotProps.data.tipo_descarga || '-' }}
                        </span>
                    </template>
                </Column>

                <!-- PERIODO -->

                <Column header="Periodo solicitado" headerClass="encabezado-columna" style="min-width: 180px">
                    <template #body="slotProps">
                        <div class="periodo-tabla">
                            <span>
                                <i class="pi pi-calendar"></i>

                                {{ slotProps.data.inicio_fecha_sat || '-' }}
                            </span>

                            <span>
                                <i class="pi pi-arrow-right"></i>

                                {{ slotProps.data.fin_fecha_sat || '-' }}
                            </span>
                        </div>
                    </template>
                </Column>

                <!-- FECHA SOLICITUD -->

                <Column field="fecha_aplicacion" header="Solicitud" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 150px" />

                <!-- ID SAT -->

                <Column field="id_respuesta_sat" header="ID SAT" headerClass="encabezado-columna" style="min-width: 230px">
                    <template #body="slotProps">
                        <span class="id-sat" :title="slotProps.data.id_respuesta_sat">
                            {{ slotProps.data.id_respuesta_sat || '-' }}
                        </span>
                    </template>
                </Column>

                <!-- CFDI -->

                <Column field="numero_cfdis" header="CFDI" headerClass="encabezado-columna" style="min-width: 80px">
                    <template #body="slotProps">
                        <strong class="numero-cfdi">
                            {{ slotProps.data.numero_cfdis ?? 0 }}
                        </strong>
                    </template>
                </Column>

                <!-- PAQUETES -->

                <Column header="Paquetes" headerClass="encabezado-columna" style="min-width: 90px">
                    <template #body="slotProps">
                        <span class="contador-paquetes">
                            {{ handleNumeroPaquetes(slotProps.data) }}
                        </span>
                    </template>
                </Column>

                <!-- ESTATUS -->

                <Column field="estatus_aplicacion" header="Estatus" headerClass="encabezado-columna" style="min-width: 150px">
                    <template #body="slotProps">
                        <span class="estatus-sat" :class="handleClaseEstatus(slotProps.data)">
                            <i :class="handleIconoEstatus(slotProps.data)"></i>

                            {{ slotProps.data.estatus_aplicacion || '-' }}
                        </span>
                    </template>
                </Column>

                <!-- MENSAJE -->

                <Column field="estatus_sat_mensaje" header="Respuesta SAT" headerClass="encabezado-columna" style="min-width: 300px">
                    <template #body="slotProps">
                        <span class="mensaje-sat" :title="slotProps.data.estatus_sat_mensaje">
                            {{ slotProps.data.estatus_sat_mensaje || '-' }}
                        </span>
                    </template>
                </Column>

                <!-- INTENTOS -->

                <Column field="intentos" header="Intentos" headerClass="encabezado-columna" style="min-width: 80px">
                    <template #body="slotProps">
                        {{ slotProps.data.intentos ?? 0 }}
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'ConsultasSat',

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
