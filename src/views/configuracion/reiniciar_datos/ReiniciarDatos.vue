<template>
    <Encabezado titulo="Reiniciar datos" subtitulo="Limpieza administrativa de operaciones">
        <template #icono><i class="pi pi-database" /></template>
        <Button label="Actualizar" icon="pi pi-refresh" outlined :disabled="ocupado" @click="handleCargar" />
    </Encabezado>
    <div class="card reinicio-contenido" v-if="resumen">
        <div class="reinicio-resumen"><div><small>Base seleccionada</small><h3>{{ resumen.base }}</h3></div>
        </div>
        <Tabs value="0"><TabList><Tab value="0">Datos que se limpiarán</Tab><Tab value="1">Colecciones conservadas</Tab><Tab value="2">Cómo ejecutar</Tab></TabList>
        <TabPanels>
            <TabPanel value="0"><DataTable :value="resumen.colecciones" scrollable scrollHeight="38vh" size="small">
                <Column field="nombre" header="Colección" /><Column field="registros" header="Registros a eliminar" />
            </DataTable></TabPanel>
            <TabPanel value="1"><div class="reinicio-lista"><Tag v-for="nombre in resumen.conservadas" :key="nombre" :value="nombre" severity="secondary" /></div></TabPanel>
            <TabPanel value="2"><ol>
                <li>Detén tareas programadas, el ejecutor .NET y los clientes de sincronización. Evita otros procesos conectados a esta misma base.</li>
                <li>Agrega GEKKO_RESET_MODE=1 en el .env de la API y reiníciala. El resto de operaciones quedará bloqueado.</li>
                <li>Espera tres minutos desde la última actividad de tareas. Actualiza esta pantalla y revisa la base y las colecciones.</li>
                <li>Prepara el reinicio y confirma. Primero se respaldará MongoDB en private_backups dentro del proyecto de la API. En Docker, conserva esa carpeta mediante un volumen privado persistente antes de ejecutar.</li>
                <li>Al terminar, retira GEKKO_RESET_MODE y reinicia la API y los servicios. Ante un fallo, conserva el mantenimiento y revisa el respaldo antes de continuar.</li>
            </ol></TabPanel>
        </TabPanels></Tabs>
        <div class="reinicio-acciones"><Button label="Preparar reinicio" severity="danger" icon="pi pi-exclamation-triangle" :disabled="ocupado || !resumen.mantenimiento" :loading="ocupado" @click="handlePreparar" /></div>
    </div>
    <Dialog v-model:visible="confirmar" modal header="Confirmar reinicio de datos" :closable="!ocupado" :closeOnEscape="!ocupado" :style="{ width: '38rem' }" :breakpoints="{ '640px': '95vw' }">
        <div class="reinicio-confirmacion" v-if="resumen">
            <p>Se eliminarán las operaciones, compañías y catálogos capturados indicados en la vista previa de <strong>{{ resumen.base }}</strong>. Se reconstruirán los índices de Nube y se desactivará su API de sincronización Windows.</p>
            <label>Escribe REINICIAR {{ resumen.base }}<InputText v-model="texto" :disabled="ocupado" autocomplete="off" /></label>
            <div><Checkbox v-model="detenidos" inputId="reinicio-detenidos" binary :disabled="ocupado" /><label for="reinicio-detenidos">Confirmo que detuve los ejecutores y dispongo de almacenamiento persistente para el respaldo.</label></div>
            <small>No cierres esta ventana mientras se procesa. Si se pierde la conexión, revisa el registro administrativo antes de volver a intentar.</small>
        </div>
        <template #footer><Button label="Cancelar" outlined :disabled="ocupado" @click="confirmar = false" /><Button label="Respaldar y reiniciar" severity="danger" :loading="ocupado" :disabled="ocupado || !detenidos || texto !== 'REINICIAR ' + resumen?.base" @click="handleEjecutar" /></template>
    </Dialog>
</template>
<script>
import proceso from './js/proceso.js';
export default { name: 'ReiniciarDatos', setup() { return { ...proceso() }; } };
</script>
<style scoped>
@import './css/estilo.css';
</style>
