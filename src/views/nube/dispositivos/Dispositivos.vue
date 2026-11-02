<template>
    <Encabezado titulo="Equipos Windows" subtitulo="Autorización y revocación de equipos de sincronización" icono="pi pi-desktop">
        <Button v-if="instalador" label="Descargar Gekko Sync" icon="pi pi-download" :loading="descargandoInstalador" @click="handleDescargarInstalador" />
        <Button label="Guía de equipos" icon="pi pi-info-circle" outlined @click="handleMostrarAyuda" />
        <Button label="Actualizar" icon="pi pi-refresh" :disabled="cargando" @click="handleActualizar" />
    </Encabezado>
    <div class="card equipos-nube">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <Message v-if="servicioHabilitado === false" severity="warn" :closable="false"
            >El servicio de sincronización Windows no está habilitado. Un administrador puede activarlo en Nube → Configuración. Esta pantalla sigue disponible para consulta y administración.</Message
        >
        <div class="equipos-filtros">
            <IconField><InputIcon class="pi pi-search" /><InputText v-model="filtros.global.value" placeholder="Buscar en esta página" aria-label="Buscar equipo" :disabled="cargando" /></IconField>
            <Select v-model="filtros.estado.value" :options="estados" optionLabel="nombre" optionValue="valor" placeholder="Todos los estados" showClear :disabled="cargando" aria-label="Filtrar por estado" />
        </div>
        <DataTable
            :value="equipos"
            v-model:filters="filtros"
            :globalFilterFields="['nombre', 'nombre_usuario', 'estado']"
            dataKey="_id"
            :loading="cargando"
            scrollable
            scrollHeight="55vh"
            size="small"
            class="tabla-encabezados"
            tableStyle="min-width: 65rem"
        >
            <template #empty
                ><div class="equipos-vacio"><i class="pi pi-desktop" aria-hidden="true" /><strong>No hay equipos que mostrar</strong><span>El cliente Windows registrará cada computadora y solicitará autorización.</span></div></template
            >
            <Column field="nombre" header="Equipo" />
            <Column field="nombre_usuario" header="Usuario" />
            <Column field="estado" header="Estado"
                ><template #body="{ data }"><Tag :value="handleEstado(data.estado)" :severity="handleSeveridad(data.estado)" /></template
            ></Column>
            <Column header="Registro"
                ><template #body="{ data }">{{ handleFecha(data.fecha) }}</template></Column
            >
            <Column header="Última actividad"
                ><template #body="{ data }">{{ handleFecha(data.ultima_actividad) }}</template></Column
            >
            <Column v-if="administrador" header="Opciones"
                ><template #body="{ data }"
                    ><div class="equipos-acciones">
                        <Button v-if="data.estado === 'pendiente'" label="Autorizar" icon="pi pi-check" class="btn-guardar" :disabled="cargando" @click="handleMostrarConfirmacion(data, 'autorizar')" />
                        <Button v-if="data.estado !== 'revocado'" label="Revocar" icon="pi pi-ban" severity="danger" outlined :disabled="cargando" @click="handleMostrarConfirmacion(data, 'revocar')" /></div></template
            ></Column>
        </DataTable>
        <div class="equipos-paginacion">
            <Button label="Anterior" icon="pi pi-angle-left" outlined :disabled="cargando || !offset" @click="handlePaginar(-1)" /><span>Página {{ offset / limite + 1 }}</span
            ><Button label="Siguiente" icon="pi pi-angle-right" iconPos="right" outlined :disabled="cargando || equipos.length < limite" @click="handlePaginar(1)" />
        </div>
    </div>
    <Dialog v-model:visible="confirmacionVisible" modal :header="accion === 'autorizar' ? 'Autorizar equipo' : 'Revocar equipo'" :closable="!cargando" class="equipos-dialogo">
        <p>
            <strong>{{ seleccionado?.nombre }}</strong> · {{ seleccionado?.nombre_usuario }}
        </p>
        <p v-if="accion === 'autorizar'">El equipo podrá sincronizar cuando el servicio esté habilitado y el usuario tenga permisos en sus repositorios.</p>
        <p v-else>Se invalidará la credencial del equipo. La revocación es definitiva para este registro y no borra copias ya descargadas. Para volver a conectarlo se necesita una instalación nueva.</p>
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <Message v-if="servicioHabilitado === false" severity="warn" :closable="false"
            >El servicio de sincronización Windows no está habilitado. Un administrador puede activarlo en Nube → Configuración. Esta pantalla sigue disponible para consulta y administración.</Message
        >
        <template #footer
            ><Button label="Cancelar" outlined :disabled="cargando" @click="handleCerrarConfirmacion" /><Button
                :label="accion === 'autorizar' ? 'Autorizar' : 'Revocar'"
                :severity="accion === 'revocar' ? 'danger' : 'success'"
                :disabled="cargando"
                @click="handleConfirmar"
        /></template>
    </Dialog>
    <Dialog v-model:visible="ayudaVisible" modal header="Equipos y sincronización Windows" class="equipos-dialogo">
        <div class="equipos-ayuda">
            <p>El programa Windows registra la computadora con su usuario Gekko. Un administrador autoriza la solicitud antes de permitir sincronización.</p>
            <p>En Configuración de Nube habilita la API Windows. En Permisos concede Lectura y Sync local al repositorio y las carpetas necesarias. Editar local permite publicar cambios; no equivale a la carga manual del kiosco.</p>
            <p>Los administradores ven todos los equipos; los demás usuarios ven únicamente los suyos. Revocar impide solicitudes futuras y no retira los archivos ya recibidos.</p>
            <p>Cuando el servicio está habilitado y hay un instalador publicado, usa Descargar Gekko Sync. Instálalo, inicia sesión con tu cuenta y solicita la autorización del equipo. La descarga no autoriza el equipo automáticamente.</p>
        </div>
        <template #footer><Button label="Entendido" icon="pi pi-check" @click="handleCerrarAyuda" /></template>
    </Dialog>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
export default {
    name: 'DispositivosNube',
    components: { Encabezado },
    setup() {
        return { ...proceso() };
    }
};
</script>

<style scoped>
@import './css/estilo.css';
</style>
