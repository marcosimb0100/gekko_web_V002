<template>
    <Encabezado titulo="Saldos iniciales" subtitulo="Saldo inicial de efectivo por empresa o caja global" icono="pi pi-wallet" />
    <div class="card saldos-iniciales">
        <div class="saldos-modalidad">
            <span>Modalidad de efectivo</span>
            <Tag v-if="modoFijado" :value="modoFijado === 'global' ? 'Caja global' : 'Por empresa'" severity="info" />
            <SelectButton v-else v-model="modo" :options="modos" optionLabel="label" optionValue="value" :allowEmpty="false" :disabled="cargando || !!guardandoId || !!error" aria-label="Tipo de caja" />
            <Button v-if="puedeModificar && modoFijado && !error" label="Cambiar modalidad" icon="pi pi-arrow-right-arrow-left" outlined :disabled="cargando || !!guardandoId" :loading="preparandoCambio" @click="abrirCambio" />
        </div>
        <div class="saldos-herramientas">
            <IconField v-if="modo === 'empresa'">
                <InputIcon class="pi pi-search" />
                <InputText v-model="busqueda" placeholder="Buscar empresa o RFC" aria-label="Buscar empresa o RFC" />
            </IconField>
            <Select v-if="modo === 'empresa'" v-model="estado" :options="estados" optionLabel="label" optionValue="value" placeholder="Todos los estados" showClear aria-label="Filtrar estado del saldo" />
            <Button label="Actualizar" icon="pi pi-refresh" outlined :loading="cargando" :disabled="!!guardandoId" @click="cargar" />
        </div>
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <template v-else>
            <div v-if="modo === 'empresa'" class="saldos-resumen">
                <span>{{ empresas.length }} empresas</span>
                <Tag :value="`${pendientes} sin saldo inicial`" severity="warn" />
            </div>
            <DataTable :value="filas" dataKey="id" :loading="cargando" :paginator="modo === 'empresa'" :rows="15" :rowsPerPageOptions="[15, 30, 50]" stripedRows scrollable size="small" class="saldos-tabla">
                <template #empty>{{ modo === 'global' ? 'No fue posible consultar la caja global. Actualiza la consulta.' : 'No hay empresas para mostrar.' }}</template>
                <Column :header="modo === 'global' ? 'Caja' : 'Empresa'" style="min-width: 240px">
                    <template #body="{ data }">
                        <div class="saldos-empresa">
                            <strong>{{ data.nombre }}</strong>
                            <small>{{ modo === 'global' ? 'Efectivo compartido' : data.rfc || 'Sin RFC' }}</small>
                        </div>
                    </template>
                </Column>

                <Column header="Estado" style="min-width: 160px">
                    <template #body="{ data }">
                        <Tag :value="data.tiene_saldo ? 'Registrado' : 'Sin saldo inicial'" :severity="data.tiene_saldo ? 'success' : 'warn'" />
                    </template>
                </Column>

                <Column header="Saldo registrado" style="min-width: 170px">
                    <template #body="{ data }">
                        <span class="saldos-importe">{{ moneda(data.saldo) }}</span>
                    </template>
                </Column>

                <Column header="Saldo inicial (MXN)" style="min-width: 200px">
                    <template #body="{ data }">
                        <InputNumber
                            v-model="data.importe"
                            mode="currency"
                            currency="MXN"
                            locale="es-MX"
                            :min="0"
                            :max="999999999999.99"
                            :minFractionDigits="2"
                            :maxFractionDigits="2"
                            :disabled="!puedeEditar(data)"
                            :aria-label="`Saldo inicial de ${data.nombre}`"
                            class="saldos-captura"
                        />
                    </template>
                </Column>

                <Column header="Fecha del saldo" style="min-width: 180px">
                    <template #body="{ data }">
                        <DatePicker v-model="data.fecha" dateFormat="dd/mm/yy" showIcon :manualInput="false" :disabled="!puedeEditar(data)" :aria-label="`Fecha del saldo de ${data.nombre}`" class="saldos-fecha" />
                    </template>
                </Column>

                <Column header="Acciones" style="min-width: 170px">
                    <template #body="{ data }">
                        <Button
                            :label="data.tiene_saldo ? 'Actualizar saldo' : 'Guardar saldo'"
                            :icon="data.puede_editar ? 'pi pi-save' : 'pi pi-lock'"
                            size="small"
                            :loading="guardandoId === data.id"
                            :disabled="!puedeEditar(data) || data.importe == null || !data.fecha"
                            :title="data.puede_editar ? 'Guardar saldo inicial' : 'Consulta nuevamente o solicita el permiso Saldos iniciales'"
                            @click="guardar(data)"
                        />
                    </template>
                </Column>
            </DataTable>
        </template>
    </div>
    <Dialog
        v-model:visible="mostrarCambio"
        modal
        header="Cambiar modalidad de efectivo"
        :style="{ width: '54rem' }"
        :breakpoints="{ '768px': '95vw' }"
        :closable="!preparandoCambio && !aplicandoCambio"
        :closeOnEscape="!preparandoCambio && !aplicandoCambio"
    >
        <div class="saldos-cambio">
            <p v-if="preparandoCambio" role="status">Consultando los saldos para preparar el cambio…</p>
            <Message v-if="errorCambio" severity="error" :closable="false">{{ errorCambio }}</Message>
            <template v-if="detalleCambio">
                <Message severity="warn" :closable="false">
                    {{ detalleCambio.destino === 'empresa' ? 'El saldo de caja global se repartirá entre las empresas seleccionadas.' : 'Los saldos por empresa se consolidarán en una sola caja global.' }}
                    La modalidad anterior quedará en el historial. Este cambio utiliza los saldos iniciales registrados.
                </Message>
                <div class="saldos-cambio-total">
                    <span>Total a conservar</span>
                    <strong>{{ moneda(detalleCambio.saldo_total) }}</strong>
                </div>
                <DataTable :value="detalleCambio.saldos_origen" size="small" scrollable scrollHeight="12rem">
                    <Column field="nombre" header="Origen" />
                    <Column header="Saldo"
                        ><template #body="{ data }">{{ moneda(data.saldo) }}</template></Column
                    >
                </DataTable>
                <form id="formCambioModalidad" class="saldos-cambio-formulario" :inert="aplicandoCambio" @submit.prevent="confirmarCambio">
                    <template v-if="detalleCambio.destino === 'empresa'">
                        <div class="saldos-cambio-campo">
                            <label for="empresas-reparto">Empresas que recibirán el saldo</label>
                            <MultiSelect inputId="empresas-reparto" v-model="empresasElegidas" :options="detalleCambio.empresas" optionLabel="nombre" optionValue="id" filter display="chip" placeholder="Selecciona las empresas" />
                        </div>
                        <DataTable :value="reparto" dataKey="id" size="small" scrollable scrollHeight="18rem">
                            <template #empty>Selecciona al menos una empresa.</template>
                            <Column field="nombre" header="Empresa" />
                            <Column header="Importe asignado (MXN)">
                                <template #body="{ data }">
                                    <InputNumber
                                        v-model="data.importe"
                                        mode="currency"
                                        currency="MXN"
                                        locale="es-MX"
                                        :min="0"
                                        :max="999999999999.99"
                                        :minFractionDigits="2"
                                        :maxFractionDigits="2"
                                        :aria-label="`Importe para ${data.nombre}`"
                                        class="saldos-captura"
                                    />
                                </template>
                            </Column>
                        </DataTable>
                        <div class="saldos-cambio-totales" aria-live="polite">
                            <span
                                >Distribuido: <strong>{{ moneda(totalDistribuido) }}</strong></span
                            >
                            <Tag :value="`Por distribuir: ${moneda(diferencia)}`" :severity="diferencia === 0 ? 'success' : 'warn'" />
                        </div>
                    </template>
                    <div class="saldos-cambio-campo">
                        <label for="fecha-cambio">Fecha de los nuevos saldos</label>
                        <DatePicker inputId="fecha-cambio" v-model="fechaCambio" dateFormat="dd/mm/yy" showIcon :manualInput="false" />
                    </div>
                    <div class="saldos-cambio-campo">
                        <label for="motivo-cambio">Motivo del cambio</label>
                        <Textarea id="motivo-cambio" v-model="motivoCambio" rows="3" maxlength="500" placeholder="Describe por qué cambia el manejo del efectivo" />
                    </div>
                    <div class="saldos-cambio-confirmacion">
                        <Checkbox inputId="confirmar-cambio" v-model="aceptaCambio" binary />
                        <label for="confirmar-cambio">Revisé los importes y confirmo el cambio de modalidad conservando el saldo total.</label>
                    </div>
                </form>
            </template>
        </div>
        <template #footer>
            <Button label="Cancelar" outlined :disabled="preparandoCambio || aplicandoCambio" @click="mostrarCambio = false" />
            <Button label="Confirmar cambio" icon="pi pi-check" type="submit" form="formCambioModalidad" :loading="aplicandoCambio" :disabled="preparandoCambio || aplicandoCambio || !cambioValido" />
        </template>
    </Dialog>
</template>

<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';

import proceso from './js/proceso.js';

export default {
    name: 'SaldosIniciales',

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
