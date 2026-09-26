<template>
    <Encabezado titulo="Portal SAT" subtitulo="Acceso y consulta directa de CFDI mediante e.firma" icono="pi pi-cloud-download" />

    <div class="card p-0 m-0 sat-portal-contenedor">
        <ScrollPanel style="height: 65vh">
            <div class="form-sat-portal">
                <div class="sat-card">
                    <!-- =========================================
                         TITULO
                    ========================================== -->

                    <div class="sat-titulo">
                        <div class="sat-icono">
                            <font-icon icon="fa-solid fa-cloud-arrow-down" />
                        </div>

                        <div class="sat-titulo-texto">
                            <span> Conexión con Portal SAT </span>

                            <small> Valida tu e.firma antes de iniciar una sesión con el portal CFDI. </small>
                        </div>
                    </div>

                    <!-- =========================================
                         INFORMACION
                    ========================================== -->

                    <div class="informacion-sat">
                        <div class="informacion-sat-icono">
                            <i class="pi pi-info-circle"></i>
                        </div>

                        <div>
                            <strong> Archivos requeridos </strong>

                            <span> Selecciona el certificado CER, la llave privada KEY y escribe la contraseña correspondiente. </span>
                        </div>
                    </div>

                    <!-- =========================================
                         CER
                    ========================================== -->

                    <div class="campo-formulario">
                        <label> Certificado (.cer) </label>

                        <FileUpload mode="basic" accept=".cer" chooseLabel="Seleccionar CER" customUpload :auto="false" @select="handleSeleccionarCer" />

                        <small v-if="archivoCer" class="archivo-seleccionado">
                            <i class="pi pi-check-circle"></i>

                            {{ archivoCer.name }}
                        </small>
                    </div>

                    <!-- =========================================
                         KEY
                    ========================================== -->

                    <div class="campo-formulario">
                        <label> Clave privada (.key) </label>

                        <FileUpload mode="basic" accept=".key" chooseLabel="Seleccionar KEY" customUpload :auto="false" @select="handleSeleccionarKey" />

                        <small v-if="archivoKey" class="archivo-seleccionado">
                            <i class="pi pi-check-circle"></i>

                            {{ archivoKey.name }}
                        </small>
                    </div>

                    <!-- =========================================
                         PASSWORD
                    ========================================== -->

                    <div class="campo-formulario">
                        <label for="passwordSat"> Contraseña de clave privada </label>

                        <Password id="passwordSat" v-model="password" :feedback="false" toggleMask class="w-full" inputClass="w-full" placeholder="Ingresa la contraseña" />
                    </div>

                    <!-- =========================================
                         RESULTADO VALIDACION
                    ========================================== -->

                    <div v-if="efirmaValidada" class="resultado-validacion">
                        <div class="resultado-header">
                            <div class="resultado-icono">
                                <i class="pi pi-check-circle"></i>
                            </div>

                            <div>
                                <strong> e.firma validada </strong>

                                <span> El certificado y la llave privada corresponden. </span>
                            </div>
                        </div>

                        <div class="resultado-grid">
                            <div class="resultado-item">
                                <span>RFC</span>

                                <strong>
                                    {{ datosEfirma.rfc || '-' }}
                                </strong>
                            </div>

                            <div class="resultado-item">
                                <span>Vigencia inicio</span>

                                <strong>
                                    {{ handleFecha(datosEfirma.vigencia_inicio) }}
                                </strong>
                            </div>

                            <div class="resultado-item">
                                <span>Vigencia fin</span>

                                <strong>
                                    {{ handleFecha(datosEfirma.vigencia_fin) }}
                                </strong>
                            </div>

                            <div class="resultado-item">
                                <span>Certificado</span>

                                <strong class="estatus-ok"> Válido </strong>
                            </div>

                            <div class="resultado-item">
                                <span>Llave privada</span>

                                <strong class="estatus-ok"> Válida </strong>
                            </div>

                            <div class="resultado-item">
                                <span>Coincidencia</span>

                                <strong class="estatus-ok"> CER / KEY correctos </strong>
                            </div>
                        </div>
                    </div>

                    <!-- =========================================
                         SESION
                    ========================================== -->

                    <div v-if="sesionSat" class="resultado-sesion">
                        <i class="pi pi-wifi"></i>

                        <div>
                            <strong> Sesión SAT activa </strong>

                            <span>
                                RFC autenticado:
                                {{ sesionSat.rfc || datosEfirma.rfc }}
                            </span>
                        </div>
                    </div>

                    <!-- =========================================
                         BOTONES
                    ========================================== -->

                    <div class="acciones-formulario">
                        <Button type="button" label="Limpiar" class="btn-cancelar" :disabled="procesando" @click="handleLimpiar">
                            <template #icon>
                                <font-icon icon="fa-solid fa-eraser" class="mr-2" />
                            </template>
                        </Button>

                        <Button type="button" label="Validar e.firma" class="btn-guardar" :loading="validando" :disabled="botonValidarDeshabilitado" @click="handleValidarEfirma">
                            <template #icon>
                                <font-icon icon="fa-solid fa-certificate" class="mr-2" />
                            </template>
                        </Button>

                        <Button type="button" label="Conectar SAT" class="btn-nuevo" :loading="conectando" :disabled="!efirmaValidada || conectando" @click="handleIniciarSesion">
                            <template #icon>
                                <font-icon icon="fa-solid fa-cloud-arrow-down" class="mr-2" />
                            </template>
                        </Button>
                    </div>
                </div>
            </div>
        </ScrollPanel>
    </div>
</template>

<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'SatPortal',

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
