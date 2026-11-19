<template>
    <Encabezado :titulo="mostrar ? formulario.folio || 'Nueva póliza' : 'Pólizas'" subtitulo="Captura manual de pólizas contables por empresa" icono="pi pi-book">
        <Button icon="pi pi-question-circle" text rounded aria-label="Guía de pólizas" title="Guía de pólizas" @click="mostrarAyuda = true" />
        <GenerarCfdi v-if="!mostrar" @generadas="handleCargar" />
        <Button v-if="!mostrar" label="Nueva póliza" icon="pi pi-plus" class="btn-nuevo" :disabled="cargando || !empresaActual?.activo || !!error || !hayPeriodos" @click="handleNuevo" />
        <template v-else>
            <Button v-if="formulario.id && formulario.estado === 'borrador'" label="Contabilizar" icon="pi pi-check-circle" class="btn-guardar" :disabled="!puedeContabilizar || cargando" @click="handleAbrirContabilizar" />
            <Button v-if="formulario.id && formulario.estado === 'borrador'" label="Anular borrador" icon="pi pi-ban" severity="danger" outlined :disabled="!editable || cargando" @click="handleAbrirAnular" />
            <Button :label="formulario.estado !== 'borrador' ? 'Volver' : 'Cancelar'" icon="pi pi-times" class="btn-cancelar" :disabled="guardando" @click="handleCancelar" />
            <Button v-if="formulario.estado === 'borrador' && !formulario.origen_cobro && !formulario.origen_pago && formulario.origen_cfdi?.tipo !== 'factura_recibida'" label="Guardar borrador" icon="pi pi-save" class="btn-guardar" :loading="guardando" :disabled="!editable || !valido || cargando || periodoActual?.estado !== 'abierto'" @click="handleGuardar" />
        </template>
    </Encabezado>

    <div v-if="!mostrar" class="card polizas-contenido">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="polizas-filtros">
            <div class="campo campo-empresa"><label for="poliza-empresa">Empresa <span class="requerido">*</span></label><Select inputId="poliza-empresa" v-model="empresa" :options="empresas" optionLabel="nombre" optionValue="id" filter showClear placeholder="Selecciona una empresa" :disabled="cargando" @change="handleEmpresa" /></div>
            <div class="campo"><label for="poliza-desde">Desde</label><DatePicker inputId="poliza-desde" v-model="desde" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="cargando" /></div>
            <div class="campo"><label for="poliza-hasta">Hasta</label><DatePicker inputId="poliza-hasta" v-model="hasta" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="cargando" /></div>
            <Button label="Consultar" icon="pi pi-search" outlined :loading="cargando" :disabled="cargando || !empresa" @click="handleCargar" />
        </div>
        <template v-if="empresa">
            <Message v-if="!hayPeriodos && !cargando && !error" severity="info" :closable="false">Primero abre un mes de esta empresa en Periodos contables. Actualiza esta consulta después de abrirlo.</Message>
            <div class="polizas-resumen"><div v-for="r in resumen" :key="r.nombre" class="resumen-item"><span class="resumen-icono"><i :class="r.icono" /></span><div><small>{{ r.nombre }}</small><strong>{{ r.valor }}</strong></div></div></div>
            <div class="polizas-herramientas">
                <IconField><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="Buscar folio, concepto o referencia" aria-label="Buscar pólizas" :disabled="cargando" @update:modelValue="primero = 0" /></IconField>
                <Select v-model="tipo" :options="tipos" optionLabel="nombre" optionValue="valor" showClear placeholder="Todos los tipos" :disabled="cargando" @change="primero = 0" />
                <Select v-model="estado" :options="estados" optionLabel="nombre" optionValue="valor" showClear placeholder="Todos los estados" :disabled="cargando" @change="primero = 0" />
                <Button label="Limpiar" icon="pi pi-filter-slash" outlined :disabled="cargando" @click="handleLimpiar" />
                <Tag value="Solo las contabilizadas afectan saldos" severity="secondary" />
            </div>
            <DataTable v-model:first="primero" :value="filas" :loading="cargando" paginator :rows="25" :rowsPerPageOptions="[10,25,50,100]" scrollable scrollHeight="flex" size="small" class="tabla-polizas">
                <Column header="Folio / fecha" style="width:20%"><template #body="{data}"><div class="dato-doble"><strong>{{ data.folio }}</strong><small>{{ data.fecha }}</small></div></template></Column>
                <Column header="Concepto / referencia" style="width:35%"><template #body="{data}"><div class="dato-doble"><span>{{ data.concepto }}</span><small v-if="data.referencia">{{ data.referencia }}</small></div></template></Column>
                <Column header="Tipo" style="width:12%"><template #body="{data}">{{ handleTipo(data.tipo) }}</template></Column>
                <Column header="Importe" style="width:16%"><template #body="{data}"><div class="dato-doble"><strong>{{ handleMoneda(data.total_cargos) }}</strong><small>{{ data.numero_partidas }} partidas</small></div></template></Column>
                <Column header="Estado" style="width:10%"><template #body="{data}"><Tag :value="handleEstado(data.estado)" :severity="handleEstadoSeverity(data.estado)" /></template></Column>
                <Column header="Opciones" style="width:7%"><template #body="{data}"><Button :icon="data.estado !== 'borrador' ? 'pi pi-eye' : 'pi pi-pencil'" class="btn-nuevo" :aria-label="'Abrir póliza ' + data.folio" title="Abrir póliza" :disabled="cargando" @click="handleEditar(data)" /></template></Column>
                <template #empty>No hay pólizas en el periodo con estos filtros.</template>
            </DataTable>
        </template>
        <div v-else class="polizas-vacio"><i class="pi pi-book" /><h2>Pólizas contables</h2><p>Selecciona una empresa para consultar o capturar sus pólizas.</p></div>
    </div>

    <div v-else class="card polizas-detalle">
        <div class="poliza-contexto"><div><strong>{{ empresaActual?.nombre }}</strong><small>{{ formulario.folio || 'El folio se asignará al guardar' }} · MXN</small></div><Tag :value="handleEstado(formulario.estado)" :severity="handleEstadoSeverity(formulario.estado)" /></div>
        <Message v-if="formulario.origen_cfdi" severity="info" :closable="false">Origen: {{ formulario.origen_cfdi.tipo === 'factura_recibida' ? 'factura recibida' : 'factura emitida' }} {{ formulario.origen_cfdi.serie }} / {{ formulario.origen_cfdi.folio }}. UUID: {{ formulario.origen_cfdi.uuid }}. Esta factura ya está vinculada a esta póliza.</Message>
        <Message v-if="formulario.origen_cobro" severity="info" :closable="false">Cobro de factura {{ formulario.origen_cobro.uuid }} por {{ handleMoneda(formulario.origen_cobro.importe) }}. Las partidas se conservan vinculadas a la conciliación. Puedes contabilizar o anular el borrador; para corregir el origen, anúlalo y revisa la conciliación.</Message>
        <Message v-if="formulario.origen_pago" severity="info" :closable="false">Pago de factura {{ formulario.origen_pago.uuid }} por {{ handleMoneda(formulario.origen_pago.importe) }}. Las partidas se conservan vinculadas a la conciliación. Puedes contabilizar o anular el borrador; para corregir el origen, anúlalo y revisa la conciliación.</Message>
        <Message v-if="errorFormulario" severity="error" :closable="false">{{ errorFormulario }}</Message>
        <Message v-if="formulario.estado === 'borrador' && periodoActual?.estado !== 'abierto'" severity="warn" :closable="false">El periodo de la fecha seleccionada está cerrado o no se ha abierto. No es posible guardar ni contabilizar.</Message>
        <Message v-else-if="formulario.estado === 'borrador' && hayCambios" severity="info" :closable="false">Guarda los cambios antes de contabilizar.</Message>
        <Tabs v-model:value="tab">
            <TabList><Tab value="datos">Datos y partidas</Tab><Tab value="historial">Historial</Tab></TabList>
            <TabPanels>
                <TabPanel value="datos">
                    <div class="poliza-formulario">
                        <Fieldset legend="Datos de la póliza">
                            <div class="form-grid">
                                <div class="campo"><label for="poliza-fecha">Fecha <span class="requerido">*</span></label><DatePicker inputId="poliza-fecha" v-model="formulario.fecha" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="(!editable || !!formulario.origen_cobro || !!formulario.origen_pago || formulario.origen_cfdi?.tipo === 'factura_recibida')" /><small v-if="formulario.id">Al editar se conserva el año del folio.</small></div>
                                <div class="campo"><label for="poliza-tipo">Tipo <span class="requerido">*</span></label><Select inputId="poliza-tipo" v-model="formulario.tipo" :options="tipos" optionLabel="nombre" optionValue="valor" :disabled="(!editable || !!formulario.origen_cobro || !!formulario.origen_pago || formulario.origen_cfdi?.tipo === 'factura_recibida') || !!formulario.id" /></div>
                                <div class="campo concepto-campo"><label for="poliza-concepto">Concepto <span class="requerido">*</span></label><InputText id="poliza-concepto" v-model="formulario.concepto" maxlength="300" :disabled="(!editable || !!formulario.origen_cobro || !!formulario.origen_pago || formulario.origen_cfdi?.tipo === 'factura_recibida')" /></div>
                                <div class="campo ancho-completo"><label for="poliza-referencia">Referencia</label><InputText id="poliza-referencia" v-model="formulario.referencia" maxlength="100" :disabled="(!editable || !!formulario.origen_cobro || !!formulario.origen_pago || formulario.origen_cfdi?.tipo === 'factura_recibida')" /></div>
                            </div>
                        </Fieldset>
                        <Fieldset legend="Partidas">
                            <div class="partidas-herramientas"><span>{{ formulario.partidas.length }} de 200 partidas</span><Button label="Agregar partida" icon="pi pi-plus" outlined :disabled="(!editable || !!formulario.origen_cobro || !!formulario.origen_pago || formulario.origen_cfdi?.tipo === 'factura_recibida') || formulario.partidas.length >= 200" @click="handleAgregarPartida" /></div>
                            <Message v-if="!cuentas.length && editable" severity="warn" :closable="false">No hay cuentas disponibles. Registra cuentas activas que permitan movimientos en el catálogo de esta empresa.</Message>
                            <div class="partidas-lista">
                                <div v-for="(p,indice) in formulario.partidas" :key="indice" class="partida-item">
                                    <span class="partida-numero">{{ indice + 1 }}</span>
                                    <div class="campo partida-cuenta"><label :for="'partida-cuenta-'+indice">Cuenta <span class="requerido">*</span></label><Select :inputId="'partida-cuenta-'+indice" v-model="p.cuenta_id" :options="opcionesCuentas" optionLabel="etiqueta" optionValue="id" optionDisabled="noDisponible" filter placeholder="Selecciona una cuenta" :disabled="(!editable || !!formulario.origen_cobro || !!formulario.origen_pago || formulario.origen_cfdi?.tipo === 'factura_recibida')" /></div>
                                    <div class="campo partida-concepto"><label :for="'partida-concepto-'+indice">Concepto</label><InputText :id="'partida-concepto-'+indice" v-model="p.concepto" maxlength="300" :disabled="(!editable || !!formulario.origen_cobro || !!formulario.origen_pago || formulario.origen_cfdi?.tipo === 'factura_recibida')" /></div>
                                    <div class="campo"><label :for="'partida-cargo-'+indice">Cargo</label><InputNumber :inputId="'partida-cargo-'+indice" v-model="p.cargo" mode="decimal" locale="es-MX" :minFractionDigits="2" :maxFractionDigits="2" :min="0" :max="999999999999.99" :disabled="(!editable || !!formulario.origen_cobro || !!formulario.origen_pago || formulario.origen_cfdi?.tipo === 'factura_recibida')" /></div>
                                    <div class="campo"><label :for="'partida-abono-'+indice">Abono</label><InputNumber :inputId="'partida-abono-'+indice" v-model="p.abono" mode="decimal" locale="es-MX" :minFractionDigits="2" :maxFractionDigits="2" :min="0" :max="999999999999.99" :disabled="(!editable || !!formulario.origen_cobro || !!formulario.origen_pago || formulario.origen_cfdi?.tipo === 'factura_recibida')" /></div>
                                    <Button icon="pi pi-trash" text severity="danger" :aria-label="'Quitar partida '+(indice+1)" title="Quitar partida" :disabled="(!editable || !!formulario.origen_cobro || !!formulario.origen_pago || formulario.origen_cfdi?.tipo === 'factura_recibida') || formulario.partidas.length <= 2" @click="handleQuitarPartida(indice)" />
                                </div>
                            </div>
                            <div class="partidas-totales"><div><small>Total cargos</small><strong>{{ handleMoneda(totales.cargos) }}</strong></div><div><small>Total abonos</small><strong>{{ handleMoneda(totales.abonos) }}</strong></div><div :class="totales.diferencia !== 0 ? 'diferencia-error' : 'diferencia-ok'"><small>Diferencia</small><strong>{{ handleMoneda(totales.diferencia) }}</strong></div></div>
                            <small>Captura un cargo o un abono por partida. Para guardar, los totales deben coincidir. El borrador no afecta saldos.</small>
                        </Fieldset>
                    </div>
                </TabPanel>
                <TabPanel value="historial">
                    <DataTable :value="historial" paginator :rows="10" size="small" class="tabla-historial">
                        <Column header="Fecha"><template #body="{data}">{{ handleFechaHistorial(data.fecha) }}</template></Column>
                        <Column field="usuario" header="Responsable" />
                        <Column field="accion" header="Movimiento" />
                        <Column header="Datos modificados"><template #body="{data}"><div class="historial-campos"><Tag v-for="c in data.cambios" :key="c.campo" :value="c.campo" severity="secondary" /></div></template></Column>
                        <Column header="Detalle"><template #body="{data}"><Button icon="pi pi-eye" label="Ver cambios" text @click="handleCambios(data)" /></template></Column>
                        <template #empty>El historial se genera al guardar la póliza.</template>
                    </DataTable>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
    <Dialog v-model:visible="mostrarCambios" modal header="Detalle de cambios" :style="{width:'65rem',maxWidth:'96vw'}">
        <DataTable :value="cambios" size="small" class="tabla-historial"><Column field="campo" header="Dato" /><Column field="anterior" header="Anterior"><template #body="{data}"><span class="valor-historial">{{ data.anterior }}</span></template></Column><Column field="nuevo" header="Nuevo"><template #body="{data}"><span class="valor-historial">{{ data.nuevo }}</span></template></Column></DataTable>
        <template #footer><Button label="Cerrar" outlined @click="mostrarCambios = false" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarAnular" modal header="Anular borrador de póliza" :closable="!guardando" :closeOnEscape="!guardando" :style="{width:'36rem',maxWidth:'95vw'}">
        <div class="anular-contenido"><strong>{{ formulario.folio }}</strong><p>Se conservarán la póliza y su historial. El borrador dejará de estar disponible para edición.</p>
            <Message v-if="errorAnular" severity="error" :closable="false">{{ errorAnular }}</Message>
            <div class="campo"><label for="anular-motivo">Motivo <span class="requerido">*</span></label><Textarea id="anular-motivo" v-model="motivo" rows="3" maxlength="500" :disabled="guardando" /><small>Entre 5 y 500 caracteres.</small></div>
        </div>
        <template #footer><Button label="Cancelar" outlined :disabled="guardando" @click="mostrarAnular = false" /><Button label="Anular borrador" icon="pi pi-ban" severity="danger" :loading="guardando" :disabled="guardando || motivo.trim().length < 5" @click="handleAnular" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarAyuda" modal header="Guía de pólizas contables" :style="{width:'48rem',maxWidth:'95vw'}">
        <div class="polizas-guia"><section v-for="item in guia" :key="item.titulo"><h3>{{ item.titulo }}</h3><p>{{ item.texto }}</p></section></div>
        <template #footer><Button label="Entendido" icon="pi pi-check" @click="mostrarAyuda = false" /></template>
    </Dialog>

    <Dialog v-model:visible="mostrarContabilizar" modal header="Contabilizar póliza" :closable="!guardando" :closeOnEscape="!guardando" :style="{width:'40rem',maxWidth:'95vw'}">
        <div class="anular-contenido">
            <strong>{{ formulario.folio }} · {{ empresaActual?.nombre }}</strong>
            <p>{{ formulario.concepto }}</p>
            <div class="partidas-totales"><div><small>Cargos</small><strong>{{ handleMoneda(totales.cargos) }}</strong></div><div><small>Abonos</small><strong>{{ handleMoneda(totales.abonos) }}</strong></div></div>
            <Message severity="info" :closable="false">Periodo {{ periodoActual?.anio }}-{{ String(periodoActual?.mes || '').padStart(2,'0') }} abierto. Las partidas se incorporarán a los movimientos contables. Después de confirmar, la póliza quedará protegida contra edición.</Message>
            <Message v-if="errorContabilizar" severity="error" :closable="false">{{ errorContabilizar }}</Message>
        </div>
        <template #footer><Button label="Cancelar" outlined :disabled="guardando" @click="mostrarContabilizar = false" /><Button label="Confirmar contabilización" icon="pi pi-check-circle" class="btn-guardar" :loading="guardando" :disabled="guardando || !puedeContabilizar" @click="handleContabilizar" /></template>
    </Dialog>

</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import DatePicker from 'primevue/datepicker';
import Dialog from 'primevue/dialog';
import Fieldset from 'primevue/fieldset';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Select from 'primevue/select';
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import Tabs from 'primevue/tabs';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';
import proceso from './js/proceso.js';
import GenerarCfdi from './GenerarCfdi.vue';
export default {
    name:'Polizas',
    components:{GenerarCfdi,Encabezado,Button,Column,DataTable,DatePicker,Dialog,Fieldset,IconField,InputIcon,InputNumber,InputText,Message,Select,Tab,TabList,TabPanel,TabPanels,Tabs,Tag,Textarea},
    setup(){return {...proceso()};}
};
</script>
<style scoped>
@import './css/estilo.css';
</style>
