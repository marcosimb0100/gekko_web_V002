<template>
    <Encabezado titulo="Empresas SAT" subtitulo="Empresas configuradas para descarga CFDI" icono="pi pi-building" />

    <div class="card p-0 m-0" style="height: 72vh">
        <ScrollPanel style="height: 65vh">
            <DataTable
                v-model:filters="filtros"
                :value="tablaCompaniasSat"
                :globalFilterFields="['razon_social_nombre_completo', 'rfc', 'fecha_vencimiento']"
                paginator
                :rows="100"
                :rowsPerPageOptions="[100, 125, 150, 200]"
                scrollable
                scrollHeight="54vh"
                size="small"
                tableStyle="min-width: 50rem"
                class="tabla-encabezados"
            >
                <template #header>
                    <div class="flex justify-content-between">
                        <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined style="margin-right: 5px" @click="handleLimpiarFiltro" />

                        <IconField iconPosition="left">
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>

                            <InputText v-model="filtros.global.value" placeholder="Buscar..." />
                        </IconField>
                    </div>
                </template>

                <template #empty> No se encontraron empresas SAT. </template>

                <Column field="razon_social_nombre_completo" header="Razón Social" headerClass="encabezado-columna" />

                <Column field="rfc" header="R.F.C." headerClass="encabezado-columna" bodyClass="nowrap" />

                <Column field="fecha_vencimiento" header="Fecha Vencimiento FIEL" headerClass="encabezado-columna" bodyClass="nowrap" />

                <Column header="Activo" headerClass="encabezado-columna" style="width: 100px">
                    <template #body="slotProps">
                        <span v-if="slotProps.data.activo === true" style="font-size: 15px; color: green">
                            <font-icon :icon="['fas', 'circle-check']" />
                        </span>

                        <span v-else style="font-size: 15px; color: red">
                            <font-icon :icon="['fas', 'circle-minus']" />
                        </span>
                    </template>
                </Column>
            </DataTable>
        </ScrollPanel>
    </div>
</template>

<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'EmpresasConsultar',

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
