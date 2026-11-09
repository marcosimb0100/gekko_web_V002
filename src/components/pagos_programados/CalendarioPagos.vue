<script setup>
import { computed, ref } from 'vue';
import { apiGet_token } from '@/helpers/funcionesApi';
import { pagosDelMes } from '@/helpers/calendarioPagos';

const visible = ref(false);
const cargando = ref(false);
const error = ref('');
const registros = ref([]);
const hoyMexico = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const hoy = ref(hoyMexico());
const anio = ref(Number(hoy.value.slice(0, 4)));
const mes = ref(Number(hoy.value.slice(5, 7)) - 1);
const seleccionado = ref(hoy.value);
const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const tituloMes = computed(() => new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(anio.value, mes.value, 1))));
const agenda = computed(() => pagosDelMes(registros.value, anio.value, mes.value));
const cantidadMes = computed(() => Object.values(agenda.value).reduce((total, pagos) => total + pagos.length, 0));
const pagosSeleccionados = computed(() => agenda.value[seleccionado.value] || []);
const fechaSeleccionada = computed(() => new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${seleccionado.value}T00:00:00Z`)));
const celdas = computed(() => {
    const inicio = new Date(Date.UTC(anio.value, mes.value, 1));
    const vacios = (inicio.getUTCDay() + 6) % 7;
    const ultimo = new Date(Date.UTC(anio.value, mes.value + 1, 0)).getUTCDate();
    return [
        ...Array(vacios).fill(null),
        ...Array.from({ length: ultimo }, (_, indice) => {
            const dia = indice + 1;
            const fecha = `${anio.value}-${String(mes.value + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            return { dia, fecha, cantidad: (agenda.value[fecha] || []).length };
        })
    ];
});
const moneda = (importe) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(importe) || 0);

async function cargar() {
    if (cargando.value) return;
    cargando.value = true;
    registros.value = [];
    error.value = '';
    try {
        // El endpoint fija el permiso de pagos programados en el servidor.
        const respuesta = await apiGet_token('/pagos_programados/');
        if (respuesta.estatus !== 200) {
            error.value = respuesta.estatus === 403 ? 'Tu perfil no tiene acceso a pagos programados.' : respuesta.mensaje || 'No fue posible consultar los pagos.';
            return;
        }
        registros.value = Array.isArray(respuesta.datos?.programaciones) ? respuesta.datos.programaciones : [];
    } catch {
        error.value = 'No fue posible conectar con el servidor. Intenta nuevamente.';
    } finally {
        cargando.value = false;
    }
}
function abrir() {
    hoy.value = hoyMexico();
    anio.value = Number(hoy.value.slice(0, 4));
    mes.value = Number(hoy.value.slice(5, 7)) - 1;
    seleccionado.value = hoy.value;
    visible.value = true;
    cargar();
}
function cambiarMes(salto) {
    const fecha = new Date(Date.UTC(anio.value, mes.value + salto, 1));
    anio.value = fecha.getUTCFullYear();
    mes.value = fecha.getUTCMonth();
    seleccionado.value = fecha.toISOString().slice(0, 10);
}
function irHoy() {
    hoy.value = hoyMexico();
    anio.value = Number(hoy.value.slice(0, 4));
    mes.value = Number(hoy.value.slice(5, 7)) - 1;
    seleccionado.value = hoy.value;
}
</script>

