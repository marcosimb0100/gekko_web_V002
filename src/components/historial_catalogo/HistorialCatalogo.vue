<template>
    <section class="historial-catalogo">
        <div class="historial-cabecera">
            <div class="historial-titulo"><i class="pi pi-history" /><div><h2>Historial de movimientos</h2><p>{{ entidad }}<span v-if="nombre"> &middot; {{ nombre }}</span></p></div></div>
            <Tag severity="secondary" :value="listaHistorial.length + (listaHistorial.length === 1 ? ' movimiento' : ' movimientos')" />
        </div>
        <Message v-if="errorHistorial" severity="warn" :closable="false">{{ errorHistorial }}</Message>
        <DataTable :loading="cargando" :value="listaHistorial" dataKey="clave" paginator :rows="10" :rowsPerPageOptions="[10, 25, 50]" size="small" class="historial-tabla" :alwaysShowPaginator="false" sortField="fecha" :sortOrder="-1">
            <template #empty><div class="historial-vacio"><i class="pi pi-history" /><strong>Sin movimientos registrados</strong><span>Este registro no tiene historial disponible.</span></div></template>
            <Column field="fecha" header="Fecha" style="width: 14%"><template #body="{ data }"><div class="historial-fecha"><strong>{{ handleFecha(data.fecha) }}</strong><small>{{ handleHora(data.fecha) }}</small></div></template></Column>
            <Column header="Responsable" style="width: 18%"><template #body="{ data }"><div class="historial-responsable"><i :class="data.usuario === 'Portal SAT' ? 'pi pi-cloud-download' : 'pi pi-user'" /><span>{{ data.usuario }}</span></div></template></Column>
            <Column header="Movimiento" style="width: 25%"><template #body="{ data }"><Tag :severity="handleSeveridad(data.accion)" :value="data.accion || 'Movimiento registrado'" /></template></Column>
            <Column header="Datos modificados"><template #body="{ data }"><div class="historial-campos"><Tag v-for="campo in data.campos" :key="campo" severity="secondary" :value="handleNombreCampo(campo)" /><span v-if="!data.campos.length" class="historial-sin-detalle">Sin detalle de campos</span></div></template></Column>
            <Column header="Detalle" style="width: 7rem"><template #body="{ data }"><Button type="button" icon="pi pi-eye" text rounded aria-label="Ver cambios" title="Ver cambios" @click="handleVerCambios(data)" /></template></Column>
        </DataTable>
    </section>
    <Dialog v-model:visible="mostrarCambios" header="Detalle de cambios" modal :style="{ width: '48rem' }" :breakpoints="{ '768px': '94vw' }">
        <div class="historial-detalle-resumen"><Tag :severity="handleSeveridad(movimientoElegido?.accion)" :value="movimientoElegido?.accion || 'Movimiento'" /><span>{{ movimientoElegido?.usuario }}</span><small>{{ handleFecha(movimientoElegido?.fecha) }} &middot; {{ handleHora(movimientoElegido?.fecha) }}</small></div>
        <Message v-if="!cambiosElegidos.length" severity="secondary" :closable="false">Este movimiento es anterior al registro detallado. Los valores anteriores y nuevos no estan disponibles.</Message>
        <DataTable v-else :value="cambiosElegidos" size="small" class="historial-comparacion">
            <Column header="Campo" style="width: 26%"><template #body="{ data }">{{ handleNombreCampo(data.campo) }}</template></Column>
            <Column header="Dato anterior"><template #body="{ data }"><span class="historial-valor-anterior">{{ data.anterior || 'Sin dato' }}</span></template></Column>
            <Column header="Dato nuevo"><template #body="{ data }"><span class="historial-valor-nuevo">{{ data.nuevo || 'Sin dato' }}</span></template></Column>
        </DataTable>
        <template #footer><Button label="Cerrar" outlined @click="handleCerrarCambios" /></template>
    </Dialog>
</template>
<script>
import proceso from './js/proceso';
export default {
    name: 'HistorialCatalogo',
    props: { modulo: { type: String, default: '' }, registroId: { type: String, default: '' }, movimientos: { type: Array, default: () => [] }, entidad: { type: String, default: '' }, nombre: { type: String, default: '' } },
    setup(props) { return { ...proceso(props) }; }
};
</script>
<style scoped>
@import './css/estilo.css';
</style>
