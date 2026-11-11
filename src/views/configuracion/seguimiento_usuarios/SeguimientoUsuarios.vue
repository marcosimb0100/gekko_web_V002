<template>
    <Encabezado titulo="Seguimiento de usuarios" subtitulo="Páginas abiertas por las sesiones conectadas" icono="pi pi-desktop" />
    <div class="card seguimiento-usuarios">
        <div class="seguimiento-herramientas">
            <IconField>
                <InputIcon class="pi pi-search" />
                <InputText v-model="busqueda" placeholder="Buscar usuario o página" aria-label="Buscar usuario o página" />
            </IconField>
            <Button label="Actualizar" icon="pi pi-refresh" outlined :loading="cargando" @click="cargar" />
            <Tag :value="enVivo ? 'Conectado al seguimiento' : 'Sin conexión en tiempo real'" :severity="enVivo ? 'success' : 'warn'" />
            <span>{{ totalUsuarios }} usuarios · {{ sesiones.length }} conexiones</span>
        </div>
        <p class="seguimiento-nota">Cada pestaña se muestra por separado. La página abierta no indica actividad del usuario. No se capturan mensajes ni datos de formularios.</p>
        <Message v-if="error" severity="warn" :closable="false">{{ error }}</Message>
        <DataTable v-else :value="filas" dataKey="conexion_id" :loading="cargando" paginator :rows="25" :rowsPerPageOptions="[25, 50, 100]" scrollable stripedRows size="small">
            <template #empty>No hay sesiones conectadas para mostrar.</template>
            <Column header="Usuario" style="min-width: 240px">
                <template #body="{ data }">
                    <div class="seguimiento-identidad">
                        <strong>{{ data.nombre }}</strong>
                        <small>{{ data.correo }}</small>
                    </div>
                </template>
            </Column>
            <Column header="Página abierta" style="min-width: 220px">
                <template #body="{ data }">
                    <div class="seguimiento-identidad">
                        <strong>{{ data.pantalla || 'Sin reporte de página' }}</strong>
                        <small>{{ data.ruta || 'Esperando navegación de esta sesión' }}</small>
                    </div>
                </template>
            </Column>
            <Column field="conexion_id" header="Conexión" />
            <Column header="Conectado desde" style="min-width: 180px">
                <template #body="{ data }">{{ fecha(data.conectado_desde) }}</template>
            </Column>
            <Column header="Último cambio de página" style="min-width: 180px">
                <template #body="{ data }">{{ fecha(data.actualizado) }}</template>
            </Column>
        </DataTable>
        <small v-if="consultado" class="seguimiento-nota">Última consulta: {{ fecha(consultado) }}</small>
    </div>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';

import proceso from './js/proceso.js';

export default {
    name: 'SeguimientoUsuarios',

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
