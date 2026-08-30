<template>
    <Encabezado titulo="Conexión SSH Sat" subtitulo="Configuración del servidor SSH Sat" icono="pi pi-server">
        <Button type="button" label="Probar Conexión" class="btn-probar-ssh" @click="handleProbar" :disabled="botonProbarDeshabilitado">
            <template #icon>
                <font-icon icon="fa-solid fa-plug-circle-check" class="mr-2" />
            </template>
        </Button>

        <Button type="submit" label="Guardar" class="w-full btn-guardar" form="formSSH" :disabled="botonGuardarDeshabilitado">
            <template #icon>
                <font-icon icon="fa-solid fa-floppy-disk" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <div class="card p-0 m-0" style="height: 72vh">
        <Tabs value="0">
            <TabList>
                <Tab value="0"> Datos </Tab>

                <Tab value="1"> Historial </Tab>
            </TabList>

            <TabPanels>
                <!-- ================================================= -->
                <!-- DATOS -->
                <!-- ================================================= -->

                <TabPanel value="0">
                    <ScrollPanel style="height: 60vh">
                        <form id="formSSH" @submit.prevent="handleGuardar">
                            <div class="form-ssh">
                                <!-- HOST / PUERTO -->

                                <div class="grid-ssh grid-host">
                                    <div class="campo-ssh">
                                        <label for="host"> Host / IP: </label>

                                        <InputText id="host" v-model="frmSSH.host" placeholder="192.168.1.100" :invalid="!hostValido" class="w-full" />
                                    </div>

                                    <div class="campo-ssh">
                                        <label for="puerto"> Puerto: </label>

                                        <InputNumber id="puerto" v-model="frmSSH.puerto" :useGrouping="false" :min="1" :max="65535" showButtons :invalid="!puertoValido" class="w-full" />
                                    </div>
                                </div>

                                <!-- USUARIO / CONTRASEÑA -->

                                <div class="grid-ssh grid-usuario">
                                    <div class="campo-ssh">
                                        <label for="usuario"> Usuario: </label>

                                        <InputText id="usuario" v-model="frmSSH.usuario" :invalid="!usuarioValido" autocomplete="off" class="w-full" />
                                    </div>

                                    <div class="campo-ssh">
                                        <label for="clave"> Clave: </label>

                                        <Password id="clave" v-model="frmSSH.clave" :feedback="false" toggleMask inputClass="w-full" class="w-full" autocomplete="new-password" />
                                    </div>
                                </div>

                                <!-- TIMEOUT / ACTIVO -->

                                <div class="grid-ssh grid-config">
                                    <div class="campo-ssh">
                                        <label for="timeout"> Timeout: </label>

                                        <InputNumber id="timeout" v-model="frmSSH.timeout" :useGrouping="false" :min="1" :max="300" suffix=" s" class="w-full" />
                                    </div>

                                    <div class="campo-activo">
                                        <Checkbox inputId="activo" v-model="frmSSH.activo" binary />

                                        <label for="activo"> Activo </label>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </ScrollPanel>
                </TabPanel>

                <!-- ================================================= -->
                <!-- HISTORIAL -->
                <!-- ================================================= -->

                <TabPanel value="1">
                    <p class="m-0">Aquí se mostrará el historial de configuración SSH.</p>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';

import proceso from './js/proceso.js';

export default {
    name: 'ConexionSSH',

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
