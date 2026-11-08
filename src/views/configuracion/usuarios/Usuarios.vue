<template>
    <Encabezado titulo="Usuarios" subtitulo="Administración de usuarios del sistema" icono="pi pi-users">
        <Button type="button" label="Nuevo" class="w-full btn-nuevo" @click="handleMostrarFormulario('N')" v-if="!mostrarTablaFormulario">
            <template #icon><font-icon icon="fa-solid fa-plus" class="mr-2" /></template>
        </Button>

        <Button type="button" label="Cancelar" class="w-full btn-cancelar" @click="handleMostrarFormulario('C')" v-if="mostrarTablaFormulario">
            <template #icon><font-icon icon="fa-solid fa-xmark" class="mr-2" /></template>
        </Button>

        <Button type="submit" label="Guardar" class="w-full btn-guardar" id="btnFormUsuario" form="formUsuario" v-if="mostrarTablaFormulario" :disabled="botonGuardarDeshabilitado">
            <template #icon><font-icon icon="fa-solid fa-floppy-disk" class="mr-2" /></template>
        </Button>
    </Encabezado>

    <div class="card p-0 m-0 usuarios-contenedor" :class="{ 'usuarios-modo-tabla': !mostrarTablaFormulario }">
        <div class="usuarios-listado" v-if="!mostrarTablaFormulario">
            <DataTable
                v-model:filters="filtros"
                :value="usuariosVisibles"
                :globalFilterFields="['nombre_completo', 'correo_electronico']"
                paginator
                :rows="100"
                :rowsPerPageOptions="[100, 200, 300, 400]"
                scrollable
                scrollHeight="flex"
                size="small"
                tableStyle="width: 100%; table-layout: fixed"
                class="tabla-encabezados usuarios-tabla"
            >
                <template #header>
                    <div class="usuarios-herramientas">
                        <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined style="margin-right: 5px" @click="handleLimpiarFiltro" />

                        <IconField iconPosition="left">
                            <InputIcon><i class="pi pi-search" /></InputIcon>
                            <InputText v-model="filtros.global.value" placeholder="Buscar..." />
                        </IconField>
                        <ToggleButton v-model="soloConectados" onLabel="Solo conectados" offLabel="Solo conectados" onIcon="pi pi-wifi" offIcon="pi pi-wifi" :disabled="!conexionesDisponibles || consultandoConexiones" aria-label="Mostrar solo usuarios conectados" />
                        <Button label="Actualizar conexiones" icon="pi pi-refresh" outlined :loading="consultandoConexiones" @click="handleActualizarConexiones" />
                        <Tag v-if="conexionesDisponibles" :value="totalConectados + ' conectado(s)'" severity="success" />
                    </div>
                    <div class="usuarios-presencia-ayuda">
                        <span>Conexion al servicio de tiempo real; no indica actividad del usuario ni numero de equipos.</span>
                        <span v-if="horaConsultaConexiones && conexionesDisponibles">Consultado: {{ horaConsultaConexiones }}</span>
                    </div>
                    <Message v-if="errorConexiones" severity="warn" :closable="false">{{ errorConexiones }}</Message>
                </template>

                <template #empty>No se encontraron registros.</template>

                <Column header="Foto" headerClass="encabezado-columna" style="width: 8%">
                    <template #body="slotProps">
                        <div class="flex align-items-center justify-content-center">
                            <img :src="fotosUsuarios[slotProps.data._id] || '../../../assets/images/Perfil.jpg'" alt="usuario" style="width: 55px; height: 55px; border-radius: 50%; object-fit: cover" />
                        </div>
                    </template>
                </Column>

                <Column field="nombre_completo" header="Nombre Completo" headerClass="encabezado-columna" style="width: 24%" />
                <Column field="correo_electronico" header="Correo Electronico" headerClass="encabezado-columna" style="width: 28%" />

                <Column header="Conexion" headerClass="encabezado-columna" style="width: 18%">
                    <template #body="{ data }">
                        <div class="usuario-presencia" :title="handleDescripcionConexion(data)">
                            <Tag :value="!conexionesDisponibles ? 'Sin datos' : (conexionesUsuarios[data._id] ? 'Conectado' : 'Desconectado')" :severity="!conexionesDisponibles ? 'warn' : (conexionesUsuarios[data._id] ? 'success' : 'secondary')" :icon="conexionesUsuarios[data._id] ? 'pi pi-wifi' : 'pi pi-circle'" />
                            <small v-if="conexionesDisponibles && conexionesUsuarios[data._id]">{{ conexionesUsuarios[data._id].conexiones }} conexion(es)</small>
                        </div>
                    </template>
                </Column>

                <Column header="Activo" headerClass="encabezado-columna" style="width: 8%">
                    <template #body="slotProps">
                        <span v-if="slotProps.data.activo === false" style="font-size: 15px; color: red"><font-icon :icon="['fas', 'person-circle-minus']" /></span>
                        <span v-if="slotProps.data.activo === true" style="font-size: 15px; color: green"><font-icon :icon="['fas', 'person-circle-check']" /></span>
                    </template>
                </Column>

                <Column header="Opciones" headerClass="encabezado-columna" style="width: 14%">
                    <template #body="slotProps">
                        <Button class="btn-nuevo" style="margin: 5px" @click="handleMostrarFormulario('E', slotProps.data)">
                            <font-icon :icon="['fas', 'pen-to-square']" />
                        </Button>
                        <Button v-if="puedeCerrarSesiones" icon="pi pi-sign-out" severity="warn" text title="Cerrar todas las sesiones de este usuario" aria-label="Cerrar sesiones" @click="handlePrepararCierre(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Tabs value="0" v-if="mostrarTablaFormulario" class="usuario-tabs">
            <TabList>
                <Tab value="0">Datos</Tab>
                <Tab value="1">Historial</Tab>
            </TabList>

            <TabPanels>
                <TabPanel value="0">
                    <form id="formUsuario" class="usuario-formulario" @submit.prevent="handleGuardar">
                        <aside class="usuario-identidad">
                            <img :src="fotoPreview || fotosUsuarios[frmUsuario._id] || perfil" alt="Foto de perfil" class="usuario-foto" />
                            <Button type="button" label="Cambiar fotografía" icon="pi pi-camera" outlined size="small" @click="handleAbrirFoto" />
                            <small>Imagen JPG o PNG</small>
                            <input ref="fotoInput" type="file" accept=".jpg,.jpeg,.png" hidden @change="handleSeleccionarFoto" />
                            <Tag :value="frmUsuario.activo ? 'Usuario activo' : 'Usuario inactivo'" :severity="frmUsuario.activo ? 'success' : 'secondary'" />
                        </aside>
                        <div class="usuario-configuracion">
                            <Fieldset legend="Datos generales">
                                <div class="usuario-campos">
                                    <div class="usuario-campo">
                                        <label for="nombre_completo">Nombre completo</label>
                                        <InputText id="nombre_completo" v-model="frmUsuario.nombre_completo" class="usuario-mayusculas" :invalid="!nombreCompletoValido" @update:modelValue="frmUsuario.nombre_completo = $event.toUpperCase()" />
                                    </div>
                                    <div class="usuario-campo">
                                        <label for="correo_electronico">Correo electrónico</label>
                                        <InputText id="correo_electronico" type="email" v-model="frmUsuario.correo_electronico" :invalid="!correoElectronicoValido" :disabled="movimiento === 'E'" @update:modelValue="frmUsuario.correo_electronico = $event.toLowerCase()" />
                                    </div>
                                </div>
                                <div class="usuario-opciones">
                                    <div><Checkbox inputId="activo" binary v-model="frmUsuario.activo" /><label for="activo">Activo</label></div>
                                    <div><Checkbox inputId="correo_acceso" binary v-model="frmUsuario.correo_acceso" /><label for="correo_acceso">Correo de acceso</label></div>
                                    <div><Checkbox inputId="chat_habilitado" binary v-model="frmUsuario.chat_habilitado" /><label for="chat_habilitado">Permitir acceso al chat</label></div>
                                </div>
                            </Fieldset>
                            <div class="usuario-seguridad-grid">
                                <Fieldset legend="Seguridad">
                                    <div class="usuario-opcion-clave"><Checkbox inputId="cambiar_clave" binary v-model="frmUsuario.cambiar_clave" :disabled="movimiento === 'N'" @change="handleCambiarClave" /><label for="cambiar_clave">{{ movimiento === 'N' ? 'Definir contraseña' : 'Cambiar contraseña' }}</label></div>
                                    <div v-if="frmUsuario.cambiar_clave" class="usuario-claves">
                                        <div class="usuario-campo"><label for="clave">Contraseña</label><InputText id="clave" type="password" autocomplete="new-password" v-model="frmUsuario.clave" :invalid="!claveValida" /></div>
                                        <div class="usuario-campo"><label for="repita_clave">Confirmar contraseña</label><InputText id="repita_clave" type="password" autocomplete="new-password" v-model="frmUsuario.repita_clave" :invalid="!repitaClaveValida" /></div>
                                    </div>
                                    <small v-else class="usuario-texto-ayuda">La contraseña actual se conserva.</small>
                                </Fieldset>
                                <Fieldset legend="Sesiones del navegador">
                                    <div class="usuario-campo">
                                        <label for="limite_sesiones">Máximo de sesiones simultáneas</label>
                                        <InputNumber inputId="limite_sesiones" v-model="frmUsuario.limite_sesiones" :min="0" :max="100" :useGrouping="false" showButtons />
                                        <div class="usuario-sesiones-resumen"><Tag :value="frmUsuario.limite_sesiones === 0 ? 'Sin límite' : frmUsuario.limite_sesiones + (frmUsuario.limite_sesiones === 1 ? ' navegador' : ' navegadores')" severity="info" /><Button type="button" label="¿Cómo funciona?" icon="pi pi-info-circle" text size="small" @click="handleMostrarAyudaSesiones" /></div>
                                    </div>
                                </Fieldset>
                            </div>
                        </div>
                    </form>
                </TabPanel>

                <TabPanel value="1">
                    <Message severity="secondary" :closable="false">No hay un historial disponible en esta vista.</Message>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
    <Dialog v-model:visible="ayudaSesiones" modal header="Sesiones del navegador" :style="{ width: '32rem' }" :breakpoints="{ '640px': '95vw' }">
        <div class="usuario-ayuda-sesiones">
            <p><strong>0 significa sin límite.</strong> Cada navegador cuenta como una sesión; sus pestañas comparten la misma.</p>
            <p>Al alcanzar el máximo, se rechaza el nuevo inicio de sesión. Usa la opción Salir para liberar un lugar; cerrar la ventana no cierra la sesión.</p>
            <p>Reducir el límite conserva las sesiones existentes. Para retirarlas, usa Cerrar sesiones en la lista de usuarios.</p>
            <p>Windows Sync se administra por dispositivos y tiene su propio control de acceso.</p>
        </div>
        <template #footer><Button type="button" label="Entendido" @click="ayudaSesiones = false" /></template>
    </Dialog>
    <Dialog v-model:visible="confirmarCierre" modal header="Cerrar sesiones del usuario" :style="{ width: '30rem' }" :breakpoints="{ '640px': '95vw' }" :closable="!cerrandoSesiones" :closeOnEscape="!cerrandoSesiones">
        <div class="usuario-confirmar-cierre">
            <strong>{{ usuarioCerrar?.nombre_completo }}</strong>
            <p>Se cerraran todas sus sesiones actuales, incluidas otras pestañas y navegadores. El usuario podra iniciar sesion nuevamente.</p>
        </div>
        <template #footer>
            <Button label="Cancelar" outlined :disabled="cerrandoSesiones" @click="handleCancelarCierre" />
            <Button label="Cerrar sesiones" icon="pi pi-sign-out" severity="warn" :loading="cerrandoSesiones" @click="handleConfirmarCierre" />
        </template>
    </Dialog>
</template>

<script>
import perfil from '../../../assets/images/Perfil.jpg';
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'Usuarios',
    components: { Encabezado },
    setup() {
        return {
            ...proceso(),
            perfil
        };
    }
};
</script>

<style scoped>
@import './css/estilo.css';
</style>