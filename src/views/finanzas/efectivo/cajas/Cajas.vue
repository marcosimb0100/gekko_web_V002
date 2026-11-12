<template>
    <Encabezado titulo="Cajas" subtitulo="Registro de cajas de efectivo y saldos iniciales" icono="pi pi-wallet">
        <Button label="Nueva caja" icon="pi pi-plus" class="btn-nuevo" :disabled="cargando || !!error || conflicto" @click="handleNuevo" />
    </Encabezado>
    <div class="card cajas-contenedor">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <Message v-if="conflicto" severity="warn" :closable="false">Existen saldos de modalidades incompatibles. Revisa el efectivo antes de modificar cajas.</Message>
        <div class="cajas-resumen"><Tag :value="cajas.length + ' cajas'" severity="secondary" /><Tag :value="cajas.filter(c => c.activo).length + ' activas'" severity="success" /></div>
        <div class="cajas-barra"><IconField><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="Buscar caja" /></IconField><Select v-model="estado" :options="estados" optionLabel="label" optionValue="value" placeholder="Todos los estados" showClear /><Button label="Limpiar" icon="pi pi-filter-slash" outlined @click="handleLimpiar" /><Button label="Actualizar" icon="pi pi-refresh" outlined :loading="cargando" @click="handleCargar" /></div>
        <DataTable :value="filas" :loading="cargando" paginator :rows="10" :rowsPerPageOptions="[10, 25, 50]" size="small" class="cajas-tabla">
            <template #empty>No hay cajas registradas con estos filtros.</template>
            <Column header="Caja"><template #body="{ data }"><div class="cajas-identidad"><i class="pi pi-wallet" /><div><strong>{{ data.nombre }}</strong><small>{{ data.notas || 'Caja de efectivo' }}</small></div></div></template></Column>
            <Column header="Saldo inicial"><template #body="{ data }"><span class="cajas-importe">{{ handleMoneda(data.saldo) }}</span></template></Column>
            <Column header="Fecha del saldo"><template #body="{ data }">{{ handleFecha(data.fecha_saldo) }}</template></Column>
            <Column header="Estado"><template #body="{ data }"><Tag :value="data.activo ? 'Activa' : 'Inactiva'" :severity="data.activo ? 'success' : 'secondary'" /></template></Column>
            <Column header="Opciones"><template #body="{ data }"><Button icon="pi pi-pencil" outlined rounded aria-label="Editar caja" :disabled="conflicto || !!error" @click="handleEditar(data)" /></template></Column>
        </DataTable>
    </div>
    <Dialog v-model:visible="mostrar" modal :header="formulario.id ? 'Editar caja' : 'Nueva caja'" :style="{ width: '43rem' }" :breakpoints="{ '768px': '95vw' }" :closable="!guardando" :closeOnEscape="!guardando">
        <Message v-if="errorFormulario" severity="error" :closable="false">{{ errorFormulario }}</Message>
        <form id="formCaja" class="cajas-formulario" :inert="guardando" @submit.prevent="handleGuardar">
            <Fieldset legend="Datos de la caja"><div class="cajas-rejilla">
                <div class="cajas-ancho"><label for="caja-nombre">Nombre de la caja *</label><InputText id="caja-nombre" v-model="formulario.nombre" maxlength="100" placeholder="Ej. Caja de oficina" /></div>
                <div class="cajas-ancho"><label for="caja-notas">Observaciones</label><Textarea id="caja-notas" v-model="formulario.notas" rows="2" autoResize maxlength="500" /></div>
                <div class="cajas-check"><ToggleSwitch inputId="caja-activa" v-model="formulario.activo" /><label for="caja-activa">Caja activa</label></div>
            </div></Fieldset>
            <Fieldset legend="Saldo inicial"><div class="cajas-rejilla">
                <div><label for="caja-saldo">Importe inicial (MXN) *</label><InputNumber inputId="caja-saldo" v-model="formulario.importe" mode="currency" currency="MXN" locale="es-MX" :min="0" :max="999999999999.99" :disabled="saldoBloqueado" /></div>
                <div><label for="caja-fecha">Fecha del saldo *</label><DatePicker inputId="caja-fecha" v-model="formulario.fecha" dateFormat="dd/mm/yy" showIcon :manualInput="false" :disabled="saldoBloqueado" /></div>
                <small class="cajas-ancho" v-if="saldoBloqueado"><i class="pi pi-lock" /> {{ formulario.operaciones_iniciadas ? 'La caja tiene operaciones registradas. Para aumentar el efectivo, registra una entrada en Movimientos de caja.' : 'Tu perfil no permite modificar el saldo inicial ni su fecha.' }} Puedes actualizar los datos de la caja.</small>
            </div></Fieldset>
        </form>
        <template #footer><Button label="Cancelar" outlined :disabled="guardando" @click="mostrar = false" /><Button label="Guardar" icon="pi pi-save" class="btn-guardar" type="submit" form="formCaja" :loading="guardando" :disabled="!formularioValido || guardando" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso';
export default { name: 'Cajas', components: { Encabezado }, setup() { return { ...proceso() }; } };
</script>
<style scoped>
@import './css/estilo.css';
</style>
