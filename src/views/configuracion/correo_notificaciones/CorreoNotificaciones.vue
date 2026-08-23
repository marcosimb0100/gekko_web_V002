<template>
    <Encabezado titulo="Correo Notificaciones" subtitulo="Configuración del servidor de correo" icono="pi pi-envelope">
        <Button type="button" label="Probar Correo" class="btn-nuevo btn-probar-correo" style="white-space: nowrap" @click="handleProbar" :disabled="!correoPruebaValido">
            <template #icon><font-icon icon="fa-solid fa-paper-plane" class="mr-2" /></template>
        </Button>

        <Button type="submit" label="Guardar" class="w-full btn-guardar" form="formCorreo" :disabled="botonGuardarDeshabilitado">
            <template #icon><font-icon icon="fa-solid fa-floppy-disk" class="mr-2" /></template>
        </Button>
    </Encabezado>

    <div class="card p-0 m-0" style="height: 72vh">
        <Tabs value="0">
            <TabList>
                <Tab value="0">Datos</Tab>
                <Tab value="1">Historial</Tab>
            </TabList>

            <TabPanels>
                <!-- DATOS -->
                <TabPanel value="0">
                    <ScrollPanel style="height: 60vh">
                        <form id="formCorreo" @submit.prevent="handleGuardar">
                            <div style="max-width: 1100px; margin: 0 auto; padding: 30px 20px">
                                <!-- CORREO / CLAVE / ACTIVO -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr 200px; gap: 20px; margin-bottom: 30px">
                                    <div style="display: flex; flex-direction: column; gap: 8px">
                                        <label for="correo_electronico">Correo Electrónico:</label>

                                        <InputText
                                            id="correo_electronico"
                                            v-model="frmCorreo.correo_electronico"
                                            type="email"
                                            :invalid="!correoElectronicoValido"
                                            style="width: 100%; text-transform: lowercase"
                                            @update:modelValue="frmCorreo.correo_electronico = $event.toLowerCase()"
                                        />
                                    </div>

                                    <div style="display: flex; flex-direction: column; gap: 8px">
                                        <label for="clave">Clave:</label>

                                        <Password id="clave" v-model="frmCorreo.clave" :invalid="!claveValida" :feedback="false" toggleMask inputClass="w-full" class="w-full" />
                                    </div>

                                    <div style="display: flex; align-items: center; gap: 8px; padding-top: 30px">
                                        <Checkbox inputId="activo" v-model="frmCorreo.activo" binary />
                                        <label for="activo">Activo</label>
                                    </div>
                                </div>

                                <!-- SERVIDOR ENTRANTE -->
                                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 20px; margin-bottom: 30px">
                                    <div style="display: flex; flex-direction: column; gap: 8px">
                                        <label for="servidor_entrante">Servidor Entrante:</label>

                                        <InputText
                                            id="servidor_entrante"
                                            v-model="frmCorreo.servidor_entrante"
                                            :invalid="!servidorEntranteValido"
                                            style="width: 100%; text-transform: lowercase"
                                            @update:modelValue="frmCorreo.servidor_entrante = $event.toLowerCase()"
                                        />
                                    </div>

                                    <div style="display: flex; flex-direction: column; gap: 8px">
                                        <label for="puerto_imap">Puerto IMAP:</label>

                                        <InputNumber id="puerto_imap" v-model="frmCorreo.puerto_imap" :useGrouping="false" :min="1" :max="65535" showButtons :invalid="!puertoImapValido" class="w-full" />
                                    </div>

                                    <div style="display: flex; flex-direction: column; gap: 8px">
                                        <label for="puerto_pop3">Puerto POP3:</label>

                                        <InputNumber id="puerto_pop3" v-model="frmCorreo.puerto_pop3" :useGrouping="false" :min="1" :max="65535" showButtons :invalid="!puertoPop3Valido" class="w-full" />
                                    </div>
                                </div>

                                <!-- SERVIDOR SALIENTE -->
                                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 30px">
                                    <div style="display: flex; flex-direction: column; gap: 8px">
                                        <label for="servidor_saliente">Servidor Saliente:</label>

                                        <InputText
                                            id="servidor_saliente"
                                            v-model="frmCorreo.servidor_saliente"
                                            :invalid="!servidorSalienteValido"
                                            style="width: 100%; text-transform: lowercase"
                                            @update:modelValue="frmCorreo.servidor_saliente = $event.toLowerCase()"
                                        />
                                    </div>

                                    <div style="display: flex; flex-direction: column; gap: 8px">
                                        <label for="puerto_smtp">Puerto SMTP:</label>

                                        <InputNumber id="puerto_smtp" v-model="frmCorreo.puerto_smtp" :useGrouping="false" :min="1" :max="65535" showButtons :invalid="!puertoSmtpValido" class="w-full" />
                                    </div>
                                </div>

                                <!-- CORREO PRUEBA -->
                                <div style="border-top: 1px solid #ddd; padding-top: 20px">
                                    <div style="display: grid; grid-template-columns: 1fr; gap: 8px">
                                        <label for="correo_prueba">Correo Electrónico de Prueba:</label>

                                        <InputText
                                            id="correo_prueba"
                                            v-model="correoPrueba"
                                            type="email"
                                            :invalid="!correoPruebaValido"
                                            placeholder="correo@empresa.com"
                                            style="width: 100%; text-transform: lowercase"
                                            @update:modelValue="correoPrueba = $event.toLowerCase()"
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </ScrollPanel>
                </TabPanel>

                <!-- HISTORIAL -->
                <TabPanel value="1">
                    <p class="m-0">Aquí se mostrará el historial de configuración del correo.</p>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'CorreoNotificaciones',
    components: { Encabezado },
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
