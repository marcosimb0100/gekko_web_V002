<template>
    <Encabezado titulo="CONTPAQi .NET" subtitulo="Conexión y claves del ejecutor de escritorio">
        <template #icono><font-icon icon="fa-solid fa-gears" style="font-size: 1.2rem" /></template>
        <Button label="Actualizar" icon="pi pi-refresh" outlined :disabled="ocupado" @click="handleCargar" />
        <Button label="Guardar" icon="pi pi-save" severity="success" :loading="guardando" :disabled="ocupado || !configuracion" @click="handleGuardar" />
    </Encabezado>
    <div class="card contpaq-contenido" :aria-busy="ocupado">
        <Tabs value="0" v-if="configuracion" class="contpaq-tabs">
            <TabList><Tab value="0">Datos</Tab><Tab value="1">Historial</Tab></TabList>
            <TabPanels><TabPanel value="0"><div class="contpaq-datos">
            <Fieldset legend="Conexión del ejecutable">
                <div class="contpaq-campo"><label for="contpaq-url">Dirección de la API <span class="contpaq-requerido">*</span></label>
                    <InputText id="contpaq-url" v-model="formulario.api_url" placeholder="https://tu-api.dominio.com/api" :disabled="ocupado" maxlength="500" />
                    <small>Copia esta dirección en ApiBaseUrl de timbradoContpaq.exe.config. Guardarla aquí no cambia el ejecutable instalado.</small>
                </div>
                <div class="contpaq-control"><ToggleSwitch inputId="contpaq-exigir" v-model="formulario.exigir_timbrado" :disabled="ocupado || !configuracion.claves.timbrado.generada || !configuracion.claves.timbrado.habilitada" />
                    <label for="contpaq-exigir">Exigir clave para el timbrado</label>
                    <Tag :value="configuracion.exigir_timbrado ? 'Clave obligatoria' : 'Compatibilidad con ejecutable anterior'" :severity="configuracion.exigir_timbrado ? 'success' : 'warn'" />
                </div>
                <small>Activa esta opción después de actualizar .NET y configurar su clave. Mientras esté desactivada, el timbrado anterior continúa sin exigirla.</small>
            </Fieldset>
            <div class="contpaq-claves">
                <Fieldset v-for="tipo in tipos" :key="tipo.id" :legend="tipo.nombre">
                    <div class="contpaq-resumen"><i :class="tipo.icono" /><Tag :value="!configuracion.claves[tipo.id].generada ? 'Sin generar' : configuracion.claves[tipo.id].habilitada ? 'Habilitada' : 'Deshabilitada'" :severity="!configuracion.claves[tipo.id].generada ? 'secondary' : configuracion.claves[tipo.id].habilitada ? 'success' : 'danger'" /></div>
                    <p>Configuración .NET: <strong>{{ tipo.id === 'timbrado' ? 'StampingWorkerToken' : 'CancelacionesWorkerToken' }}</strong></p>
                    <small v-if="configuracion.claves[tipo.id].origen === 'migrada_env'">Clave anterior migrada desde el servidor. El ejecutable actual puede seguir usándola.</small>
                    <small v-else>La clave solo se muestra al generarla. MongoDB conserva su huella protegida.</small>
                    <div class="contpaq-fecha">Última generación: {{ handleFecha(configuracion.claves[tipo.id].fecha) }}</div>
                    <div class="contpaq-acciones">
                        <Button :label="configuracion.claves[tipo.id].generada ? 'Renovar clave' : 'Generar clave'" icon="pi pi-key" outlined :disabled="ocupado" @click="handleSolicitar(tipo.id, 'generar')" />
                        <Button v-if="configuracion.claves[tipo.id].generada" :label="configuracion.claves[tipo.id].habilitada ? 'Deshabilitar' : 'Habilitar'" :icon="configuracion.claves[tipo.id].habilitada ? 'pi pi-lock' : 'pi pi-lock-open'" :severity="configuracion.claves[tipo.id].habilitada ? 'danger' : 'success'" outlined :disabled="ocupado" @click="handleSolicitar(tipo.id, 'estado', !configuracion.claves[tipo.id].habilitada)" />
                    </div>
                </Fieldset>
            </div>
            </div></TabPanel><TabPanel value="1">
                <DataTable :value="configuracion.historial" size="small" paginator :rows="10" scrollable scrollHeight="18rem" class="tabla-encabezados">
                    <template #empty>No hay cambios registrados.</template>
                    <Column header="Fecha" headerClass="encabezado-columna"><template #body="{ data }">{{ handleFecha(data.fecha) }}</template></Column>
                    <Column field="responsable" header="Responsable" headerClass="encabezado-columna" />
                    <Column field="accion" header="Movimiento" headerClass="encabezado-columna" />
                </DataTable>
            </TabPanel></TabPanels>
        </Tabs>
    </div>
    <Dialog v-model:visible="confirmar" modal header="Confirmar cambio" :style="{ width: '32rem' }" :breakpoints="{ '640px': '95vw' }" :closable="!guardando">
        <p v-if="accion?.operacion === 'generar'">Se generará una nueva clave de {{ accion.tipo }}. Si ya existe una, dejará de funcionar. Copia la nueva clave al ejecutable antes de continuar su operación.</p>
        <p v-else>Se {{ accion?.habilitada ? 'habilitará' : 'deshabilitará' }} la clave de {{ accion?.tipo }}. El cambio aplica a las siguientes peticiones del ejecutable.</p>
        <template #footer><Button label="Cancelar" outlined :disabled="guardando" @click="confirmar = false" /><Button label="Confirmar" icon="pi pi-check" :loading="guardando" @click="handleConfirmar" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarClave" modal header="Clave generada" :style="{ width: '38rem' }" :breakpoints="{ '640px': '95vw' }" @hide="handleCerrarClave">
        <p>Copia esta clave ahora. No podrás consultarla después de cerrar esta ventana.</p>
        <label for="contpaq-clave">{{ tipoClave === 'timbrado' ? 'StampingWorkerToken' : 'CancelacionesWorkerToken' }}</label>
        <Textarea id="contpaq-clave" :modelValue="clave" readonly rows="3" class="contpaq-secreto" />
        <template #footer><Button label="Copiar clave" icon="pi pi-copy" @click="handleCopiar" /><Button label="Cerrar" outlined @click="mostrarClave = false" /></template>
    </Dialog>
</template>
<script>
import proceso from './js/proceso.js';
export default { name: 'ContpaqNet', setup() { return { ...proceso() }; } };
</script>
<style scoped>
@import './css/estilo.css';
</style>