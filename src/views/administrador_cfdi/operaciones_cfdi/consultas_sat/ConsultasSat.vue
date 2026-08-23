<template>
    <Encabezado titulo="Consultas SAT" subtitulo="Administración de consultas realizadas al SAT" icono="pi pi-cloud-download">
        <Button type="button" label="Verificar SAT" class="btn-nuevo btn-consulta" @click="handleVerificarConsultas">
            <template #icon>
                <font-icon icon="fa-solid fa-rotate" class="mr-2" />
            </template>
        </Button>

        <Button type="button" label="Descargar SAT" class="btn-guardar btn-consulta" @click="handleDescargarConsultas">
            <template #icon>
                <font-icon icon="fa-solid fa-cloud-arrow-down" class="mr-2" />
            </template>
        </Button>

        <Button type="button" label="Procesar CFDI" class="btn-procesar btn-consulta" @click="handleProcesarConsultas">
            <template #icon>
                <font-icon icon="fa-solid fa-gears" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <div class="card p-0 m-0" style="height: 72vh">
        <!-- FILTROS -->
        <form @submit.prevent="handleConsultar" class="filtros-consultas">
            <div class="campo-filtro">
                <label>Empresa:</label>

                <Dropdown v-model="empresaFiltro" :options="empresas" optionLabel="nombre" optionValue="rfc" placeholder="Seleccione una empresa" filter class="w-full" />
            </div>

            <div class="campo-filtro">
                <label>Fecha Inicial:</label>

                <DatePicker v-model="fechaInicial" dateFormat="yy-mm-dd" showIcon class="w-full" :maxDate="fechaFinal" />
            </div>

            <div class="campo-filtro">
                <label>Fecha Final:</label>

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

        <!-- BUSQUEDA -->
        <div class="barra-tabla">
            <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined @click="handleLimpiarFiltro" />

            <IconField iconPosition="left">
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>

                <InputText v-model="filtros.global.value" placeholder="Buscar..." style="width: 260px" />
            </IconField>
        </div>

        <!-- TABLA -->
        <DataTable
            v-model:filters="filtros"
            :value="tablaConsultasFiltradas"
            :globalFilterFields="['razon_social_nombre_completo', 'rfc', 'tipo_descarga', 'estatus_aplicacion', 'estatus_sat_mensaje']"
            paginator
            :rows="100"
            :rowsPerPageOptions="[100, 250, 500, 700]"
            scrollable
            scrollHeight="46vh"
            size="small"
            tableStyle="min-width: 90rem"
            class="tabla-encabezados tabla-consultas"
            style="font-size: 11px"
        >
            <template #empty> No se encontraron consultas SAT para los filtros seleccionados. </template>

            <Column field="rfc" header="RFC" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="tipo_descarga" header="Tipo Descarga" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="inicio_fecha_sat" header="Fecha Inicio" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="fin_fecha_sat" header="Fecha Fin" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="fecha_aplicacion" header="Fecha Consulta SAT" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="id_consulta_sat" header="ID Consulta SAT" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="numero_cfdis" header="Número CFDI" headerClass="encabezado-columna" bodyClass="nowrap" />

            <Column field="estatus_aplicacion" header="Estatus" headerClass="encabezado-columna" bodyClass="nowrap">
                <template #body="slotProps">
                    <span class="estatus-sat" :class="handleClaseEstatus(slotProps.data)">
                        {{ slotProps.data.estatus_aplicacion || '-' }}
                    </span>
                </template>
            </Column>

            <Column field="estatus_sat_mensaje" header="Mensaje SAT" headerClass="encabezado-columna" style="min-width: 240px" />
        </DataTable>
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
