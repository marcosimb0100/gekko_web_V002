<template>
    <Encabezado titulo="Solicitud SAT" subtitulo="Generación de solicitudes de descarga CFDI" icono="pi pi-cloud-upload" />

    <div class="card p-0 m-0 solicitud-sat-contenedor">
        <ScrollPanel style="height: 65vh">
            <form id="formSolicitudSat" class="form-solicitud-sat" @submit.prevent="handleSolicitar">
                <div class="solicitud-card">
                    <div class="solicitud-titulo">
                        <div class="solicitud-icono">
                            <font-icon icon="fa-solid fa-file-lines" />
                        </div>

                        <div class="solicitud-titulo-texto">
                            <span>Solicitud de descarga SAT</span>

                            <small> Selecciona la empresa, el tipo de descarga y el periodo a consultar. </small>
                        </div>
                    </div>

                    <!-- =====================================================
                         EMPRESA
                    ====================================================== -->

                    <div class="campo-formulario">
                        <label for="empresa"> Empresa </label>

                        <Dropdown
                            id="empresa"
                            v-model="frmSolicitudSat.empresa"
                            :options="catCompaniasSat"
                            optionLabel="razon_social_nombre_completo"
                            optionValue="_id"
                            placeholder="Seleccione una empresa"
                            filter
                            class="w-full"
                            :invalid="!empresaValida"
                        />

                        <small class="ayuda-campo"> Solo se muestran empresas con FIEL activa para descarga SAT. </small>
                    </div>

                    <!-- =====================================================
                         TIPO DESCARGA
                    ====================================================== -->

                    <div class="campo-formulario">
                        <label for="tipo"> Tipo de descarga </label>

                        <Dropdown id="tipo" v-model="frmSolicitudSat.tipo" :options="tipos" optionLabel="descripcion" optionValue="id" placeholder="Seleccione un tipo" class="w-full" />

                        <small class="ayuda-campo"> La solicitud también genera la Metadata correspondiente. </small>
                    </div>

                    <!-- =====================================================
                         INFORMACION DEL TIPO
                    ====================================================== -->

                    <div class="informacion-tipo">
                        <div class="informacion-tipo-icono">
                            <i class="pi pi-info-circle"></i>
                        </div>

                        <div>
                            <strong>
                                {{ descripcionTipoSeleccionado.titulo }}
                            </strong>

                            <span>
                                {{ descripcionTipoSeleccionado.descripcion }}
                            </span>
                        </div>
                    </div>

                    <!-- =====================================================
                         FECHAS
                    ====================================================== -->

                    <div class="fechas-grid">
                        <div class="campo-formulario">
                            <label for="fecha_inicial"> Fecha inicial </label>

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

                        <div class="campo-formulario">
                            <label for="fecha_final"> Fecha final </label>

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
                    </div>

                    <!-- =====================================================
                         RESUMEN
                    ====================================================== -->

                    <div class="resumen-solicitud">
                        <div class="resumen-item">
                            <span>Empresa</span>

                            <strong>
                                {{ nombreEmpresaSeleccionada }}
                            </strong>
                        </div>

                        <div class="resumen-item">
                            <span>Tipo</span>

                            <strong>
                                {{ nombreTipoSeleccionado }}
                            </strong>
                        </div>

                        <div class="resumen-item">
                            <span>Periodo</span>

                            <strong>
                                {{ periodoTexto }}
                            </strong>
                        </div>
                    </div>

                    <!-- =====================================================
                         BOTONES
                    ====================================================== -->

                    <div class="acciones-formulario">
                        <Button type="button" label="Cancelar" class="btn-cancelar" :disabled="solicitando" @click="handleCancelar">
                            <template #icon>
                                <font-icon icon="fa-solid fa-xmark" class="mr-2" />
                            </template>
                        </Button>

                        <Button type="submit" label="Solicitar" class="btn-guardar" :loading="solicitando" :disabled="botonSolicitarDeshabilitado || solicitando">
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