<template>
    <Button icon="pi pi-calendar" text rounded class="cal-acceso" title="Calendario de pagos" aria-label="Abrir calendario de pagos programados" @click="abrir" />
    <Dialog v-model:visible="visible" modal header="Calendario de pagos" :style="{ width: '68rem' }" :breakpoints="{ '960px': '95vw' }">
        <p class="cal-nota">Fechas previstas según los acuerdos activos. No indican que el pago se haya realizado.</p>
        <div class="cal-barra">
            <div class="cal-navegacion">
                <Button icon="pi pi-chevron-left" text rounded aria-label="Mes anterior" :disabled="anio === 1900 && mes === 0" @click="cambiarMes(-1)" />
                <h2 aria-live="polite">{{ tituloMes }}</h2>
                <Button icon="pi pi-chevron-right" text rounded aria-label="Mes siguiente" :disabled="anio === 2100 && mes === 11" @click="cambiarMes(1)" />
            </div>
            <div class="cal-acciones"><Button label="Hoy" outlined size="small" @click="irHoy" /><Button icon="pi pi-refresh" outlined size="small" aria-label="Actualizar pagos" :loading="cargando" @click="cargar" /></div>
        </div>
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <p v-else-if="cargando" role="status">Consultando pagos programados…</p>
        <template v-else>
            <p class="cal-resumen" role="status">{{ cantidadMes }} {{ cantidadMes === 1 ? 'pago programado' : 'pagos programados' }} este mes · Selecciona un día para ver el detalle.</p>
            <div class="cal-contenido">
                <section aria-label="Días del mes">
                    <div class="cal-semana">
                        <span v-for="dia in diasSemana" :key="dia">{{ dia }}</span>
                    </div>
                    <div class="cal-cuadricula">
                        <template v-for="(celda, indice) in celdas" :key="celda ? celda.fecha : `vacio-${indice}`">
                            <button
                                v-if="celda"
                                type="button"
                                class="cal-dia"
                                :class="{ 'cal-con-pagos': celda.cantidad, 'cal-seleccionado': seleccionado === celda.fecha, 'cal-hoy': hoy === celda.fecha }"
                                :aria-pressed="seleccionado === celda.fecha"
                                :aria-current="hoy === celda.fecha ? 'date' : undefined"
                                :aria-label="`${celda.fecha}: ${celda.cantidad} pagos programados`"
                                @click="seleccionado = celda.fecha"
                            >
                                <strong>{{ celda.dia }}</strong
                                ><span v-if="celda.cantidad" class="cal-cantidad"
                                    >{{ celda.cantidad }} <span class="cal-texto-pago">{{ celda.cantidad === 1 ? 'pago' : 'pagos' }}</span></span
                                >
                            </button>
                            <div v-else aria-hidden="true" />
                        </template>
                    </div>
                    <p v-if="!cantidadMes" class="cal-nota">No hay pagos programados para este mes.</p>
                </section>
                <section class="cal-detalle" aria-live="polite" aria-label="Pagos del día seleccionado">
                    <h3>{{ fechaSeleccionada }}</h3>
                    <p v-if="!pagosSeleccionados.length" class="cal-nota">No hay pagos programados para este día.</p>
                    <article v-for="pago in pagosSeleccionados" :key="pago.id" class="cal-pago">
                        <strong>{{ pago.proveedor_nombre }}</strong>
                        <p>{{ pago.concepto }}</p>
                        <small>{{ pago.empresa_nombre }}</small>
                        <div class="cal-importe">{{ pago.variable ? 'Importe según factura' : moneda(pago.importe) }}</div>
                        <small>{{ pago.medio }} · {{ pago.periodicidad }}</small>
                    </article>
                </section>
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.cal-acceso {
    color: var(--p-primary-color);
    flex-shrink: 0;
}
.cal-nota {
    color: var(--p-text-muted-color);
    margin: 0 0 1rem;
    line-height: 1.5;
}
.cal-barra,
.cal-navegacion,
.cal-acciones {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.cal-barra {
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 1rem;
}
.cal-navegacion h2 {
    margin: 0;
    min-width: 12rem;
    text-align: center;
    font-size: 1.2rem;
    text-transform: capitalize;
}
.cal-resumen {
    color: var(--p-text-muted-color);
    font-size: 0.9rem;
}
.cal-contenido {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    gap: 1.5rem;
}
.cal-semana,
.cal-cuadricula {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.35rem;
}
.cal-semana {
    text-align: center;
    color: var(--p-text-muted-color);
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
}
.cal-dia {
    min-height: 4.4rem;
    border: 1px solid var(--p-content-border-color);
    border-radius: 0.6rem;
    background: var(--p-content-background);
    color: var(--p-text-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    cursor: pointer;
}
.cal-con-pagos {
    background: var(--p-primary-50);
    color: var(--p-primary-800);
    border-color: var(--p-primary-300);
}
.cal-hoy strong {
    text-decoration: underline;
    text-underline-offset: 0.25rem;
}
.cal-seleccionado {
    border: 2px solid var(--p-primary-color);
    box-shadow: 0 0 0 1px var(--p-primary-color);
}
.cal-dia:focus-visible {
    outline: 2px solid var(--p-primary-color);
    outline-offset: 3px;
}
.cal-cantidad {
    border-radius: 1rem;
    background: var(--p-primary-color);
    color: var(--p-primary-contrast-color);
    padding: 0.1rem 0.4rem;
    font-size: 0.7rem;
}
.cal-detalle {
    border-left: 1px solid var(--p-content-border-color);
    padding-left: 1.5rem;
    max-height: 30rem;
    overflow-y: auto;
}
.cal-detalle h3 {
    margin: 0 0 1rem;
    font-size: 1rem;
}
.cal-pago {
    border: 1px solid var(--p-content-border-color);
    border-radius: 0.7rem;
    padding: 1rem;
    margin-bottom: 0.75rem;
    overflow-wrap: anywhere;
}
.cal-pago p {
    margin: 0.35rem 0;
}
.cal-pago small {
    color: var(--p-text-muted-color);
    display: block;
}
.cal-importe {
    font-weight: 700;
    margin: 0.75rem 0 0.35rem;
}
@media (max-width: 700px) {
    .cal-contenido {
        grid-template-columns: 1fr;
    }
    .cal-detalle {
        border-left: 0;
        border-top: 1px solid var(--p-content-border-color);
        padding: 1rem 0 0;
    }
    .cal-dia {
        min-height: 3.5rem;
    }
    .cal-texto-pago {
        display: none;
    }
    .cal-navegacion h2 {
        min-width: 9rem;
        font-size: 1rem;
    }
}
</style>
