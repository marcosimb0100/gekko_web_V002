<template>
    <Encabezado titulo="Solicitud SAT" subtitulo="Generación de solicitudes de descarga CFDI" icono="pi pi-cloud-upload" />

    <div class="card p-0 m-0" style="height: 72vh">
        <ScrollPanel style="height: 65vh">
            <form id="formSolicitudSat" @submit.prevent="handleSolicitar" class="form-solicitud-sat">
                <div class="solicitud-card">
                    <div class="solicitud-titulo">
                        <font-icon icon="fa-solid fa-file-lines" />
                        <span>Solicitudes CFDI</span>
                    </div>

                    <!-- EMPRESA -->
                    <div class="campo-formulario">
                        <label for="empresa"> Empresa: </label>

                        <Dropdown
                            id="empresa"
                            v-model="frmSolicitudSat.empresa"
                            :options="catCompaniasSat"
                            optionLabel="razon_social_nombre_completo"
                            optionValue="_id"
                            placeholder="Seleccione una opción"
                            filter
                            class="w-full"
                            :invalid="!empresaValida"
                        />
                    </div>

                    <!-- TIPO -->
                    <div class="campo-formulario">
                        <label for="tipo"> Tipo: </label>

                        <Dropdown id="tipo" v-model="frmSolicitudSat.tipo" :options="tipos" optionLabel="descripcion" optionValue="id" placeholder="Todos" class="w-full" />
                    </div>

                    <!-- FECHA INICIAL -->
                    <div class="campo-formulario">
                        <label for="fecha_inicial"> Fecha Inicial: </label>

                        <DatePicker
                            id="fecha_inicial"
                            v-model="frmSolicitudSat.fecha_inicial"
                            showTime
                            hourFormat="24"
                            dateFormat="yy-mm-dd"
                            showIcon
                            class="w-full"
                            :maxDate="fechaActual"
                            :invalid="!fechaInicialValida"
                            @date-select="handleValidarFechaInicial"
                        />
                    </div>

                    <!-- FECHA FINAL -->
                    <div class="campo-formulario">
                        <label for="fecha_final"> Fecha Final: </label>

                        <DatePicker
                            id="fecha_final"
                            v-model="frmSolicitudSat.fecha_final"
                            showTime
                            hourFormat="24"
                            dateFormat="yy-mm-dd"
                            showIcon
                            class="w-full"
                            :maxDate="fechaActual"
                            :minDate="frmSolicitudSat.fecha_inicial"
                            :invalid="!fechaFinalValida"
                            @date-select="handleValidarFechaFinal"
                        />
                    </div>

                    <!-- BOTONES -->
                    <div class="acciones-formulario">
                        <Button type="button" label="Cancelar" class="btn-cancelar" @click="handleCancelar">
                            <template #icon>
                                <font-icon icon="fa-solid fa-xmark" class="mr-2" />
                            </template>
                        </Button>

                        <Button type="submit" label="Solicitar" class="btn-guardar" :disabled="botonSolicitarDeshabilitado">
                            <template #icon>
                                <font-icon icon="fa-solid fa-paper-plane" class="mr-2" />
                            </template>
                        </Button>
                    </div>
                </div>
            </form>
        </ScrollPanel>
    </div>
</template>

<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'SolicitudSat',

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
