<template>
    <Encabezado titulo="Conflictos de sincronización" subtitulo="Copias conservadas para revisión administrativa" icono="pi pi-copy">
        <Button label="Información" icon="pi pi-info-circle" outlined @click="handleMostrarAyuda" />
        <Button label="Actualizar" icon="pi pi-refresh" :disabled="cargando" @click="handleActualizar" />
    </Encabezado>
    <div class="card conflictos-nube">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <Message v-if="servicioHabilitado === false" severity="warn" :closable="false">El servicio de sincronización Windows no está habilitado. Un administrador puede activarlo en Nube → Configuración. Esta pantalla sigue disponible para consulta y administración.</Message>
        <DataTable :value="registros" :loading="cargando" dataKey="_id" scrollable scrollHeight="55vh" size="small" class="tabla-encabezados" tableStyle="min-width: 65rem">
            <template #empty>No hay conflictos conservados en esta página.</template>
            <Column field="nombre" header="Archivo" />
            <Column field="usuario" header="Usuario" />
            <Column field="equipo" header="Equipo" />
            <Column header="Fecha"><template #body="{ data }">{{ handleFecha(data.fecha) }}</template></Column>
            <Column header="Tamaño"><template #body="{ data }">{{ handleTamano(data.bytes) }}</template></Column>
            <Column header="Estado"><template #body="{ data }"><Tag :value="data.estado === 'pendiente' ? 'Pendiente' : 'Revisado'" :severity="data.estado === 'pendiente' ? 'warn' : 'success'" /></template></Column>
            <Column header="Opciones"><template #body="{ data }"><div class="conflictos-acciones"><Button label="Descargar copia" icon="pi pi-download" outlined :disabled="cargando" @click="handleDescargar(data)" /><Button v-if="data.estado === 'pendiente'" label="Marcar revisado" icon="pi pi-check" :disabled="cargando" @click="handleMostrarConfirmacion(data)" /></div></template></Column>
        </DataTable>
        <div class="conflictos-paginacion"><Button label="Anterior" outlined :disabled="cargando || !offset" @click="handlePaginar(-1)" /><span>Página {{ offset / limite + 1 }}</span><Button label="Siguiente" outlined :disabled="cargando || registros.length < limite" @click="handlePaginar(1)" /></div>
    </div>
    <Dialog v-model:visible="confirmacionVisible" header="Marcar conflicto revisado" modal :closable="!cargando" class="conflictos-dialogo"><p><strong>{{ seleccionado?.nombre }}</strong></p><p>Se conservará esta copia y el archivo vigente. Esta acción únicamente registra la revisión; no publica una versión nueva ni elimina contenido.</p><Message v-if="error" severity="error" :closable="false">{{ error }}</Message><template #footer><Button label="Cancelar" outlined :disabled="cargando" @click="handleCerrarConfirmacion" /><Button label="Marcar revisado" icon="pi pi-check" :disabled="cargando" @click="handleConfirmar" /></template></Dialog>
    <Dialog v-model:visible="ayudaVisible" header="Copias en conflicto" modal class="conflictos-dialogo"><p>Si un equipo publica una revisión antigua o un nombre que ya existe, la API conserva su contenido sin sobrescribir el archivo vigente.</p><p>Descarga la copia para compararla y, si necesitas publicarla, carga una nueva versión desde el kiosco después de revisar el archivo actual. Marcar revisado no sustituye ese paso y no libera almacenamiento.</p><template #footer><Button label="Entendido" @click="handleCerrarAyuda" /></template></Dialog>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
export default { name: 'ConflictosNube', components: { Encabezado }, setup() { return { ...proceso() }; } };
</script>

<style scoped>
@import './css/estilo.css';
</style>
